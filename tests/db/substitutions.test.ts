import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { newGuestToken } from "@/lib/guest";
import { orderInputSchema } from "@/lib/orders/input";
import { db } from "@/server/db";
import { orderItems, orderStops, orders, products, stores } from "@/server/db/schema";
import { getStore } from "@/server/catalog";
import { OrderError, createOrder, getOrder } from "@/server/orders";
import { PanelError, getPanel, markOutOfStock, resetStoreCatalog } from "@/server/store-panel";
const MARKET = "abasto-el-saman";
const RESTAURANT = "arepera-dona-chela";
const T0 = Date.UTC(2025, 0, 8, 14, 0); // miércoles 10:00 en Caracas
const address = { name: "Altamira", line: "Av. Luis Roche, Edif. Los Samanes, apto. 4B", reference: "Frente a la panadería" };
type P = { id: string; priceCents: number };
let A: P, B: P, C: P; // tres productos disponibles del mercado, de distinto precio
beforeAll(async () => {
  const all = (await getStore(MARKET))!.sections.flatMap((s) => s.products).filter((p) => !p.soldOut && p.priceCents >= 100);
  const byPrice = [...all].sort((x, y) => y.priceCents - x.priceCents);
  [A, B, C] = [byPrice[0], byPrice[1], byPrice[byPrice.length - 1]];
});
afterAll(async () => {
  await resetStoreCatalog(MARKET);
  await (db.$client as { end(): Promise<void> }).end();
});
type Sub = { kind: "remove" | "similar" | "product"; product?: string };
const line = (p: P, qty: number, substitution?: Sub) => ({ store: MARKET, product: p.id, qty, substitution });
const place = (items: ReturnType<typeof line>[], extra: Record<string, unknown> = {}, token = newGuestToken()) =>
  createOrder(orderInputSchema.parse({ delivery: "combined", tipCents: 0, payment: "efectivo", address, items, ...extra }), token, T0).then(async (o) => ({ o, token }));
const itemRows = async (orderId: string) => {
  const stop = (await db.select().from(orderStops).where(eq(orderStops.orderId, orderId)))[0];
  return { stop, items: await db.select().from(orderItems).where(eq(orderItems.stopId, stop.id)).orderBy(orderItems.id) };
};
const out = (stopId: string, itemId: string, replacement?: string, at = T0 + 10_000) => markOutOfStock(MARKET, stopId, itemId, replacement, at);
const code = (p: Promise<unknown>) => p.then(() => "ok", (e) => (e instanceof PanelError || e instanceof OrderError ? e.code : String(e)));
const qtyFor = (p: P) => Math.ceil(2000 / p.priceCents); // sube del mínimo del mercado

describe("sustituciones al pedir", () => {
  it("guarda qué hacer con cada producto y la tienda lo ve en su bandeja", async () => {
    const { o } = await place([line(A, qtyFor(A), { kind: "similar" }), line(B, 1, { kind: "product", product: C.id }), line(C, 1)]);
    const { items } = await itemRows(o.id);
    expect(items.map((i) => i.substitution?.kind ?? null).sort()).toEqual([null, "product", "similar"]);
    const panel = await getPanel(MARKET, T0 + 5_000);
    const stop = panel.queue.find((s) => s.code === o.code)!;
    expect(stop.items.find((i) => i.slug === B.id)?.substitution).toEqual({ kind: "product", product: C.id });
  });
  it("rechaza un reemplazo que no existe o que es el mismo producto", async () => {
    expect(await code(place([line(A, qtyFor(A), { kind: "product", product: "no-existe" })]))).toBe("PRODUCT_NOT_FOUND");
    expect(await code(place([line(A, qtyFor(A), { kind: "product", product: A.id })]))).toBe("PRODUCT_NOT_FOUND");
  });
  it("en un restaurante la política se ignora", async () => {
    const o = await createOrder(orderInputSchema.parse({ delivery: "combined", tipCents: 0, payment: "efectivo", address, items: [{ store: RESTAURANT, product: "reina", qty: 2, substitution: { kind: "similar" } }] }), newGuestToken(), T0);
    const [row] = await db.select().from(orderItems).innerJoin(orderStops, eq(orderStops.id, orderItems.stopId)).where(eq(orderStops.orderId, o.id));
    expect(row.order_items.substitution).toBeNull();
  });
});
describe("«No hay» desde el panel", () => {
  it("quitar: baja el subtotal y el total, deja el producto agotado y se lo cuenta al cliente", async () => {
    const { o, token } = await place([line(A, qtyFor(A), { kind: "remove" }), line(C, 12)]);
    const { stop, items } = await itemRows(o.id);
    const item = items.find((i) => i.productSlug === A.id)!;
    await out(stop.id, item.id);
    const after = (await getOrder(o.id, token, T0 + 10_000))!;
    const [row] = await db.select().from(orders).where(eq(orders.id, o.id));
    expect(after.lines.map((l) => l.productId)).toEqual([C.id]);
    expect(after.subtotalCents).toBe(12 * C.priceCents);
    expect(after.totalCents).toBe(12 * C.priceCents + o.shippingCents);
    expect(row.totalBsCents).toBe(Math.round(after.totalCents * Number(row.exchangeRate)));
    expect(after.changes?.[0]).toContain("lo quitamos");
    const [prod] = await db.select().from(products).where(eq(products.id, item.productId!));
    expect(prod.isAvailable).toBe(false);
    expect((await itemRows(o.id)).stop.subtotalCents).toBe(12 * C.priceCents);
  });
  it("sin política se quita (lo más seguro)", async () => {
    await resetStoreCatalog(MARKET);
    const { o } = await place([line(A, qtyFor(A)), line(C, 12)]);
    const { stop, items } = await itemRows(o.id);
    await out(stop.id, items.find((i) => i.productSlug === A.id)!.id);
    expect((await itemRows(o.id)).items.find((i) => i.productSlug === A.id)?.resolution).toEqual({ kind: "removed" });
  });
  it("«algo parecido»: la tienda elige y el reemplazo nunca cobra más", async () => {
    await resetStoreCatalog(MARKET);
    const { o, token } = await place([line(B, qtyFor(B), { kind: "similar" })]);
    const { stop, items } = await itemRows(o.id);
    const id = items[0].id;
    expect(await code(out(stop.id, id))).toBe("INVALID_INPUT"); // falta con qué reemplazarlo
    expect(await code(out(stop.id, id, B.id))).toBe("INVALID_INPUT"); // no puede ser el mismo
    expect(await code(out(stop.id, id, "no-existe"))).toBe("PRODUCT_NOT_FOUND");
    await out(stop.id, id, C.id);
    const after = (await getOrder(o.id, token, T0 + 10_000))!;
    // C es el más barato: se cobra su precio.
    expect(after.lines[0]).toMatchObject({ productId: C.id, unitCents: Math.min(B.priceCents, C.priceCents), qty: qtyFor(B) });
    expect(after.subtotalCents).toBe(qtyFor(B) * Math.min(B.priceCents, C.priceCents));
    expect(after.changes?.[0]).toContain("Lo cambiamos por");
  });
  it("producto elegido por el cliente: se usa solo; si tampoco hay, la tienda elige otro", async () => {
    await resetStoreCatalog(MARKET);
    const { o } = await place([line(A, qtyFor(A), { kind: "product", product: B.id })]);
    const { stop, items } = await itemRows(o.id);
    await db.update(products).set({ isAvailable: false }).where(eq(products.slug, B.id));
    expect(await code(out(stop.id, items[0].id))).toBe("PRODUCT_UNAVAILABLE");
    await out(stop.id, items[0].id, C.id);
    expect((await itemRows(o.id)).items[0]).toMatchObject({ productSlug: C.id });
    await resetStoreCatalog(MARKET);
    const second = await place([line(A, qtyFor(A), { kind: "product", product: B.id })]);
    const rows = await itemRows(second.o.id);
    await out(rows.stop.id, rows.items[0].id);
    expect((await itemRows(second.o.id)).items[0].productSlug).toBe(B.id);
  });
  it("no se puede resolver dos veces, ni con el pedido listo, ni en un restaurante ni de otra tienda", async () => {
    await resetStoreCatalog(MARKET);
    const { o } = await place([line(A, qtyFor(A), { kind: "remove" }), line(C, 12)]);
    const { stop, items } = await itemRows(o.id);
    const a = items.find((i) => i.productSlug === A.id)!;
    await out(stop.id, a.id);
    expect(await code(out(stop.id, a.id))).toBe("INVALID_TRANSITION");
    await db.update(orderStops).set({ status: "listo" }).where(eq(orderStops.id, stop.id));
    await db.update(orders).set({ holdStage: null, plan: [0, 0, 0, 100, 200], startAt: new Date(T0 + 3_600_000 * 24), stageAt: [T0, T0, T0, null, null] }).where(eq(orders.id, o.id));
    expect(await code(out(stop.id, items.find((i) => i.productSlug === C.id)!.id, undefined, T0 + 20_000))).toBe("INVALID_TRANSITION");
    expect(await code(markOutOfStock(RESTAURANT, stop.id, a.id, undefined, T0))).toBe("INVALID_INPUT");
    expect(await code(markOutOfStock("no-existe", stop.id, a.id, undefined, T0))).toBe("STORE_NOT_FOUND");
    const [other] = await db.select().from(stores).where(eq(stores.slug, "automercado-avila"));
    expect(other).toBeDefined();
    expect(await code(markOutOfStock("automercado-avila", stop.id, a.id, undefined, T0))).toBe("NOT_FOUND");
  });
  it("si no hay ninguno de los productos, se cancela la parada y el pedido", async () => {
    await resetStoreCatalog(MARKET);
    const { o, token } = await place([line(A, qtyFor(A), { kind: "remove" })]);
    const { stop, items } = await itemRows(o.id);
    await out(stop.id, items[0].id);
    expect((await itemRows(o.id)).stop.status).toBe("cancelado");
    expect((await getOrder(o.id, token, T0 + 10_000))?.status).toBe("cancelled");
  });
  it("el descuento del cupón nunca supera lo que queda por pagar", async () => {
    await resetStoreCatalog(MARKET);
    const { o, token } = await place([line(A, qtyFor(A), { kind: "remove" }), line(C, 12)], { coupon: "ENVIOGRATIS" });
    expect(o.discountCents).toBe(o.shippingCents);
    const { stop, items } = await itemRows(o.id);
    await out(stop.id, items.find((i) => i.productSlug === A.id)!.id);
    const after = (await getOrder(o.id, token, T0 + 10_000))!;
    expect(after.totalCents).toBe(after.subtotalCents + after.shippingCents + after.tipCents - (after.discountCents ?? 0));
  });
});
