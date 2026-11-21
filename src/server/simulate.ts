import "server-only";
import { and, asc, eq, lte } from "drizzle-orm";
import { newSimulatedToken } from "@/lib/guest";
import { zoneBySlug } from "@/lib/geo";
import { orderInputSchema, type OrderInput } from "@/lib/orders/input";
import { db } from "./db";
import { products, storeRoutes, stores } from "./db/schema";
import { OrderError, createOrder } from "./orders";
import { PanelError } from "./store-panel";

/** Nombres de los clientes de prueba (solo para la dirección; no hay cuentas). */
const CUSTOMERS = ["María", "José", "Andreína", "Luis", "Daniela", "Carlos", "Valentina", "Gabriel"];
/** Elección pseudoaleatoria y reproducible a partir de una semilla (las pruebas pasan `now`). */
function rng(seed: number) {
  let x = seed % 2147483647 || 1;
  return () => (x = (x * 48271) % 2147483647) / 2147483647;
}

/**
 * «Simular pedido entrante»: crea un pedido de prueba para la tienda con el mismo flujo que un cliente real
 * (createOrder: precios de la BD, transacción, tasa guardada). Sirve para que el panel no se vea vacío
 * cuando quien prueba la demo todavía no ha pedido nada. El pedido es de un invitado nuevo, desechable como los demás.
 */
export async function simulateIncomingOrder(slug: string, now: number = Date.now()): Promise<{ code: string; id: string }> {
  const [store] = await db.select().from(stores).where(eq(stores.slug, slug)).limit(1);
  if (!store) throw new PanelError("STORE_NOT_FOUND", "No existe esa tienda.", 404);
  const available = await db
    .select({ slug: products.slug, priceCents: products.priceCents })
    .from(products)
    .where(and(eq(products.storeId, store.id), eq(products.isAvailable, true)))
    .orderBy(asc(products.sortOrder));
  if (!available.length) throw new PanelError("PRODUCT_UNAVAILABLE", "La tienda no tiene productos disponibles: repón alguno en Inventario.", 409);
  // Una zona a la que la tienda sí reparte.
  const routes = await db
    .select({ zone: storeRoutes.zone })
    .from(storeRoutes)
    .where(and(eq(storeRoutes.storeId, store.id), lte(storeRoutes.distanceM, store.maxDeliveryM)))
    .orderBy(asc(storeRoutes.distanceM));
  const zones = routes.map((r) => zoneBySlug(r.zone)).filter((z) => z !== undefined);
  if (!zones.length) throw new PanelError("OUT_OF_COVERAGE", "Esta tienda no tiene zonas de entrega cargadas.", 409);
  const rand = rng(now);
  const zone = zones[Math.floor(rand() * Math.min(zones.length, 4))];
  const customer = CUSTOMERS[Math.floor(rand() * CUSTOMERS.length)];

  let lastError: unknown;
  // Algunos productos tienen opciones obligatorias sin valor por defecto: si uno falla, se prueba con otros.
  for (let attempt = 0; attempt < 4; attempt++) {
    const pool = [...available].sort(() => rand() - 0.5);
    const items: OrderInput["items"] = [];
    let subtotal = 0;
    for (const p of pool) {
      if (items.length >= 3 || (items.length >= 1 && subtotal >= store.minOrderCents)) break;
      const qty = 1 + Math.floor(rand() * 2);
      items.push({ store: slug, product: p.slug, qty });
      subtotal += p.priceCents * qty;
    }
    // Hasta alcanzar el pedido mínimo, se sube la cantidad del primero.
    while (subtotal < store.minOrderCents && items[0].qty < 10) {
      items[0].qty++;
      subtotal += pool[0].priceCents;
    }
    const input = orderInputSchema.parse({
      delivery: "combined",
      tipCents: [0, 50, 100][Math.floor(rand() * 3)],
      payment: (["movil", "efectivo", "zelle"] as const)[Math.floor(rand() * 3)],
      address: { name: zone.name, line: `Pedido de prueba de ${customer}, ${zone.name}`, reference: "Simulado desde el panel", lat: zone.lat, lng: zone.lng },
      items,
    });
    try {
      const order = await createOrder(input, newSimulatedToken(), now);
      return { code: order.code ?? order.id, id: order.id };
    } catch (e) {
      if (!(e instanceof OrderError) || e.code !== "INVALID_OPTIONS") throw e;
      lastError = e;
      available.splice(available.findIndex((p) => p.slug === items[0].product), 1);
      if (!available.length) break;
    }
  }
  throw lastError instanceof OrderError ? new PanelError(lastError.code, lastError.message, lastError.status) : new PanelError("INTERNAL", "No se pudo simular el pedido.", 500);
}
