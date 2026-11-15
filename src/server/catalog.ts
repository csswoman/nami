import "server-only";
import { and, asc, eq, inArray, sql, type AnyColumn, type SQL } from "drizzle-orm";
import type { IconName } from "@/components/nami";
import type {
  CartExtra,
  CatalogProduct,
  CatalogSection,
  DayHours,
  OptionGroup,
  ProductDetail,
  SearchResults,
  StoreDetail,
  StoreSummary,
} from "@/lib/catalog";
import type { BrandColor } from "@/lib/demo/home";
import { deliveryFeeCents } from "@/lib/geo";
import { blendRating, formatRating } from "@/lib/reviews";
import { db } from "./db";
import type { DeliveryContext } from "./prefs";
import { reviewStats, type RatingStat } from "./reviews";
import { coupons, productOptionGroups, productOptions, products, storeHours, storeRoutes, stores } from "./db/schema";

type StoreRow = typeof stores.$inferSelect;

const productColumns = {
  slug: products.slug,
  name: products.name,
  description: products.description,
  priceCents: products.priceCents,
  imageUrl: products.imageUrl,
  icon: products.icon,
  section: products.section,
  sectionTitle: products.sectionTitle,
  unit: products.unit,
  oldPriceCents: products.oldPriceCents,
  stock: products.stock,
  isAvailable: products.isAvailable,
  soldOutUntil: products.soldOutUntil,
  // El id va calificado a mano: en consultas de una sola tabla drizzle omite el prefijo y quedaría ambiguo.
  hasOptions: sql<boolean>`exists (select 1 from ${productOptionGroups} where ${productOptionGroups.productId} = "products"."id")`,
};
type ProductRow = Pick<
  typeof products.$inferSelect,
  "slug" | "name" | "description" | "priceCents" | "imageUrl" | "icon" | "section" | "sectionTitle" | "unit" | "oldPriceCents" | "stock" | "isAvailable" | "soldOutUntil"
> & { hasOptions: boolean };

type Delivery = NonNullable<StoreSummary["delivery"]> & { feeCents: number };
/**
 * Envío de cada tienda hasta la zona del cliente, con la ruta por calle que el seed dejó guardada.
 * Sin contexto no se calcula nada (tarifa base); sin zona, o sin ruta, la tienda no llega.
 */
async function deliveryMap(rows: StoreRow[], ctx?: DeliveryContext): Promise<Map<string, Delivery> | undefined> {
  if (!ctx) return undefined;
  const out = new Map<string, Delivery>();
  const routes = ctx.zone && rows.length
    ? await db.select({ storeId: storeRoutes.storeId, distanceM: storeRoutes.distanceM, durationS: storeRoutes.durationS }).from(storeRoutes).where(and(eq(storeRoutes.zone, ctx.zone.slug), inArray(storeRoutes.storeId, rows.map((r) => r.id))))
    : [];
  for (const r of rows) {
    const route = routes.find((x) => x.storeId === r.id);
    out.set(r.id, route
      ? { distanceM: route.distanceM, durationS: route.durationS, maxM: r.maxDeliveryM, covered: route.distanceM <= r.maxDeliveryM, feeCents: deliveryFeeCents(r.deliveryFeeCents, route.distanceM) }
      : { distanceM: null, durationS: null, maxM: r.maxDeliveryM, covered: false, feeCents: r.deliveryFeeCents });
  }
  return out;
}
function toStore(r: StoreRow, hours: DayHours[], stat: RatingStat = { count: 0, sum: 0 }, delivery?: Delivery, avgPriceCents: number | null = null): StoreSummary {
  const blended = blendRating(r.rating ? Number(r.rating) : null, stat.count, stat.sum);
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    kind: r.kind,
    category: r.category,
    description: r.description ?? "",
    area: r.area,
    imageUrl: r.imageUrl,
    initials: r.initials,
    color: r.color as BrandColor,
    rating: blended === null ? null : formatRating(blended),
    reviews: r.reviews ?? (stat.count > 0 ? String(stat.count) : null),
    time: r.etaMin !== null && r.etaMax !== null ? `${r.etaMin}–${r.etaMax} min` : "",
    etaMaxMin: r.etaMax,
    avgPriceCents,
    feeCents: delivery ? delivery.feeCents : r.deliveryFeeCents,
    delivery: delivery ? { distanceM: delivery.distanceM, durationS: delivery.durationS, covered: delivery.covered, maxM: delivery.maxM } : undefined,
    minOrderCents: r.minOrderCents,
    plusFree: r.plusFree,
    isOpen: r.isOpen,
    schedule: hours,
    tags: r.tags,
    verticals: r.verticals,
  };
}

function toProduct(r: ProductRow): CatalogProduct {
  return {
    id: r.slug,
    name: r.name,
    description: r.description ?? "",
    unit: r.unit,
    priceCents: r.priceCents,
    oldPriceCents: r.oldPriceCents,
    image: r.imageUrl,
    icon: r.icon as IconName | null,
    stock: r.stock,
    soldOut: !r.isAvailable,
    soldOutUntil: r.soldOutUntil ? r.soldOutUntil.toISOString() : null,
    hasOptions: r.hasOptions,
  };
}

/** Tiendas ordenadas como en el listado. `vertical` filtra por pestaña (0 restaurantes … 5 tiendas). */
export async function getStores(opts: { vertical?: number; delivery?: DeliveryContext } = {}): Promise<StoreSummary[]> {
  const where = opts.vertical === undefined ? undefined : sql`${opts.vertical} = any(${stores.verticals})`;
  const rows = await db.select().from(stores).where(where).orderBy(asc(stores.sortOrder), asc(stores.name));
  const ids = rows.map((r) => r.id);
  const [hours, stats, delivery, avg] = await Promise.all([hoursOf(ids), reviewStats(ids), deliveryMap(rows, opts.delivery), avgPrices(ids)]);
  return rows.map((r) => toStore(r, hours.get(r.id) ?? [], stats.get(r.id), delivery?.get(r.id), avg.get(r.id) ?? null));
}
/** Precio promedio de los productos disponibles de cada tienda (centavos), por id de tienda. */
async function avgPrices(storeIds: string[]): Promise<Map<string, number>> {
  if (!storeIds.length) return new Map();
  const rows = await db
    .select({ storeId: products.storeId, avg: sql<string>`avg(${products.priceCents})` })
    .from(products)
    .where(and(inArray(products.storeId, storeIds), eq(products.isAvailable, true)))
    .groupBy(products.storeId);
  return new Map(rows.map((r) => [r.storeId, Math.round(Number(r.avg))]));
}
/** Horario semanal de varias tiendas, por id de tienda. */
async function hoursOf(storeIds: string[]): Promise<Map<string, DayHours[]>> {
  const byStore = new Map<string, DayHours[]>();
  if (!storeIds.length) return byStore;
  const rows = await db
    .select({ storeId: storeHours.storeId, day: storeHours.day, opensAt: storeHours.opensAt, closesAt: storeHours.closesAt })
    .from(storeHours)
    .where(inArray(storeHours.storeId, storeIds))
    .orderBy(asc(storeHours.day), asc(storeHours.opensAt));
  for (const r of rows) byStore.set(r.storeId, [...(byStore.get(r.storeId) ?? []), { day: r.day, opensAt: r.opensAt, closesAt: r.closesAt }]);
  return byStore;
}

/** Tienda con su catálogo agrupado por sección. */
export async function getStore(slug: string, delivery?: DeliveryContext): Promise<StoreDetail | null> {
  const [row] = await db.select().from(stores).where(eq(stores.slug, slug)).limit(1);
  if (!row) return null;
  const items = await db
    .select(productColumns)
    .from(products)
    .where(eq(products.storeId, row.id))
    .orderBy(asc(products.sortOrder));
  const sections: CatalogSection[] = [];
  for (const it of items) {
    let sec = sections.find((s) => s.id === it.section);
    if (!sec) sections.push((sec = { id: it.section, title: it.sectionTitle, products: [] }));
    sec.products.push(toProduct(it));
  }
  const [hours, stats, deliveries] = await Promise.all([hoursOf([row.id]), reviewStats([row.id]), deliveryMap([row], delivery)]);
  return { ...toStore(row, hours.get(row.id) ?? [], stats.get(row.id), deliveries?.get(row.id)), sections };
}

/** Un producto con sus grupos de opciones. `productSlug` es el id estable dentro de la tienda. */
export async function getProduct(storeSlug: string, productSlug: string, delivery?: DeliveryContext): Promise<ProductDetail | null> {
  const [row] = await db.select().from(stores).where(eq(stores.slug, storeSlug)).limit(1);
  if (!row) return null;
  const [p] = await db
    .select({ ...productColumns, id: products.id })
    .from(products)
    .where(and(eq(products.storeId, row.id), eq(products.slug, productSlug)))
    .limit(1);
  if (!p) return null;
  const groupRows = await db
    .select()
    .from(productOptionGroups)
    .where(eq(productOptionGroups.productId, p.id))
    .orderBy(asc(productOptionGroups.sortOrder));
  const optionRows = groupRows.length
    ? await db
        .select()
        .from(productOptions)
        .where(inArray(productOptions.groupId, groupRows.map((g) => g.id)))
        .orderBy(asc(productOptions.sortOrder))
    : [];
  const groups: OptionGroup[] = groupRows.map((g) => {
    const opts = optionRows.filter((o) => o.groupId === g.id);
    return {
      id: g.slug,
      title: g.title,
      hint: g.hint,
      kind: g.kind,
      required: g.required,
      ...(g.maxSelect !== null ? { max: g.maxSelect } : {}),
      options: opts.map((o) => ({ id: o.slug, label: o.label, priceCents: o.priceCents })),
      defaults: opts.filter((o) => o.isDefault).map((o) => o.slug),
    };
  });
  const [hours, stats, deliveries] = await Promise.all([hoursOf([row.id]), reviewStats([row.id]), deliveryMap([row], delivery)]);
  return { store: toStore(row, hours.get(row.id) ?? [], stats.get(row.id), deliveries?.get(row.id)), sectionId: p.section, product: toProduct(p), groups };
}

/** Promociones de un mercado: primero lo rebajado, luego lo que queda poco y después el resto (sin agotados). */
export async function getPromos(storeSlug: string, max = 5): Promise<CatalogProduct[]> {
  const rows = await db
    .select(productColumns)
    .from(products)
    .innerJoin(stores, eq(stores.id, products.storeId))
    .where(and(eq(stores.slug, storeSlug), eq(products.isAvailable, true)))
    .orderBy(sql`(${products.oldPriceCents} is null)`, sql`(${products.stock} is null)`, asc(products.sortOrder))
    .limit(max);
  return rows.map(toProduct);
}

/** Escapa % _ \ para usar el texto del usuario dentro de un LIKE (escape por defecto: barra invertida). */
const likePattern = (q: string) => `%${q.replace(/[\\%_]/g, "\\$&")}%`;
const matches = (col: SQL | AnyColumn, pattern: string) => sql`unaccent(${col}) ilike unaccent(${pattern})`;
/** Mínimo de `word_similarity` (pg_trgm) para dar por buena una coincidencia con errores de tipeo. */
const FUZZY_MIN = 0.5;
/** Textos de menos de 4 letras no se buscan con tolerancia: darían demasiados falsos positivos. */
const FUZZY_MIN_LENGTH = 4;
const similar = (col: SQL | AnyColumn, text: string) => sql`word_similarity(lower(unaccent(${text})), lower(unaccent(${col}))) >= ${FUZZY_MIN}`;

/**
 * Busca tiendas y productos por nombre, descripción o etiquetas, ignorando tildes y mayúsculas.
 * Si el texto tiene 4 letras o más también acepta errores de tipeo (pg_trgm): "teqeños" encuentra "tequeños".
 * Las coincidencias exactas salen primero.
 */
export async function searchCatalog(q: string, limits = { stores: 20, products: 50 }, delivery?: DeliveryContext): Promise<SearchResults> {
  const text = q.trim();
  if (!text) return { stores: [], products: [] };
  const pattern = likePattern(text);
  const fuzzy = text.length >= FUZZY_MIN_LENGTH;
  const storeCols = [stores.name, sql`coalesce(${stores.description}, '')`, sql`array_to_string(${stores.tags}, ' ')`];
  const productCols = [products.name, sql`coalesce(${products.description}, '')`, products.sectionTitle];
  const anyOf = (parts: SQL[]) => sql.join(parts, sql` or `);
  const storeExact = anyOf(storeCols.map((c) => matches(c, pattern)));
  const productExact = anyOf(productCols.map((c) => matches(c, pattern)));
  const storeFuzzy = fuzzy ? anyOf([...storeCols.map((c) => similar(c, text))]) : sql`false`;
  const productFuzzy = fuzzy ? anyOf([...productCols.map((c) => similar(c, text))]) : sql`false`;
  const [storeRows, productRows] = await Promise.all([
    db
      .select()
      .from(stores)
      .where(sql`(${storeExact} or ${storeFuzzy})`)
      .orderBy(sql`(case when ${storeExact} then 0 else 1 end)`, asc(stores.sortOrder))
      .limit(limits.stores),
    db
      .select({ ...productColumns, storeSlug: stores.slug, storeName: stores.name, storeKind: stores.kind })
      .from(products)
      .innerJoin(stores, eq(stores.id, products.storeId))
      .where(sql`(${productExact} or ${productFuzzy})`)
      .orderBy(sql`(case when ${productExact} then 0 else 1 end)`, asc(stores.sortOrder), asc(products.sortOrder))
      .limit(limits.products),
  ]);
  const [hours, stats, deliveries, avg] = await Promise.all([hoursOf(storeRows.map((r) => r.id)), reviewStats(storeRows.map((r) => r.id)), deliveryMap(storeRows, delivery), avgPrices(storeRows.map((r) => r.id))]);
  return {
    stores: storeRows.map((r) => toStore(r, hours.get(r.id) ?? [], stats.get(r.id), deliveries?.get(r.id), avg.get(r.id) ?? null)),
    products: productRows.map((r) => ({ ...toProduct(r), store: { slug: r.storeSlug, name: r.storeName, kind: r.storeKind } })),
  };
}

/** Sugerencias del carrito por tienda: hasta 3 bebidas o frituras disponibles del propio menú. */
export async function getCartExtras(): Promise<Record<string, CartExtra[]>> {
  const rows = await db
    .select({ store: stores.slug, id: products.slug, name: products.name, priceCents: products.priceCents, icon: products.icon, imageUrl: products.imageUrl })
    .from(products)
    .innerJoin(stores, eq(stores.id, products.storeId))
    .where(and(eq(stores.kind, "restaurante"), eq(products.isAvailable, true), inArray(products.section, ["bebidas", "frituras"])))
    .orderBy(asc(stores.sortOrder), asc(products.sortOrder));
  const out: Record<string, CartExtra[]> = {};
  for (const r of rows) {
    const list = (out[r.store] ??= []);
    if (list.length < 3) list.push({ id: r.id, name: r.name, priceCents: r.priceCents, icon: (r.icon ?? "utensils") as IconName, image: r.imageUrl ?? undefined });
  }
  return out;
}
/** Cupones vigentes para mostrar en el checkout: código y qué hacen. */
export async function getCouponOffers(now: number = Date.now()): Promise<{ code: string; description: string }[]> {
  const rows = await db.select({ code: coupons.code, description: coupons.description, expiresAt: coupons.expiresAt }).from(coupons).orderBy(asc(coupons.code));
  return rows.filter((r) => r.expiresAt === null || r.expiresAt.getTime() > now).map(({ code, description }) => ({ code, description }));
}
/** Productos de la misma tienda con los que se puede reemplazar uno (disponibles; primero los de su sección). */
export async function getSubstituteCandidates(storeSlug: string, productSlug: string): Promise<{ id: string; name: string; priceCents: number }[]> {
  const [store] = await db.select({ id: stores.id }).from(stores).where(eq(stores.slug, storeSlug)).limit(1);
  if (!store) return [];
  const rows = await db
    .select({ slug: products.slug, name: products.name, priceCents: products.priceCents, section: products.section, available: products.isAvailable })
    .from(products)
    .where(eq(products.storeId, store.id))
    .orderBy(asc(products.sortOrder));
  const self = rows.find((r) => r.slug === productSlug);
  return rows
    .filter((r) => r.available && r.slug !== productSlug)
    .sort((a, b) => Number(b.section === self?.section) - Number(a.section === self?.section))
    .map((r) => ({ id: r.slug, name: r.name, priceCents: r.priceCents }));
}
/** Envío y cobertura de las tiendas pedidas (y cuántas llegan en total) hasta una zona. Sin zona, ninguna llega. */
export async function getDeliveryQuotes(zone: string | null, slugs: string[]): Promise<{ stores: { slug: string; feeCents: number; covered: boolean; distanceM: number | null }[]; reachable: number; total: number }> {
  const rows = await db.select().from(stores);
  const routes = zone ? await db.select({ storeId: storeRoutes.storeId, distanceM: storeRoutes.distanceM }).from(storeRoutes).where(eq(storeRoutes.zone, zone)) : [];
  const quote = (r: StoreRow) => {
    const route = routes.find((x) => x.storeId === r.id);
    return { slug: r.slug, distanceM: route?.distanceM ?? null, covered: !!route && route.distanceM <= r.maxDeliveryM, feeCents: route ? deliveryFeeCents(r.deliveryFeeCents, route.distanceM) : r.deliveryFeeCents };
  };
  const all = rows.map(quote);
  return { stores: all.filter((q) => slugs.includes(q.slug)), reachable: all.filter((q) => q.covered).length, total: all.length };
}
/** Ruta por calle (la guardada en el seed) de cada tienda pedida hasta una zona, para dibujarla en el mapa. */
export async function getRoutesTo(zone: string, slugs: string[]): Promise<{ slug: string; name: string; geometry: [number, number][]; distanceM: number; durationS: number; store: { lat: number; lng: number } }[]> {
  if (!slugs.length) return [];
  const rows = await db
    .select({ slug: stores.slug, name: stores.name, lat: stores.lat, lng: stores.lng, geometry: storeRoutes.geometry, distanceM: storeRoutes.distanceM, durationS: storeRoutes.durationS })
    .from(storeRoutes)
    .innerJoin(stores, eq(stores.id, storeRoutes.storeId))
    .where(and(eq(storeRoutes.zone, zone), inArray(stores.slug, slugs)));
  return rows.flatMap((r) => (r.lat === null || r.lng === null ? [] : [{ slug: r.slug, name: r.name, geometry: r.geometry, distanceM: r.distanceM, durationS: r.durationS, store: { lat: r.lat, lng: r.lng } }]));
}
