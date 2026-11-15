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
import { db } from "./db";
import { productOptionGroups, productOptions, products, storeHours, stores } from "./db/schema";

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

function toStore(r: StoreRow, hours: DayHours[]): StoreSummary {
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
    rating: r.rating ? r.rating.replace(".", ",") : null,
    reviews: r.reviews,
    time: r.etaMin !== null && r.etaMax !== null ? `${r.etaMin}–${r.etaMax} min` : "",
    feeCents: r.deliveryFeeCents,
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
export async function getStores(opts: { vertical?: number } = {}): Promise<StoreSummary[]> {
  const where = opts.vertical === undefined ? undefined : sql`${opts.vertical} = any(${stores.verticals})`;
  const rows = await db.select().from(stores).where(where).orderBy(asc(stores.sortOrder), asc(stores.name));
  const hours = await hoursOf(rows.map((r) => r.id));
  return rows.map((r) => toStore(r, hours.get(r.id) ?? []));
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
export async function getStore(slug: string): Promise<StoreDetail | null> {
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
  const hours = await hoursOf([row.id]);
  return { ...toStore(row, hours.get(row.id) ?? []), sections };
}

/** Un producto con sus grupos de opciones. `productSlug` es el id estable dentro de la tienda. */
export async function getProduct(storeSlug: string, productSlug: string): Promise<ProductDetail | null> {
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
  const hours = await hoursOf([row.id]);
  return { store: toStore(row, hours.get(row.id) ?? []), sectionId: p.section, product: toProduct(p), groups };
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

/** Busca tiendas y productos por nombre, descripción o etiquetas, ignorando tildes y mayúsculas. */
export async function searchCatalog(q: string, limits = { stores: 20, products: 50 }): Promise<SearchResults> {
  const text = q.trim();
  if (!text) return { stores: [], products: [] };
  const pattern = likePattern(text);
  const [storeRows, productRows] = await Promise.all([
    db
      .select()
      .from(stores)
      .where(sql`(${matches(stores.name, pattern)} or ${matches(sql`coalesce(${stores.description}, '')`, pattern)} or ${matches(sql`array_to_string(${stores.tags}, ' ')`, pattern)})`)
      .orderBy(asc(stores.sortOrder))
      .limit(limits.stores),
    db
      .select({ ...productColumns, storeSlug: stores.slug, storeName: stores.name, storeKind: stores.kind })
      .from(products)
      .innerJoin(stores, eq(stores.id, products.storeId))
      .where(sql`(${matches(products.name, pattern)} or ${matches(sql`coalesce(${products.description}, '')`, pattern)} or ${matches(products.sectionTitle, pattern)})`)
      .orderBy(asc(stores.sortOrder), asc(products.sortOrder))
      .limit(limits.products),
  ]);
  const hours = await hoursOf(storeRows.map((r) => r.id));
  return {
    stores: storeRows.map((r) => toStore(r, hours.get(r.id) ?? [])),
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
