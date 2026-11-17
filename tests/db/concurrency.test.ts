import { eq, like } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { newGuestToken } from "@/lib/guest";
import { orderInputSchema } from "@/lib/orders/input";
import { db } from "@/server/db";
import { orderStops, products, rateLimits, stores } from "@/server/db/schema";
import { DEMO_RESTORE_MINUTES, restoreStaleStores } from "@/server/demo-restore";
import { createOrder } from "@/server/orders";
import { hitRateLimit } from "@/server/rate-limit";
import { PanelError, actOnStop, getPanel, setStoreOpen, updateProduct } from "@/server/store-panel";

afterAll(async () => {
  await db.delete(rateLimits).where(like(rateLimits.key, "test:%"));
  await (db.$client as { end(): Promise<void> }).end();
});

// Miércoles 10:00 en Caracas: las tiendas de prueba están abiertas.
const T0 = Date.UTC(2025, 0, 8, 14, 0);
const AREPERA = "arepera-dona-chela";
const address = { name: "Altamira", line: "Av. Luis Roche, Edif. Los Samanes, apto. 4B", reference: "Frente a la panadería" };
const place = (token = newGuestToken()) =>
  createOrder(orderInputSchema.parse({ delivery: "combined", tipCents: 0, payment: "efectivo", address, items: [{ store: AREPERA, product: "reina", qty: 2 }] }), token, T0);
const outcome = (p: Promise<unknown>) => p.then(() => "ok", (e) => (e instanceof PanelError ? `${e.code}:${e.status}` : String(e)));

describe("concurrencia", () => {
  it("dos pestañas del panel aceptan el mismo pedido a la vez: una gana y la otra recibe 409", async () => {
    await getPanel(AREPERA, T0);
    const o = await place();
    const stop = (await getPanel(AREPERA, T0 + 1_000)).queue.find((s) => s.code === o.code)!;
    const results = await Promise.all(Array.from({ length: 5 }, () => outcome(actOnStop(AREPERA, stop.stopId, "aceptar", undefined, T0 + 2_000))));
    expect(results.filter((r) => r === "ok")).toHaveLength(1);
    expect(results.filter((r) => r === "INVALID_TRANSITION:409")).toHaveLength(4);
    const after = (await getPanel(AREPERA, T0 + 3_000)).queue.find((s) => s.code === o.code)!;
    expect(after.status).toBe("aceptado");
  });

  it("aceptar y rechazar a la vez se resuelven como si hubieran llegado en fila", async () => {
    await getPanel(AREPERA, T0);
    const o = await place();
    const stop = (await getPanel(AREPERA, T0 + 1_000)).queue.find((s) => s.code === o.code)!;
    const [accept, reject] = await Promise.all([
      outcome(actOnStop(AREPERA, stop.stopId, "aceptar", undefined, T0 + 2_000)),
      outcome(actOnStop(AREPERA, stop.stopId, "rechazar", "Se acabó la masa", T0 + 2_000)),
    ]);
    // Solo hay dos órdenes posibles: aceptar → rechazar (rechazar vale desde «aceptado»: las dos pasan)
    // o rechazar → aceptar (el pedido ya está cancelado: aceptar es un 409). Nunca un aceptado con rechazo exitoso.
    expect([["ok", "ok"], ["INVALID_TRANSITION:409", "ok"]]).toContainEqual([accept, reject]);
    const [final] = await db.select({ status: orderStops.status }).from(orderStops).where(eq(orderStops.id, stop.stopId));
    expect(final.status).toBe("cancelado");
  });

  it("pedidos simultáneos reciben números de pedido distintos", async () => {
    const created = await Promise.all(Array.from({ length: 10 }, () => place()));
    const numbers = created.map((o) => Number(o.code!.replace("ÑM-", "")));
    expect(new Set(numbers).size).toBe(10);
  });
});

describe("límite de peticiones", () => {
  const LIMIT = { limit: 10, windowMs: 60_000 };

  it("con 25 peticiones a la vez pasan exactamente 10", async () => {
    const key = `test:burst:${newGuestToken()}`;
    const results = await Promise.all(Array.from({ length: 25 }, () => hitRateLimit(key, LIMIT, T0)));
    expect(results.filter((r) => r.ok)).toHaveLength(10);
    expect(results.filter((r) => !r.ok).every((r) => r.retryAfterS > 0 && r.retryAfterS <= 60)).toBe(true);
  });

  it("la ventana se reinicia cuando vence", async () => {
    const key = `test:window:${newGuestToken()}`;
    for (let i = 0; i < 10; i++) await hitRateLimit(key, LIMIT, T0);
    expect((await hitRateLimit(key, LIMIT, T0 + 30_000)).ok).toBe(false);
    const fresh = await hitRateLimit(key, LIMIT, T0 + 60_000);
    expect(fresh).toMatchObject({ ok: true, remaining: 9 });
  });

  it("cada clave cuenta por separado", async () => {
    const a = `test:a:${newGuestToken()}`;
    const b = `test:b:${newGuestToken()}`;
    for (let i = 0; i < 10; i++) await hitRateLimit(a, LIMIT, T0);
    expect((await hitRateLimit(a, LIMIT, T0)).ok).toBe(false);
    expect((await hitRateLimit(b, LIMIT, T0)).ok).toBe(true);
  });
});

describe("demo compartida: la tienda vuelve sola al seed", () => {
  const storeRow = async () => (await db.select().from(stores).where(eq(stores.slug, AREPERA)))[0];
  const reina = async () => (await db.select().from(products).where(eq(products.slug, "reina")))[0];

  it("un cambio del panel marca la tienda, y pasado el plazo se repone una sola vez aunque lo pidan varias peticiones", async () => {
    const original = await reina();
    await updateProduct(AREPERA, "reina", { priceCents: 1 });
    await setStoreOpen(AREPERA, false);
    const marked = (await storeRow()).catalogChangedAt!;
    expect(marked).toBeInstanceOf(Date);

    // El segundo cambio no reinicia la cuenta.
    await updateProduct(AREPERA, "reina", { priceCents: 2 });
    expect((await storeRow()).catalogChangedAt!.getTime()).toBe(marked.getTime());

    // Antes del plazo no pasa nada.
    expect(await restoreStaleStores(marked.getTime() + 60_000)).toEqual([]);
    expect((await reina()).priceCents).toBe(2);

    // Vencido: varias peticiones a la vez, una sola reposición.
    const later = marked.getTime() + DEMO_RESTORE_MINUTES * 60_000 + 1_000;
    const runs = await Promise.all(Array.from({ length: 4 }, () => restoreStaleStores(later)));
    // Otras pruebas pueden haber dejado tiendas marcadas: lo que importa es que esta salga una sola vez.
    expect(runs.flat().filter((slug) => slug === AREPERA)).toHaveLength(1);
    const st = await storeRow();
    expect(st.isOpen).toBe(true);
    expect(st.catalogChangedAt).toBeNull();
    expect((await reina()).priceCents).toBe(original.priceCents);
  });
});
