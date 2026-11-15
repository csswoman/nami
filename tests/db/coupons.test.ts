import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { newGuestToken } from "@/lib/guest";
import { orderInputSchema } from "@/lib/orders/input";
import { db } from "@/server/db";
import { coupons, orders } from "@/server/db/schema";
import { OrderError, createOrder, quoteOrder } from "@/server/orders";
afterAll(async () => {
  await db.delete(coupons).where(eq(coupons.code, "VENCIDO"));
  await (db.$client as { end(): Promise<void> }).end();
});
const T0 = Date.UTC(2025, 0, 8, 14, 0); // miércoles 10:00 en Caracas
const address = { name: "Altamira", line: "Av. Luis Roche, Edif. Los Samanes, apto. 4B", reference: "Frente a la panadería" };
const input = (items: { store: string; product: string; qty: number }[], coupon?: string, extra: Record<string, unknown> = {}) =>
  orderInputSchema.parse({ delivery: "combined", tipCents: 0, payment: "efectivo", address, items, coupon, ...extra });
const reina = (qty: number) => ({ store: "arepera-dona-chela", product: "reina", qty });
const carne = (qty: number) => ({ store: "empanadas-el-puerto", product: "carne-mechada", qty });
const code = (p: Promise<unknown>) => p.then(() => "ok", (e) => (e instanceof OrderError ? e.code : String(e)));
const place = (i: ReturnType<typeof input>, token = newGuestToken()) => createOrder(i, token, T0);

describe("cupones al crear el pedido", () => {
  it("NAMI10: 10 % del subtotal; el total y los bolívares ya vienen con el descuento", async () => {
    const o = await place(input([reina(4)], "nami10"));
    // 4 × $ 3,50 = $ 14,00; envío $ 1,20; descuento $ 1,40
    expect(o.subtotalCents).toBe(1400);
    expect(o.shippingCents).toBe(120);
    expect(o.discountCents).toBe(140);
    expect(o.couponCode).toBe("NAMI10");
    expect(o.totalCents).toBe(1400 + 120 - 140);
    expect(o.totalBsCents).toBe(Math.round(o.totalCents * (o.rate ?? 0)));
  });
  it("ignora el descuento que mande el cliente", async () => {
    const o = await place(input([reina(4)], "NAMI10", { discountCents: 99999, totalCents: 1 }));
    expect(o.discountCents).toBe(140);
  });
  it("ENVIOGRATIS descuenta el envío si se llega al mínimo", async () => {
    const o = await place(input([reina(4)], "ENVIOGRATIS"));
    expect(o.discountCents).toBe(120);
    expect(o.totalCents).toBe(1400);
    expect(await code(place(input([reina(2)], "ENVIOGRATIS")))).toBe("COUPON_MIN_NOT_MET");
  });
  it("AREPA2X1 regala la arepa más barata de cada par, solo en esa tienda", async () => {
    const o = await place(input([reina(2)], "AREPA2X1"));
    expect(o.discountCents).toBe(350);
    expect(o.totalCents).toBe(700 + 120 - 350);
    // Una sola arepa (más bebidas para llegar al mínimo de la tienda): no hay par que regalar.
    expect(await code(place(input([reina(1), { store: "arepera-dona-chela", product: "guayoyo", qty: 2 }], "AREPA2X1")))).toBe("COUPON_NOT_APPLICABLE");
    expect(await code(place(input([carne(2)], "AREPA2X1")))).toBe("COUPON_NOT_APPLICABLE");
  });
  it("el mínimo de NAMI10 no se alcanza con un pedido chico", async () => {
    expect(await code(place(input([reina(2)], "NAMI10")))).toBe("COUPON_MIN_NOT_MET");
  });
  it("un código que no existe es COUPON_INVALID", async () => {
    expect(await code(place(input([reina(4)], "NOEXISTE")))).toBe("COUPON_INVALID");
  });
  it("un cupón vencido es COUPON_EXPIRED", async () => {
    await db.insert(coupons).values({ code: "VENCIDO", percent: 20, expiresAt: new Date(T0 - 1000) }).onConflictDoNothing();
    expect(await code(place(input([reina(4)], "vencido")))).toBe("COUPON_EXPIRED");
  });
  it("BIENVENIDA solo vale en el primer pedido del invitado", async () => {
    const token = newGuestToken();
    const first = await place(input([reina(2)], "BIENVENIDA"), token);
    expect(first.discountCents).toBe(120);
    expect(await code(place(input([reina(2)], "BIENVENIDA"), token))).toBe("COUPON_NOT_APPLICABLE");
  });
  it("un pedido cancelado no cuenta como primer pedido", async () => {
    const token = newGuestToken();
    const first = await place(input([reina(2)]), token);
    await db.update(orders).set({ status: "cancelado" }).where(eq(orders.id, first.id));
    expect((await place(input([reina(2)], "BIENVENIDA"), token)).discountCents).toBe(120);
  });
  it("sin cupón no hay descuento", async () => {
    const o = await place(input([reina(2)]));
    expect(o.discountCents).toBe(0);
    expect(o.couponCode ?? null).toBeNull();
  });
});
describe("cotizar un cupón", () => {
  it("devuelve lo mismo que cobra el pedido y no crea nada", async () => {
    const token = newGuestToken();
    const i = input([reina(4)], "NAMI10", { tipCents: 100 });
    const q = await quoteOrder(i, token, T0);
    const before = (await db.select().from(orders).where(eq(orders.guestToken, token))).length;
    expect(before).toBe(0);
    const o = await place(i, token);
    expect(q).toMatchObject({ subtotalCents: o.subtotalCents, discountCents: o.discountCents, totalCents: o.totalCents, couponCode: "NAMI10" });
  });
  it("falla igual que el pedido si el cupón no sirve", async () => {
    expect(await code(quoteOrder(input([reina(2)], "NAMI10"), newGuestToken(), T0))).toBe("COUPON_MIN_NOT_MET");
  });
});
