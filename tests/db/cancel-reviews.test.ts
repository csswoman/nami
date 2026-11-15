import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { newGuestToken } from "@/lib/guest";
import { orderInputSchema } from "@/lib/orders/input";
import { reachedStage } from "@/lib/orders/progress";
import { db } from "@/server/db";
import { orderStops, orders, reviews, stores } from "@/server/db/schema";
import { getStore, getStores } from "@/server/catalog";
import { OrderError, cancelOrder, confirmDelivered, createOrder, getOrder } from "@/server/orders";
import { listReviews, reviewStats, submitReview } from "@/server/reviews";
import { getPanel } from "@/server/store-panel";
afterAll(async () => {
  await db.delete(reviews);
  await (db.$client as { end(): Promise<void> }).end();
});
const T0 = Date.UTC(2025, 0, 8, 14, 0); // miércoles 10:00 en Caracas
const MIN = 60_000;
const address = { name: "Altamira", line: "Av. Luis Roche, Edif. Los Samanes, apto. 4B", reference: "Frente a la panadería" };
const AREPERA = "arepera-dona-chela";
const PUERTO = "empanadas-el-puerto";
const place = (items: { store: string; product: string; qty: number }[], token = newGuestToken()) =>
  createOrder(orderInputSchema.parse({ delivery: "combined", tipCents: 0, payment: "efectivo", address, items }), token, T0);
const reina = { store: AREPERA, product: "reina", qty: 2 };
const carne = { store: PUERTO, product: "carne-mechada", qty: 2 };
const code = (p: Promise<unknown>) => p.then(() => "ok", (e) => (e instanceof OrderError ? e.code : String(e)));
const unattend = () => db.update(stores).set({ panelSeenAt: null });

describe("cancelar pedido", () => {
  it("cancela antes de «En camino», guarda el motivo y las tiendas lo ven", async () => {
    await unattend();
    const token = newGuestToken();
    const o = await place([reina], token);
    const c = (await cancelOrder(o.id, token, "  Me equivoqué de pedido ", T0 + 5_000))!;
    expect(c.status).toBe("cancelled");
    expect(c.cancelReason).toBe("Me equivoqué de pedido");
    const stops = await db.select().from(orderStops).where(eq(orderStops.orderId, o.id));
    expect(stops.every((s) => s.status === "cancelado")).toBe(true);
    expect(stops[0].rejectReason).toContain("Me equivoqué de pedido");
    // El panel de la tienda lo muestra entre los cerrados.
    const panel = await getPanel(AREPERA, T0 + 6_000);
    expect(panel.queue.some((s) => s.code === o.code)).toBe(false);
    expect(panel.done.find((s) => s.code === o.code)).toMatchObject({ status: "cancelado" });
  });
  it("pide un motivo de 3 a 200 caracteres", async () => {
    const token = newGuestToken();
    const o = await place([reina], token);
    expect(await code(cancelOrder(o.id, token, " ", T0))).toBe("INVALID_INPUT");
    expect(await code(cancelOrder(o.id, token, "x".repeat(201), T0))).toBe("INVALID_INPUT");
    expect((await getOrder(o.id, token, T0))?.status).toBe("active");
  });
  it("no se puede cancelar cuando ya va en camino, ni dos veces", async () => {
    await unattend();
    const token = newGuestToken();
    const o = await place([reina], token);
    const later = T0 + 3 * MIN;
    expect(reachedStage((await getOrder(o.id, token, later))!, later)).toBeGreaterThanOrEqual(3);
    expect(await code(cancelOrder(o.id, token, "Ya no lo quiero", later))).toBe("NOT_CANCELLABLE");
    const o2 = await place([reina], token);
    await cancelOrder(o2.id, token, "Ya no lo quiero", T0);
    expect(await code(cancelOrder(o2.id, token, "Otra vez", T0))).toBe("NOT_CANCELLABLE");
  });
  it("solo lo cancela su invitado", async () => {
    const o = await place([reina]);
    expect(await cancelOrder(o.id, newGuestToken(), "Hola mundo", T0)).toBeNull();
  });
  it("cancela aunque la tienda lo esté atendiendo desde su panel", async () => {
    await getPanel(AREPERA, T0);
    const token = newGuestToken();
    const o = await place([reina], token);
    expect(o.hold).toBe(0);
    expect((await cancelOrder(o.id, token, "Tarda demasiado", T0 + 5_000))?.status).toBe("cancelled");
    const [row] = await db.select().from(orders).where(eq(orders.id, o.id));
    expect(row.holdStage).toBeNull();
  });
});
describe("reseñas", () => {
  it("no se reseña un pedido en curso ni uno cancelado", async () => {
    await unattend();
    const token = newGuestToken();
    const o = await place([reina], token);
    expect(await code(submitReview(o.id, token, { rating: 5 }, T0))).toBe("NOT_REVIEWABLE");
    await cancelOrder(o.id, token, "Me arrepentí", T0);
    expect(await code(submitReview(o.id, token, { rating: 5 }, T0))).toBe("NOT_REVIEWABLE");
  });
  it("valida la calificación y de quién es el pedido", async () => {
    const token = newGuestToken();
    const o = await place([reina], token);
    await confirmDelivered(o.id, token, T0 + 3 * MIN);
    expect(await code(submitReview(o.id, token, { rating: 6 }, T0 + 4 * MIN))).toBe("INVALID_INPUT");
    expect(await code(submitReview(o.id, token, { rating: 4, tags: ["Inventada"] }, T0 + 4 * MIN))).toBe("INVALID_INPUT");
    expect(await submitReview(o.id, newGuestToken(), { rating: 5 }, T0 + 4 * MIN)).toBeNull();
  });
  it("guarda la reseña de un pedido entregado y la calificación de la tienda deja de ser fija", async () => {
    await db.delete(reviews);
    const before = (await getStore(AREPERA))!.rating;
    const token = newGuestToken();
    const o = await place([reina], token);
    await confirmDelivered(o.id, token, T0 + 3 * MIN);
    expect(await submitReview(o.id, token, { rating: 1, tags: ["Llegó rápido"], comment: " Frío " }, T0 + 4 * MIN)).toEqual({ stores: 1 });
    const after = (await getStore(AREPERA))!;
    expect(Number(after.rating!.replace(",", "."))).toBeLessThan(Number(before!.replace(",", ".")));
    const listed = (await getStores()).find((s) => s.slug === AREPERA)!;
    expect(listed.rating).toBe(after.rating);
    const [{ id }] = await db.select({ id: stores.id }).from(stores).where(eq(stores.slug, AREPERA));
    expect(await listReviews(id)).toEqual([{ rating: 1, tags: ["Llegó rápido"], comment: "Frío", createdAt: T0 + 4 * MIN }]);
    expect((await reviewStats([id])).get(id)).toEqual({ count: 1, sum: 1 });
  });
  it("volver a enviar corrige la reseña en vez de duplicarla", async () => {
    await db.delete(reviews);
    const token = newGuestToken();
    const o = await place([reina], token);
    await confirmDelivered(o.id, token, T0 + 3 * MIN);
    await submitReview(o.id, token, { rating: 2 }, T0 + 4 * MIN);
    await submitReview(o.id, token, { rating: 5, comment: "Mejoró" }, T0 + 5 * MIN);
    const rows = await db.select().from(reviews);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ rating: 5, comment: "Mejoró" });
  });
  it("un pedido con varias tiendas deja una reseña por tienda", async () => {
    await db.delete(reviews);
    const token = newGuestToken();
    const o = await place([reina, carne], token);
    await confirmDelivered(o.id, token, T0 + 3 * MIN);
    expect(await submitReview(o.id, token, { rating: 4 }, T0 + 4 * MIN)).toEqual({ stores: 2 });
    expect(await db.select().from(reviews)).toHaveLength(2);
  });
  it("una tienda sin calificación de partida toma el promedio de sus reseñas", async () => {
    await db.delete(reviews);
    const market = "abasto-el-saman";
    expect((await getStore(market))!.rating).toBeNull();
    const token = newGuestToken();
    const o = await place([{ store: market, product: (await getStore(market))!.sections[0].products[0].id, qty: 12 }], token);
    await confirmDelivered(o.id, token, T0 + 3 * MIN);
    await submitReview(o.id, token, { rating: 4 }, T0 + 4 * MIN);
    expect((await getStore(market))!.rating).toBe("4,0");
  });
});
