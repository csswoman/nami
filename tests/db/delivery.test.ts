import { and, eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { ZONES, deliveryFeeCents, zoneBySlug } from "@/lib/geo";
import { newGuestToken } from "@/lib/guest";
import { orderInputSchema } from "@/lib/orders/input";
import { EXTRA_STOP_CENTS } from "@/lib/pricing";
import { db } from "@/server/db";
import { storeRoutes, stores } from "@/server/db/schema";
import { getDeliveryQuotes, getStore, getStores } from "@/server/catalog";
import { OrderError, createOrder, quoteOrder } from "@/server/orders";
afterAll(async () => {
  await (db.$client as { end(): Promise<void> }).end();
});
const T0 = Date.UTC(2025, 0, 8, 14, 0); // miércoles 10:00 en Caracas
const ctx = (slug: string) => ({ location: { lat: zoneBySlug(slug)!.lat, lng: zoneBySlug(slug)!.lng }, zone: zoneBySlug(slug)! });
const AREPERA = "arepera-dona-chela";
const PUERTO = "empanadas-el-puerto";
const at = (zone: string) => ({ lat: zoneBySlug(zone)!.lat, lng: zoneBySlug(zone)!.lng });
const address = (zone: string | null) => ({ name: "Casa", line: "Av. Luis Roche, Edif. Los Samanes, apto. 4B", reference: "Frente a la panadería", ...(zone ? at(zone) : {}) });
const place = (items: { store: string; product: string; qty: number }[], zone: string | null, extra: Record<string, unknown> = {}) =>
  createOrder(orderInputSchema.parse({ delivery: "combined", tipCents: 0, payment: "efectivo", address: address(zone), items, ...extra }), newGuestToken(), T0);
const reina = { store: AREPERA, product: "reina", qty: 2 };
const carne = { store: PUERTO, product: "carne-mechada", qty: 2 };
const code = (p: Promise<unknown>) => p.then(() => "ok", (e) => (e instanceof OrderError ? e.code : String(e)));
const routeOf = async (slug: string, zone: string) => {
  const [r] = await db.select({ distanceM: storeRoutes.distanceM, base: stores.deliveryFeeCents, max: stores.maxDeliveryM }).from(storeRoutes).innerJoin(stores, eq(stores.id, storeRoutes.storeId)).where(and(eq(stores.slug, slug), eq(storeRoutes.zone, zone)));
  return r;
};

describe("datos de entrega del seed", () => {
  it("cada tienda tiene ubicación y una ruta por calle a cada zona", async () => {
    const rows = await db.select().from(stores);
    expect(rows.every((s) => s.lat !== null && s.lng !== null)).toBe(true);
    const routes = await db.select().from(storeRoutes);
    expect(routes).toHaveLength(rows.length * ZONES.length);
    expect(routes.every((r) => r.distanceM > 0 && r.durationS > 0 && r.geometry.length >= 2)).toBe(true);
  });
});
describe("tiendas según la dirección", () => {
  it("calcula el envío por distancia con la ruta guardada", async () => {
    const list = await getStores({ delivery: ctx("las-mercedes") });
    const chela = list.find((s) => s.slug === AREPERA)!;
    const r = await routeOf(AREPERA, "las-mercedes");
    expect(chela.delivery).toMatchObject({ distanceM: r.distanceM, covered: true });
    expect(chela.feeCents).toBe(deliveryFeeCents(r.base, r.distanceM));
  });
  it("una tienda lejana cobra más y una fuera de alcance no llega", async () => {
    const near = (await getStores({ delivery: ctx("la-castellana") })).find((s) => s.slug === AREPERA)!;
    const far = (await getStores({ delivery: ctx("los-proceres") })).find((s) => s.slug === AREPERA)!;
    expect(far.feeCents).toBeGreaterThan(near.feeCents);
    const caricuao = await getStores({ delivery: ctx("caricuao") });
    expect(caricuao.filter((s) => s.delivery?.covered)).toHaveLength(0);
    expect(caricuao.find((s) => s.slug === AREPERA)!.delivery).toMatchObject({ covered: false });
  });
  it("sin zona (punto fuera del mapa) ninguna tienda llega", async () => {
    const none = await getStores({ delivery: { location: { lat: 0, lng: 0 }, zone: null } });
    expect(none.every((s) => s.delivery?.covered === false)).toBe(true);
  });
  it("sin contexto de entrega se muestra la tarifa base, sin distancias", async () => {
    const plain = (await getStores()).find((s) => s.slug === AREPERA)!;
    expect(plain.delivery).toBeUndefined();
    expect(plain.feeCents).toBe((await routeOf(AREPERA, "chacao")).base);
  });
  it("la tienda y su cobertura vienen en getStore", async () => {
    const s = (await getStore(AREPERA, ctx("altamira")))!;
    expect(s.delivery?.covered).toBe(true);
    expect(s.delivery?.maxM).toBe(7000);
  });
  it("cotiza envío y cobertura para el mapa", async () => {
    const q = await getDeliveryQuotes("altamira", [AREPERA, "no-existe"]);
    expect(q.stores.map((s) => s.slug)).toEqual([AREPERA]);
    expect(q.reachable).toBeGreaterThan(0);
    expect(q.total).toBeGreaterThanOrEqual(q.reachable);
    const none = await getDeliveryQuotes(null, [AREPERA]);
    expect(none.reachable).toBe(0);
    expect(none.stores[0].covered).toBe(false);
  });
});
describe("pedido con dirección en el mapa", () => {
  it("cobra el envío por distancia", async () => {
    const o = await place([reina], "las-mercedes");
    const r = await routeOf(AREPERA, "las-mercedes");
    expect(o.shippingCents).toBe(deliveryFeeCents(r.base, r.distanceM));
    expect(o.totalCents).toBe(o.subtotalCents + o.shippingCents);
  });
  it("sin punto en el mapa vale la tarifa base", async () => {
    const o = await place([reina], null);
    expect(o.shippingCents).toBe((await routeOf(AREPERA, "chacao")).base);
  });
  it("ignora la zona o el envío que mande el cliente: manda el punto", async () => {
    const o = await place([reina], "las-mercedes", { shippingCents: 1, zone: "caricuao" });
    expect(o.shippingCents).toBeGreaterThan(1);
  });
  it("varias tiendas: el envío más caro más el recargo por parada extra, cada una a su distancia", async () => {
    const o = await place([reina, carne], "los-palos-grandes");
    const a = await routeOf(AREPERA, "los-palos-grandes");
    const b = await routeOf(PUERTO, "los-palos-grandes");
    const fees = [deliveryFeeCents(a.base, a.distanceM), deliveryFeeCents(b.base, b.distanceM)];
    expect(o.shippingCents).toBe(Math.max(...fees) + EXTRA_STOP_CENTS);
  });
  it("rechaza una zona que ninguna tienda cubre y una ubicación fuera del mapa", async () => {
    expect(await code(place([reina], "caricuao"))).toBe("OUT_OF_COVERAGE");
    await expect(createOrder(orderInputSchema.parse({ delivery: "combined", tipCents: 0, payment: "efectivo", address: { ...address(null), lat: 40.4, lng: -3.7 }, items: [reina] }), newGuestToken(), T0)).rejects.toMatchObject({ code: "OUT_OF_COVERAGE" });
  });
  it("dice por qué: la tienda reparte hasta cierta distancia", async () => {
    const r = await routeOf(AREPERA, "los-chaguaramos");
    expect(r.distanceM).toBeGreaterThan(r.max); // 7,2 km por calle > 7 km
    await expect(place([reina], "los-chaguaramos")).rejects.toThrow(/reparte hasta/);
  });
  it("cotizar un pedido usa la misma distancia que crearlo", async () => {
    const input = orderInputSchema.parse({ delivery: "combined", tipCents: 0, payment: "efectivo", address: address("las-mercedes"), items: [reina] });
    const q = await quoteOrder(input, newGuestToken(), T0);
    const o = await createOrder(input, newGuestToken(), T0);
    expect(q.shippingCents).toBe(o.shippingCents);
  });
});
