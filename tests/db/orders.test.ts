import { desc, eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { newGuestToken } from "@/lib/guest";
import { orderInputSchema } from "@/lib/orders/input";
import { reachedStage } from "@/lib/orders/progress";
import { cartTotals } from "@/lib/pricing";
import { db } from "@/server/db";
import { exchangeRates, orderItems, orderStops, orders } from "@/server/db/schema";
import { OrderError, advanceOrder, confirmDelivered, createOrder, getOrder, restartOrder } from "@/server/orders";

afterAll(async () => {
  await (db.$client as { end(): Promise<void> }).end();
});

const address = { name: "Altamira", line: "Av. Luis Roche, Edif. Los Samanes, apto. 4B", reference: "Frente a la panadería" };
const base = { delivery: "combined" as const, tipCents: 100, payment: "efectivo" as const, address };
const item = (store: string, product: string, qty: number, extra: Record<string, unknown> = {}) => ({ store, product, qty, ...extra });
const place = (items: ReturnType<typeof item>[], token = newGuestToken(), extra: Record<string, unknown> = {}) =>
  createOrder(orderInputSchema.parse({ ...base, ...extra, items }), token);
const codeOf = (p: Promise<unknown>) => p.then(() => "ok", (e) => (e instanceof OrderError ? e.code : String(e)));

describe("createOrder", () => {
  it("ignora los montos que mande el cliente y cobra con los precios de la BD", async () => {
    const o = await place(
      [item("arepera-dona-chela", "reina", 2, { priceCents: 1, unitCents: 1, subtotalCents: 1 })],
      newGuestToken(),
      { totalCents: 1, shippingCents: 0, subtotalCents: 1, totalBsCents: 1, exchangeRate: 1 },
    );
    // 2 × $ 3,50 + envío $ 1,20 + propina $ 1,00 (arepa con masa blanca y budare: sin recargo)
    expect(o.subtotalCents).toBe(700);
    expect(o.shippingCents).toBe(120);
    expect(o.totalCents).toBe(700 + 120 + 100);
    expect(o.lines[0].unitCents).toBe(350);
  });

  it("falla si no se alcanza el pedido mínimo de la tienda", async () => {
    expect(await codeOf(place([item("arepera-dona-chela", "domino", 1)]))).toBe("MIN_ORDER_NOT_MET");
  });

  it("falla con un producto agotado, uno inexistente o una tienda desconocida", async () => {
    expect(await codeOf(place([item("arepera-dona-chela", "pelua", 2)]))).toBe("PRODUCT_UNAVAILABLE");
    expect(await codeOf(place([item("arepera-dona-chela", "no-existe", 2)]))).toBe("PRODUCT_NOT_FOUND");
    expect(await codeOf(place([item("no-existe", "reina", 2)]))).toBe("STORE_NOT_FOUND");
  });

  it("guarda una parada por tienda y calcula el envío combinado o separado", async () => {
    const items = [item("arepera-dona-chela", "reina", 2), item("empanadas-el-puerto", "carne-mechada", 2)];
    const combined = await place(items);
    expect(combined.stops.map((s) => s.store.slug)).toEqual(["arepera-dona-chela", "empanadas-el-puerto"]);
    expect(combined.stops.map((s) => s.subtotalCents)).toEqual([700, 400]);
    const fees = [120, 90];
    expect(combined.shippingCents).toBe(cartTotals(fees.map((feeCents) => ({ store: { feeCents }, lines: [] })), "combined").shippingCents);
    const separate = await place(items, newGuestToken(), { delivery: "separate" });
    expect(separate.shippingCents).toBe(210);
    expect(separate.plan).toHaveLength(5);
    const stopRows = await db.select().from(orderStops);
    expect(stopRows.filter((s) => s.orderId === separate.id)).toHaveLength(2);
  });

  it("guarda la tasa y el total en bolívares fijados al crear el pedido", async () => {
    const [{ rate }] = await db.select({ rate: exchangeRates.bsPerUsd }).from(exchangeRates).orderBy(desc(exchangeRates.createdAt)).limit(1);
    const o = await place([item("arepera-dona-chela", "reina", 2)]);
    expect(o.rate).toBe(Number(rate));
    expect(o.totalBsCents).toBe(Math.round(o.totalCents * Number(rate)));
    // Si la tasa cambia después, lo guardado en el pedido no cambia.
    await db.insert(exchangeRates).values({ bsPerUsd: "99.0000", source: "test" });
    const [row] = (await db.select().from(orders)).filter((r) => r.id === o.id);
    expect(Number(row.exchangeRate)).toBe(Number(rate));
    expect(row.totalBsCents).toBe(o.totalBsCents);
    await db.delete(exchangeRates).where(eq(exchangeRates.source, "test"));
  });

  it("valida y cobra las opciones elegidas; un grupo obligatorio sin elección usa la opción por defecto", async () => {
    const o = await place([item("arepera-dona-chela", "reina", 2, { options: { masa: ["integral"], extras: ["tocineta", "aguacate"] }, note: "Sin cebolla" })]);
    expect(o.lines[0].unitCents).toBe(350 + 30 + 90 + 70);
    expect(o.lines[0].note).toBe("Integral · Asada en budare · Aguacate extra · Tocineta · Sin cebolla");
    const rows = await db.select().from(orderItems);
    expect(rows.find((r) => r.note === "Sin cebolla")?.options?.map((x) => x.optionId)).toEqual(["integral", "budare", "aguacate", "tocineta"]);
    expect(await codeOf(place([item("arepera-dona-chela", "reina", 2, { options: { masa: ["no-existe"] } })]))).toBe("INVALID_OPTIONS");
    expect(await codeOf(place([item("arepera-dona-chela", "reina", 2, { options: { extras: ["amarillo", "aguacate", "tocineta", "mano"] } })]))).toBe("INVALID_OPTIONS");
    expect(await codeOf(place([item("arepera-dona-chela", "reina", 2, { options: { inventado: ["x"] } })]))).toBe("INVALID_OPTIONS");
  });

  it("un pedido solo lo ve su invitado", async () => {
    const token = newGuestToken();
    const o = await place([item("arepera-dona-chela", "reina", 2)], token);
    expect((await getOrder(o.id, token))?.id).toBe(o.id);
    expect(await getOrder(o.id, newGuestToken())).toBeNull();
    expect(await getOrder("no-es-un-uuid", token)).toBeNull();
  });
});

describe("recorrido del pedido", () => {
  it("avanza, reinicia y se confirma como entregado", async () => {
    const token = newGuestToken();
    const o = await place([item("arepera-dona-chela", "reina", 2)], token);
    const t0 = Date.now();
    expect(reachedStage(o, t0)).toBe(0);
    const a = (await advanceOrder(o.id, token, t0))!;
    expect(reachedStage(a, t0)).toBe(1);
    expect((await getOrder(o.id, token, t0))?.status).toBe("active");
    let cur = a;
    for (let i = 0; i < 4; i++) cur = (await advanceOrder(o.id, token, t0)) ?? cur;
    expect(reachedStage(cur, t0)).toBe(4);
    const done = (await confirmDelivered(o.id, token, t0))!;
    expect(done.status).toBe("delivered");
    expect(done.deliveredAt).not.toBeNull();
    const [row] = (await db.select().from(orders)).filter((r) => r.id === o.id);
    expect(row.status).toBe("entregado");
    const again = (await restartOrder(o.id, token, t0))!;
    expect(again.status).toBe("active");
    expect(reachedStage(again, t0)).toBe(0);
  });
});

describe("limpieza", () => {
  it("el script borra los pedidos de más de 7 días y deja los recientes", async () => {
    const { execFileSync } = await import("node:child_process");
    const token = newGuestToken();
    const old = await createOrder(orderInputSchema.parse({ ...base, items: [item("arepera-dona-chela", "reina", 2)] }), token, Date.now() - 8 * 86_400_000);
    const fresh = await createOrder(orderInputSchema.parse({ ...base, items: [item("arepera-dona-chela", "reina", 2)] }), token);
    execFileSync("npx", ["tsx", "scripts/cleanup-orders.ts"], { env: process.env, shell: true, stdio: "pipe" });
    expect(await getOrder(old.id, token)).toBeNull();
    expect((await getOrder(fresh.id, token))?.id).toBe(fresh.id);
    expect((await db.select().from(orderItems)).length).toBeGreaterThan(0);
  });
});
