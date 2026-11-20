/**
 * Datos de demo listos para Postgres (tiendas, horarios, productos y opciones) y la escritura que los aplica.
 * Los usan el seed (scripts/seed.ts) y el botón "Reponer catálogo" del panel de tienda.
 */
import { eq } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import { RESTAURANTS, STORES } from "@/lib/demo/catalog";
import { MARKETS } from "@/lib/demo/mercado";
import { BAKERY_SLUGS } from "@/lib/demo/tiendas";
import { optionGroupsFor, type OptionGroup } from "@/lib/demo/producto";
import { ZONES, storeLocation } from "@/lib/geo";
import routeCacheJson from "./route-cache.json";
import { estimateRoute, routeKey, type RouteCache } from "./seed-routes";
import { coupons, productOptionGroups, productOptions, products, storeHours, storeRoutes, stores } from "./schema";
/** "3:00 p. m." (o "Abre mañana a las 6:00 a. m.") → minutos desde la medianoche; null si no hay hora. */
function clockMinutes(text: string): number | null {
  const m = text.match(/(\d{1,2}):(\d{2})\s*([ap])\. m\./);
  if (!m) return null;
  return (Number(m[1]) % 12) * 60 + Number(m[2]) + (m[3] === "p" ? 720 : 0);
}
/** Horario a partir de los textos de demo. Si cierra antes de abrir, cierra después de medianoche (> 1440). */
function hoursOf(opensText: string | null, closesText: string | null): { opensAt: number | null; closesAt: number | null } {
  const opensAt = opensText ? clockMinutes(opensText) : null;
  let closesAt = closesText ? clockMinutes(closesText) : null;
  if (closesAt !== null && closesAt <= (opensAt ?? 0)) closesAt += 1440;
  return { opensAt, closesAt };
}
/** "20–30 min" → [20, 30]. */
function etaOf(text: string): { etaMin: number | null; etaMax: number | null } {
  const m = text.match(/(\d+)\D+(\d+)/);
  return m ? { etaMin: Number(m[1]), etaMax: Number(m[2]) } : { etaMin: null, etaMax: null };
}
/** Mañana a las 7:00 a. m. de Caracas (UTC-4): el "Vuelve mañana" de los agotados de demo. */
function tomorrowSevenCaracas(): Date {
  const c = new Date(Date.now() - 4 * 3_600_000);
  return new Date(Date.UTC(c.getUTCFullYear(), c.getUTCMonth(), c.getUTCDate() + 1, 11));
}
type SeedProduct = {
  slug: string; name: string; description: string; priceCents: number; imageUrl: string | null; icon: string | null;
  section: string; sectionTitle: string; sortOrder: number; unit: string | null; oldPriceCents: number | null; stock: number | null; isAvailable: boolean; soldOutUntil: Date | null;
  groups: OptionGroup[];
};
type SeedStore = {
  slug: string; name: string; category: "comida" | "mercado" | "farmacia" | "tienda"; description: string;
  imageUrl: string | null; deliveryFeeCents: number; isOpen: boolean;
  kind: "restaurante" | "mercado"; minOrderCents: number; initials: string; color: string;
  opensAt: number | null; closesAt: number | null; rating: string | null; reviews: string | null;
  etaMin: number | null; etaMax: number | null; plusFree: boolean; area: string | null; tags: string[]; verticals: number[];
  products: SeedProduct[];
};
// Restaurantes del listado y el resto de tiendas con menú (panaderías, tiendas cerradas).

/** Rutas ya calculadas con OSRM (las completa `npm run db:seed` la primera vez). */
export const ROUTE_CACHE = routeCacheJson as unknown as RouteCache;
export function buildSeedStores(): SeedStore[] {
  const soldOutUntil = tomorrowSevenCaracas();
    const rank = (slug: string) => { const i = RESTAURANTS.findIndex((r) => r.slug === slug); return i < 0 ? 99 : i; };
  const restaurants: SeedStore[] = Object.values(STORES).sort((a, b) => rank(a.slug) - rank(b.slug)).map((d) => ({
    slug: d.slug, name: d.name, category: "comida", description: d.kind, imageUrl: `/brand/food/${d.heroImage}.jpg`,
    deliveryFeeCents: d.feeCents, isOpen: d.open,
    kind: "restaurante", minOrderCents: d.minOrderCents, initials: d.initials, color: d.color,
    ...hoursOf(d.opensAt, d.openUntil), rating: d.rating.replace(",", "."), reviews: d.reviews,
    ...etaOf(d.time), area: d.kind.split(" · ").at(-1) ?? null,
    plusFree: RESTAURANTS.find((r) => r.slug === d.slug)?.plusFree ?? false,
    tags: RESTAURANTS.find((r) => r.slug === d.slug)?.tags ?? [],
    verticals: [...(RESTAURANTS.some((r) => r.slug === d.slug) ? [0] : []), ...(BAKERY_SLUGS.includes(d.slug) ? [4] : [])],
    products: d.menu.flatMap((s) => s.items.map((i) => ({
      slug: i.id, name: i.name, description: i.desc, priceCents: i.priceCents, imageUrl: i.image ?? null, icon: i.icon,
      section: s.id, sectionTitle: s.title, sortOrder: 0, unit: null, oldPriceCents: null, stock: i.low ?? null, isAvailable: !i.soldOut, soldOutUntil: i.soldOut ? soldOutUntil : null,
      groups: optionGroupsFor(s.id),
    }))),
  }));
  const markets: SeedStore[] = Object.values(MARKETS).map((m) => ({
    slug: m.slug, name: m.name, category: m.kind === "Farmacia" ? "farmacia" : m.kind === "Tienda" ? "tienda" : "mercado", description: m.kind,
    imageUrl: `/brand/stores/${m.slug}.jpg`, deliveryFeeCents: m.feeCents, isOpen: true,
    kind: "mercado", minOrderCents: m.minOrderCents, initials: m.initials, color: m.color,
    // "Abierto todo el día" / "24 horas" → sin horario; "Hasta las 9:00 p. m." → solo hora de cierre.
    ...(m.hours === "Abierto 24 horas" ? { opensAt: 0, closesAt: 1440 } : hoursOf(null, m.hours)), rating: null, reviews: null,
    ...etaOf(m.time), area: m.area, plusFree: false, tags: [], verticals: [m.vertical],
    products: m.sections.flatMap((s) => s.products.map((p) => ({
      slug: p.id, name: p.name, description: p.unit, priceCents: p.priceCents, imageUrl: p.image ?? null, icon: null,
      section: s.id, sectionTitle: s.title, sortOrder: 0, unit: p.unit, oldPriceCents: p.oldPriceCents ?? null, stock: p.stock ?? null, isAvailable: !p.soldOut, soldOutUntil: p.soldOut ? soldOutUntil : null,
      groups: [],
    }))),
  }));
  return [...restaurants, ...markets];
}
export type { SeedStore, SeedProduct };
/** Cualquier base o transacción de drizzle sobre Postgres. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Conn = PgDatabase<any, any, any>;
/** Inserta o actualiza una tienda del seed por slug y reemplaza su horario y sus productos (con opciones). Devuelve su id. */
export async function upsertSeedStore(tx: Conn, s: SeedStore, sortOrder: number, routes: RouteCache = ROUTE_CACHE): Promise<string> {
  const { products: items, ...rest } = s;
  const loc = storeLocation(s.slug, s.area);
  const row = { ...rest, sortOrder, lat: loc.lat, lng: loc.lng, catalogChangedAt: null };
  const [st] = await tx.insert(stores).values(row).onConflictDoUpdate({ target: stores.slug, set: row }).returning({ id: stores.id });
  // Borrar los productos arrastra sus grupos y opciones (cascade).
  await tx.delete(products).where(eq(products.storeId, st.id));
  // Horario semanal: el mismo turno todos los días (se edita después desde el panel de la tienda).
  await tx.delete(storeHours).where(eq(storeHours.storeId, st.id));
  await tx.insert(storeHours).values(Array.from({ length: 7 }, (_, day) => ({ storeId: st.id, day, opensAt: rest.opensAt ?? 0, closesAt: rest.closesAt ?? 1440 })));
  // Rutas por calle de la tienda a cada zona (de la caché; sin ella, una estimación en línea recta).
  await tx.delete(storeRoutes).where(eq(storeRoutes.storeId, st.id));
  await tx.insert(storeRoutes).values(
    ZONES.map((z) => {
      const r = routes[routeKey(s.slug, z.slug, loc)] ?? estimateRoute(loc, z);
      return { storeId: st.id, zone: z.slug, distanceM: r.distanceM, durationS: r.durationS, geometry: r.geometry, source: r.source };
    }),
  );
  const rows = await tx
    .insert(products)
    .values(items.map((p, i) => ({ ...p, sortOrder: i, storeId: st.id })))
    .returning({ id: products.id, slug: products.slug });
  const idOf = new Map(rows.map((r) => [r.slug, r.id]));
  for (const p of items) {
    for (const [gi, g] of p.groups.entries()) {
      const [grp] = await tx
        .insert(productOptionGroups)
        .values({ productId: idOf.get(p.slug)!, slug: g.id, title: g.title, hint: g.hint, kind: g.kind, required: g.required, maxSelect: g.max ?? null, sortOrder: gi })
        .returning({ id: productOptionGroups.id });
      await tx.insert(productOptions).values(
        g.options.map((o, oi) => ({ groupId: grp.id, slug: o.id, label: o.label, priceCents: o.priceCents, isDefault: g.defaults.includes(o.id), sortOrder: oi })),
      );
    }
  }
  return st.id;
}
type SeedCoupon = Omit<typeof coupons.$inferInsert, "id" | "createdAt" | "storeId"> & { storeSlug?: string };
/** Cupones de prueba que se muestran en el checkout y en /ofertas. */
export const SEED_COUPONS: SeedCoupon[] = [
  { code: "NAMI10", description: "10 % de descuento en pedidos desde $ 10", percent: 10, minSubtotalCents: 1000 },
  { code: "ENVIOGRATIS", description: "Envío gratis en pedidos desde $ 12", freeShipping: true, minSubtotalCents: 1200 },
  { code: "AREPA2X1", description: "2x1 en arepas de Arepera Doña Chela", bogoSection: "arepas", storeSlug: "arepera-dona-chela" },
  { code: "BIENVENIDA", description: "Envío gratis en tu primer pedido", freeShipping: true, firstOrderOnly: true },
];
/** Crea o restablece los cupones de prueba. */
export async function upsertSeedCoupons(tx: Conn): Promise<void> {
  for (const { storeSlug, ...c } of SEED_COUPONS) {
    const [store] = storeSlug ? await tx.select({ id: stores.id }).from(stores).where(eq(stores.slug, storeSlug)) : [];
    const row = { percent: null, amountCents: null, freeShipping: false, bogoSection: null, minSubtotalCents: 0, expiresAt: null, firstOrderOnly: false, ...c, storeId: store?.id ?? null };
    await tx.insert(coupons).values(row).onConflictDoUpdate({ target: coupons.code, set: row });
  }
}
/** Devuelve las tiendas dadas (o todas) a como las deja el seed: datos, horario, productos, precios y stock. */
export async function resetSeedStores(tx: Conn, onlySlug?: string, routes: RouteCache = ROUTE_CACHE): Promise<number> {
  const all = buildSeedStores();
  let n = 0;
  for (const [i, s] of all.entries()) {
    if (onlySlug && s.slug !== onlySlug) continue;
    await upsertSeedStore(tx, s, i, routes);
    n++;
  }
  await upsertSeedCoupons(tx);
  return n;
}
