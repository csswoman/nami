import { eq, inArray } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { newGuestToken } from "@/lib/guest";
import { orderInputSchema } from "@/lib/orders/input";
import { reachedStage } from "@/lib/orders/progress";
import { DEMAND_INFO } from "@/lib/pricing/demand";
import { db } from "@/server/db";
import { coupons, orderStops, orders, riderSessions, stores } from "@/server/db/schema";
import { getStoreMetrics } from "@/server/metrics";
import { ACCEPT_TIMEOUT_MS, COMPENSATION_CENTS, RIDER_WAIT_MS, TIMEOUT_REASON } from "@/server/order-flow";
import { OrderError, createOrder, getOrder } from "@/server/orders";
import { getRiderBoard, riderAct } from "@/server/rider";
import { simulateIncomingOrder } from "@/server/simulate";
import { PanelError, actOnStop, getPanel } from "@/server/store-panel";

// Miércoles 15 de enero de 2025, 10:00 en Caracas: otro día que el resto de las pruebas, para no cruzar paneles ni repartidores.
const T = Date.UTC(2025, 0, 15, 14, 0);
const S = 1_000;
const MIN = 60_000;
const AREPERA = "arepera-dona-chela";
const PUERTO = "empanadas-el-puerto";
const address = { name: "Altamira", line: "Av. Luis Roche, Edif. Los Samanes, apto. 4B", reference: "Frente a la panadería" };
type Item = { store: string; product: string; qty: number };
const reina = (qty = 2): Item => ({ store: AREPERA, product: "reina", qty });
const carne = (): Item => ({ store: PUERTO, product: "carne-mechada", qty: 2 });
const place = (items: Item[], token = newGuestToken(), now = T, extra: { coupon?: string } = {}, ctx = {}) =>
  createOrder(orderInputSchema.parse({ delivery: "combined", tipCents: 0, payment: "efectivo", address, items, ...extra }), token, now, ctx);
const codeOf = (p: Promise<unknown>) => p.then(() => "ok", (e) => (e instanceof PanelError || e instanceof OrderError ? e.code : String(e)));
async function stopOf(orderId: string, slug: string) {
  const [store] = await db.select().from(stores).where(eq(stores.slug, slug));
  const all = await db.select().from(orderStops).where(eq(orderStops.orderId, orderId));
  return all.find((s) => s.storeId === store.id)!;
}
const closePanels = () => db.update(stores).set({ panelSeenAt: null }).where(inArray(stores.slug, [AREPERA, PUERTO]));

beforeAll(closePanels);
afterEach(async () => {
  // Un repartidor conectado haría esperar a los pedidos de otras pruebas.
  await db.delete(riderSessions);
  await closePanels();
});
afterAll(async () => {
  await (db.$client as { end(): Promise<void> }).end();
});

describe("una tienda rechaza su parte de un pedido con varias tiendas", () => {
  it("no se cobran sus productos ni su envío, y el cliente lo ve en el pedido", async () => {
    await getPanel(AREPERA, T);
    await getPanel(PUERTO, T);
    const token = newGuestToken();
    const o = await place([reina(), carne()], token);
    const areperaStop = await stopOf(o.id, AREPERA);
    const puertoStop = await stopOf(o.id, PUERTO);
    expect(areperaStop.feeCents).toBeGreaterThan(0);
    await actOnStop(PUERTO, puertoStop.id, "rechazar", "Se acabó la carne", T + 5 * S);
    const after = (await getOrder(o.id, token, T + 6 * S))!;
    expect(after.status).toBe("active");
    expect(after.subtotalCents).toBe(areperaStop.subtotalCents);
    expect(after.shippingCents).toBe(areperaStop.feeCents);
    expect(after.totalCents).toBe(after.subtotalCents + after.shippingCents + after.tipCents);
    expect(after.changes?.[0]).toMatch(/no pudo atender su parte \(Se acabó la carne\)/);
    expect(after.stops.find((s) => s.store.slug === PUERTO)?.cancelled).toBe(true);
    const [row] = await db.select().from(orders).where(eq(orders.id, o.id));
    expect(row.totalBsCents).toBe(Math.round(row.totalCents * Number(row.exchangeRate)));
  });
});

describe("la tienda no responde a tiempo", () => {
  it("con el panel abierto y sin aceptar, se cancela sola y el cliente recibe un cupón de disculpa", async () => {
    await getPanel(AREPERA, T);
    const token = newGuestToken();
    const o = await place([reina()], token);
    expect(o.hold).toBe(0);
    // Antes del plazo, sigue esperando.
    await getPanel(AREPERA, T + ACCEPT_TIMEOUT_MS - 10 * S);
    expect((await getOrder(o.id, token, T + ACCEPT_TIMEOUT_MS - 9 * S))!.status).toBe("active");
    // La tienda sigue con el panel abierto pero no acepta.
    await getPanel(AREPERA, T + ACCEPT_TIMEOUT_MS + 5 * S);
    const gone = (await getOrder(o.id, token, T + ACCEPT_TIMEOUT_MS + 6 * S))!;
    expect(gone.status).toBe("cancelled");
    expect(gone.cancelReason).toBeNull();
    expect(gone.compensation).toEqual({ code: `PERDON-${o.code!.slice(3)}`, amountCents: COMPENSATION_CENTS });
    expect((await stopOf(o.id, AREPERA)).rejectReason).toBe(TIMEOUT_REASON);

    // El cupón es solo de ese invitado y se usa una vez.
    const code = gone.compensation!.code;
    const later = T + 20 * MIN;
    expect(await codeOf(place([reina()], newGuestToken(), later, { coupon: code }))).toBe("COUPON_INVALID");
    const used = await place([reina()], token, later, { coupon: code });
    expect(used.discountCents).toBe(COMPENSATION_CENTS);
    expect(await codeOf(place([reina()], token, later + MIN, { coupon: code }))).toBe("COUPON_NOT_APPLICABLE");
    const [c] = await db.select().from(coupons).where(eq(coupons.code, code));
    expect(c.guestToken).toBe(token);
  });

  it("si el cliente cancela, no hay cupón de disculpa", async () => {
    const { cancelOrder } = await import("@/server/orders");
    const token = newGuestToken();
    const o = await place([reina()], token);
    const c = (await cancelOrder(o.id, token, "Me equivoqué de dirección", T + 5 * S))!;
    expect(c.status).toBe("cancelled");
    expect(c.compensation ?? null).toBeNull();
  });
});

describe("recargo por demanda (modo demo)", () => {
  it("con lluvia el servidor suma el recargo y alarga el viaje", async () => {
    const normal = await place([reina()]);
    const rain = await place([reina()], newGuestToken(), T, {}, { demand: "lluvia" });
    expect(rain.surchargeCents).toBe(DEMAND_INFO.lluvia.surchargeCents);
    expect(rain.surchargeReason).toBe("lluvia");
    expect(rain.totalCents).toBe(normal.totalCents + DEMAND_INFO.lluvia.surchargeCents);
    expect(rain.plan[4] - rain.plan[3]).toBeGreaterThan(normal.plan[4] - normal.plan[3]);
  });
});

describe("app del repartidor", () => {
  it("con un repartidor conectado, el pedido listo lo espera; él lo toma, lo recoge y llega", async () => {
    // Como en /demo: cliente y repartidor son el mismo invitado (comparten la cookie).
    const token = newGuestToken();
    const rider = token;
    await getRiderBoard(rider, T);
    const o = await place([reina()], token);
    // Pasa a «buscando motorizado» (etapa 2) y se queda ahí mientras el repartidor tenga la app abierta.
    const board = await getRiderBoard(rider, T + 31 * S);
    expect(board.available.map((a) => a.id)).toContain(o.id);
    const waiting = (await getOrder(o.id, token, T + 50 * S))!;
    expect(waiting.hold).toBe(2);
    expect(reachedStage(waiting, T + 50 * S)).toBe(2);

    await riderAct(rider, o.id, "tomar", T + 52 * S);
    expect(await codeOf(riderAct(newGuestToken(), o.id, "tomar", T + 53 * S))).toBe("INVALID_TRANSITION");
    expect(await codeOf(riderAct(rider, o.id, "llegue", T + 54 * S))).toBe("INVALID_TRANSITION");
    const taken = (await getOrder(o.id, token, T + 70 * S))!;
    expect(taken.riderLive).toBe(true);
    expect(reachedStage(taken, T + 70 * S)).toBe(2);

    await riderAct(rider, o.id, "recoger", T + 75 * S);
    const riding = (await getOrder(o.id, token, T + 80 * S))!;
    expect(reachedStage(riding, T + 80 * S)).toBe(3);
    // Aunque pase el tiempo del viaje, no llega hasta que el repartidor lo diga.
    await getRiderBoard(rider, T + 3 * MIN);
    const late = (await getOrder(o.id, token, T + 3 * MIN))!;
    expect(reachedStage(late, T + 3 * MIN)).toBe(3);

    await riderAct(rider, o.id, "llegue", T + 3 * MIN + 5 * S);
    const arrived = (await getOrder(o.id, token, T + 3 * MIN + 6 * S))!;
    expect(reachedStage(arrived, T + 3 * MIN + 6 * S)).toBe(4);
    expect(arrived.stageAt[4]).toBe(T + 3 * MIN + 5 * S);
    expect((await getRiderBoard(rider, T + 3 * MIN + 7 * S)).done.map((d) => d.id)).toContain(o.id);
  });

  it("con cinco repartidores tomando el mismo pedido simulado a la vez, gana exactamente uno", async () => {
    const riders = Array.from({ length: 5 }, () => newGuestToken());
    const t0 = T + 10 * MIN;
    await Promise.all(riders.map((r) => getRiderBoard(r, t0)));
    // Los pedidos simulados desde el panel los puede llevar cualquier repartidor.
    const o = await simulateIncomingOrder(PUERTO, t0);
    expect((await getRiderBoard(riders[0], t0 + 31 * S)).available.map((a) => a.id)).toContain(o.id);
    const results = await Promise.all(riders.map((r) => codeOf(riderAct(r, o.id, "tomar", t0 + 32 * S))));
    expect(results.filter((r) => r === "ok")).toHaveLength(1);
    expect(results.filter((r) => r === "INVALID_TRANSITION")).toHaveLength(4);
  });

  it("si el repartidor cierra la app, el pedido sigue solo", async () => {
    const token = newGuestToken();
    const rider = token;
    const t0 = T + 20 * MIN;
    await getRiderBoard(rider, t0);
    const o = await place([reina()], token, t0);
    await getRiderBoard(rider, t0 + 31 * S);
    await riderAct(rider, o.id, "tomar", t0 + 32 * S);
    // Nadie vuelve a consultar el tablero: a los 30 s el repartidor se da por desconectado.
    const released = (await getOrder(o.id, token, t0 + 70 * S))!;
    expect(released.hold ?? null).toBeNull();
    expect(released.riderLive).toBe(false);
    const moved = (await getOrder(o.id, token, t0 + 3 * MIN))!;
    expect(reachedStage(moved, t0 + 3 * MIN)).toBeGreaterThanOrEqual(3);
  });
});

describe("el repartidor no frena a los demás", () => {
  it("no retiene los pedidos de otros visitantes de la demo", async () => {
    const t0 = T + 30 * MIN;
    const rider = newGuestToken();
    const other = newGuestToken();
    await getRiderBoard(rider, t0);
    const o = await place([reina()], other, t0);
    const board = await getRiderBoard(rider, t0 + 31 * S);
    expect(board.available.map((a) => a.id)).not.toContain(o.id);
    expect((await getOrder(o.id, other, t0 + 32 * S))!.hold ?? null).toBeNull();
    expect(await codeOf(riderAct(rider, o.id, "tomar", t0 + 33 * S))).toBe("INVALID_TRANSITION");
  });

  it("un pedido listo espera al repartidor solo un rato; después sigue solo y no vuelve a esperar", async () => {
    const t0 = T + 35 * MIN;
    const token = newGuestToken();
    await getRiderBoard(token, t0);
    const o = await place([reina()], token, t0);
    await getRiderBoard(token, t0 + 31 * S);
    expect((await getOrder(o.id, token, t0 + 32 * S))!.hold).toBe(2);
    // El repartidor sigue conectado pero no lo toma.
    const late = t0 + 31 * S + RIDER_WAIT_MS + 5 * S;
    await getRiderBoard(token, late);
    const released = (await getOrder(o.id, token, late + S))!;
    expect(released.hold ?? null).toBeNull();
    await getRiderBoard(token, late + 20 * S);
    const moved = (await getOrder(o.id, token, late + 2 * MIN))!;
    expect(reachedStage(moved, late + 2 * MIN)).toBeGreaterThanOrEqual(3);
  });
});

describe("panel: simular pedido entrante y métricas", () => {
  it("el servidor crea un pedido de prueba que aparece en la bandeja", async () => {
    const t0 = T + 40 * MIN;
    await getPanel(AREPERA, t0);
    const sim = await simulateIncomingOrder(AREPERA, t0 + S);
    expect(sim.code).toMatch(/^ÑM-\d+$/);
    const panel = await getPanel(AREPERA, t0 + 2 * S);
    expect(panel.queue.map((s) => s.code)).toContain(sim.code);
  });

  it("las métricas cuadran: neto = venta − cupones de la tienda − comisión", async () => {
    const m = await getStoreMetrics(AREPERA, T + 2 * 3_600_000);
    expect(m.orders).toBeGreaterThan(0);
    expect(m.days).toHaveLength(7);
    expect(m.days.reduce((n, d) => n + d.salesCents, 0)).toBe(m.salesCents);
    const s = m.settlement;
    expect(s.netCents).toBe(s.grossCents - s.storeDiscountCents - s.commissionCents);
    expect(m.commissionPercent).toBe(18);
    expect(m.cancelled).toBeGreaterThan(0);
    expect(m.topProducts[0]?.name).toBeTruthy();
  });
});
