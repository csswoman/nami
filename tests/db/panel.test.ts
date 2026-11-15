import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { newGuestToken } from "@/lib/guest";
import { orderInputSchema } from "@/lib/orders/input";
import { reachedStage } from "@/lib/orders/progress";
import { db } from "@/server/db";
import { orderStops, orders, stores } from "@/server/db/schema";
import { createOrder, getOrder } from "@/server/orders";
import { getStore } from "@/server/catalog";
import { PanelError, actOnStop, getInventory, getPanel, getSchedule, resetStoreCatalog, setSchedule, setStoreOpen, updateProduct } from "@/server/store-panel";
afterAll(async () => {
  await (db.$client as { end(): Promise<void> }).end();
});
// Miércoles 10:00 en Caracas: las tiendas de prueba están abiertas.
const T0 = Date.UTC(2025, 0, 8, 14, 0);
const MIN = 60_000;
const address = { name: "Altamira", line: "Av. Luis Roche, Edif. Los Samanes, apto. 4B", reference: "Frente a la panadería" };
const item = (store: string, product: string, qty: number) => ({ store, product, qty });
const place = (items: ReturnType<typeof item>[], token = newGuestToken(), now = T0) =>
  createOrder(orderInputSchema.parse({ delivery: "combined", tipCents: 0, payment: "efectivo", address, items }), token, now);
const AREPERA = "arepera-dona-chela";
const PUERTO = "empanadas-el-puerto";
const reina = (qty = 2) => item(AREPERA, "reina", qty);
const carne = () => item(PUERTO, "carne-mechada", 2);
async function stopOf(orderId: string, slug: string) {
  const [store] = await db.select().from(stores).where(eq(stores.slug, slug));
  const [stop] = await db.select().from(orderStops).where(eq(orderStops.orderId, orderId));
  const all = await db.select().from(orderStops).where(eq(orderStops.orderId, orderId));
  return all.find((s) => s.storeId === store.id) ?? stop;
}
const act = (slug: string, stopId: string, action: Parameters<typeof actOnStop>[2], now: number, reason?: string) => actOnStop(slug, stopId, action, reason, now);
const codeOf = (p: Promise<unknown>) => p.then(() => "ok", (e) => (e instanceof PanelError ? `${e.code}:${e.status}` : String(e)));
describe("panel de tienda: modo automático", () => {
  it("sin panel abierto el pedido avanza solo por tiempo", async () => {
    await db.update(stores).set({ panelSeenAt: null }).where(eq(stores.slug, AREPERA));
    const token = newGuestToken();
    const o = await place([reina()], token);
    expect(o.hold ?? null).toBeNull();
    const later = (await getOrder(o.id, token, T0 + 3 * MIN))!;
    expect(reachedStage(later, T0 + 3 * MIN)).toBeGreaterThanOrEqual(3);
  });
});
describe("panel de tienda: modo manual", () => {
  it("con el panel abierto, el pedido espera a la tienda aunque pase el tiempo", async () => {
    await getPanel(AREPERA, T0 - 5_000);
    const token = newGuestToken();
    const o = await place([reina()], token);
    expect(o.hold).toBe(0);
    const waited = (await getOrder(o.id, token, T0 + 10_000))!;
    expect(reachedStage(waited, T0 + 10_000)).toBe(0);
    const panel = await getPanel(AREPERA, T0 + 10_000);
    const stop = panel.queue.find((s) => s.code === o.code)!;
    expect(stop.status).toBe("recibido");
    expect(stop.actions).toEqual(["aceptar", "rechazar"]);
    expect(stop.items[0]).toMatchObject({ name: expect.any(String), qty: 2 });
  });
  it("aceptar, preparar y dejar listo mueve al cliente etapa por etapa y luego sigue el motorizado", async () => {
    await getPanel(AREPERA, T0);
    const token = newGuestToken();
    const o = await place([reina()], token);
    const stop = await stopOf(o.id, AREPERA);
    await act(AREPERA, stop.id, "aceptar", T0 + 1 * MIN);
    let cur = (await getOrder(o.id, token, T0 + 1 * MIN))!;
    expect(reachedStage(cur, T0 + 1 * MIN)).toBe(1);
    await act(AREPERA, stop.id, "preparar", T0 + 2 * MIN);
    await getPanel(AREPERA, T0 + 20 * MIN); // el panel sigue abierto
    cur = (await getOrder(o.id, token, T0 + 20 * MIN))!;
    expect(reachedStage(cur, T0 + 20 * MIN)).toBe(1);
    await act(AREPERA, stop.id, "listo", T0 + 4 * MIN);
    cur = (await getOrder(o.id, token, T0 + 4 * MIN))!;
    expect(reachedStage(cur, T0 + 4 * MIN)).toBe(2);
    const [row] = await db.select().from(orders).where(eq(orders.id, o.id));
    expect(row.status).toBe("buscando_motorizado");
    expect(row.holdStage).toBeNull();
    // Desde que quedó listo, el recorrido sigue por tiempo: sale la moto y llega.
    cur = (await getOrder(o.id, token, T0 + 4 * MIN + 90_000))!;
    expect(reachedStage(cur, T0 + 4 * MIN + 90_000)).toBeGreaterThanOrEqual(3);
  });
  it("una transición inválida es un 409 y no cambia nada", async () => {
    await getPanel(AREPERA, T0);
    const o = await place([reina()]);
    const stop = await stopOf(o.id, AREPERA);
    expect(await codeOf(act(AREPERA, stop.id, "listo", T0))).toBe("INVALID_TRANSITION:409");
    expect(await codeOf(act(AREPERA, stop.id, "preparar", T0))).toBe("INVALID_TRANSITION:409");
    await act(AREPERA, stop.id, "aceptar", T0);
    expect(await codeOf(act(AREPERA, stop.id, "aceptar", T0))).toBe("INVALID_TRANSITION:409");
    expect((await stopOf(o.id, AREPERA)).status).toBe("aceptado");
  });
  it("rechazar pide un motivo y cancela un pedido de una sola tienda", async () => {
    await getPanel(AREPERA, T0);
    const token = newGuestToken();
    const o = await place([reina()], token);
    const stop = await stopOf(o.id, AREPERA);
    expect(await codeOf(act(AREPERA, stop.id, "rechazar", T0, "  "))).toBe("INVALID_INPUT:400");
    await act(AREPERA, stop.id, "rechazar", T0, "Se acabó la harina");
    const cur = (await getOrder(o.id, token, T0))!;
    expect(cur.status).toBe("cancelled");
    expect((await stopOf(o.id, AREPERA)).rejectReason).toBe("Se acabó la harina");
    expect(await codeOf(act(AREPERA, stop.id, "aceptar", T0))).toBe("INVALID_TRANSITION:409");
  });
  it("una tienda no puede actuar sobre la parada de otra", async () => {
    await getPanel(AREPERA, T0);
    const o = await place([reina()]);
    const stop = await stopOf(o.id, AREPERA);
    expect(await codeOf(act(PUERTO, stop.id, "aceptar", T0))).toBe("NOT_FOUND:404");
    expect(await codeOf(act("no-existe", stop.id, "aceptar", T0))).toBe("STORE_NOT_FOUND:404");
    expect(await codeOf(act(AREPERA, "no-es-uuid", "aceptar", T0))).toBe("NOT_FOUND:404");
  });
  it("con varias tiendas, el pedido espera a la más atrasada; si una rechaza, las otras siguen", async () => {
    await getPanel(AREPERA, T0);
    await getPanel(PUERTO, T0);
    const token = newGuestToken();
    const o = await place([reina(), carne()], token);
    const a = await stopOf(o.id, AREPERA);
    const p = await stopOf(o.id, PUERTO);
    const t = (s: number) => T0 + s * 1000; // todo dentro de los 30 s en que los paneles cuentan como abiertos
    await act(AREPERA, a.id, "aceptar", t(10));
    let cur = (await getOrder(o.id, token, t(10)))!;
    expect(reachedStage(cur, t(10))).toBe(0);
    await act(PUERTO, p.id, "rechazar", t(12), "Sin cazón");
    cur = (await getOrder(o.id, token, t(12)))!;
    expect(cur.status).toBe("active");
    expect(reachedStage(cur, t(12))).toBe(1);
    await act(AREPERA, a.id, "preparar", t(20));
    await act(AREPERA, a.id, "listo", t(25));
    cur = (await getOrder(o.id, token, t(25)))!;
    expect(reachedStage(cur, t(25))).toBe(2);
    expect((await stopOf(o.id, PUERTO)).status).toBe("cancelado");
  });
  it("si todas las tiendas rechazan, se cancela el pedido", async () => {
    await getPanel(AREPERA, T0);
    await getPanel(PUERTO, T0);
    const token = newGuestToken();
    const o = await place([reina(), carne()], token);
    await act(AREPERA, (await stopOf(o.id, AREPERA)).id, "rechazar", T0, "Cerramos");
    await act(PUERTO, (await stopOf(o.id, PUERTO)).id, "rechazar", T0, "Cerramos");
    expect((await getOrder(o.id, token, T0))?.status).toBe("cancelled");
  });
  it("si cierran el panel, el pedido vuelve a avanzar solo desde la etapa en que estaba", async () => {
    await getPanel(AREPERA, T0);
    const token = newGuestToken();
    const o = await place([reina()], token);
    await act(AREPERA, (await stopOf(o.id, AREPERA)).id, "aceptar", T0 + MIN);
    // Pasa más de 30 s sin que el panel consulte.
    const cur = (await getOrder(o.id, token, T0 + 5 * MIN))!;
    expect(cur.hold ?? null).toBeNull();
    expect(reachedStage(cur, T0 + 5 * MIN)).toBe(1);
    const later = (await getOrder(o.id, token, T0 + 5 * MIN + 3 * MIN))!;
    expect(reachedStage(later, T0 + 8 * MIN)).toBeGreaterThanOrEqual(3);
  });
});
describe("interruptor abrir/cerrar", () => {
  it("cierra y reabre la tienda", async () => {
    await setStoreOpen(AREPERA, false);
    expect((await getPanel(AREPERA, T0)).store.isOpen).toBe(false);
    await setStoreOpen(AREPERA, true);
    expect((await getPanel(AREPERA, T0)).store.isOpen).toBe(true);
  });
});
describe("inventario", () => {
  it("agotar y reponer un producto se ve en el catálogo del cliente al instante", async () => {
    await updateProduct(AREPERA, "reina", { available: false });
    const sold = (await getStore(AREPERA))!.sections.flatMap((x) => x.products).find((p) => p.id === "reina")!;
    expect(sold.soldOut).toBe(true);
    await expect(place([reina()])).rejects.toMatchObject({ code: "PRODUCT_UNAVAILABLE" });
    await updateProduct(AREPERA, "reina", { available: true });
    expect((await getInventory(AREPERA)).find((p) => p.slug === "reina")?.isAvailable).toBe(true);
    await place([reina()]);
  });
  it("cambiar el precio cambia lo que se cobra", async () => {
    await updateProduct(AREPERA, "reina", { priceCents: 500 });
    const o = await place([reina()]);
    expect(o.lines[0].unitCents).toBe(500);
    expect(o.subtotalCents).toBe(1000);
    await resetStoreCatalog(AREPERA);
  });
  it("valida el precio y el producto", async () => {
    expect(await codeOf(updateProduct(AREPERA, "reina", { priceCents: 0 }))).toBe("INVALID_INPUT:400");
    expect(await codeOf(updateProduct(AREPERA, "reina", { priceCents: 12.5 }))).toBe("INVALID_INPUT:400");
    expect(await codeOf(updateProduct(AREPERA, "reina", { priceCents: 1e9 }))).toBe("INVALID_INPUT:400");
    expect(await codeOf(updateProduct(AREPERA, "reina", { available: "si" }))).toBe("INVALID_INPUT:400");
    expect(await codeOf(updateProduct(AREPERA, "reina", {}))).toBe("INVALID_INPUT:400");
    expect(await codeOf(updateProduct(AREPERA, "no-existe", { available: false }))).toBe("PRODUCT_NOT_FOUND:404");
    // El producto de otra tienda no se toca desde esta.
    expect(await codeOf(updateProduct(PUERTO, "reina", { available: false }))).toBe("PRODUCT_NOT_FOUND:404");
  });
  it("reponer catálogo devuelve precios, stock y estado al seed", async () => {
    await updateProduct(AREPERA, "reina", { priceCents: 999, available: false });
    await setStoreOpen(AREPERA, false);
    await resetStoreCatalog(AREPERA);
    const item = (await getInventory(AREPERA)).find((p) => p.slug === "reina")!;
    expect(item).toMatchObject({ priceCents: 350, isAvailable: true });
    expect((await getPanel(AREPERA, T0)).store.isOpen).toBe(true);
    expect(await codeOf(resetStoreCatalog("no-existe"))).toBe("STORE_NOT_FOUND:404");
  });
});
describe("horario editable", () => {
  it("guarda el horario y lo valida", async () => {
    const week = [0, 1, 2, 3, 4].map((day) => ({ day, opensAt: 480, closesAt: 900 }));
    expect(await setSchedule(AREPERA, week)).toHaveLength(5);
    expect(await getSchedule(AREPERA)).toEqual(week);
    expect(await codeOf(setSchedule(AREPERA, [{ day: 0, opensAt: 900, closesAt: 480 }]))).toBe("INVALID_INPUT:400");
    expect(await getSchedule(AREPERA)).toEqual(week);
    await resetStoreCatalog(AREPERA);
    expect(await getSchedule(AREPERA)).toHaveLength(7);
  });
  it("un pedido a una tienda con el día cerrado se programa para la próxima apertura", async () => {
    // T0 es miércoles (día 2): la tienda solo abre jueves a las 9:00.
    await setSchedule(AREPERA, [{ day: 3, opensAt: 540, closesAt: 900 }]);
    const o = await place([reina()]);
    // Jueves 9:00 Caracas = 13:00 UTC.
    expect(o.scheduledFor).toBe(Date.UTC(2025, 0, 9, 13, 0));
    await resetStoreCatalog(AREPERA);
  });
});
