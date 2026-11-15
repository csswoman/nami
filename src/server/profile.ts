import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "./db";
import { orders, products, stores } from "./db/schema";
export type FavoriteStore = { slug: string; name: string; description: string; initials: string; color: string; href: string };
export type FavoriteProductInfo = { store: string; storeName: string; id: string; name: string; priceCents: number; soldOut: boolean; href: string };
const storeHref = (s: { slug: string; kind: "restaurante" | "mercado" }) => (s.kind === "mercado" ? `/mercado/${s.slug}` : `/tienda/${s.slug}`);
/** Datos para mostrar los favoritos guardados en el navegador. Lo que ya no existe en el catálogo se omite. */
export async function getFavorites(storeSlugs: string[], productRefs: { store: string; id: string }[]): Promise<{ stores: FavoriteStore[]; products: FavoriteProductInfo[] }> {
  const productStoreSlugs = [...new Set(productRefs.map((p) => p.store))];
  const [storeRows, productRows] = await Promise.all([
    storeSlugs.length
      ? db.select({ slug: stores.slug, name: stores.name, description: stores.description, initials: stores.initials, color: stores.color, kind: stores.kind }).from(stores).where(inArray(stores.slug, storeSlugs))
      : [],
    productStoreSlugs.length
      ? db
          .select({ store: stores.slug, storeName: stores.name, kind: stores.kind, id: products.slug, name: products.name, priceCents: products.priceCents, available: products.isAvailable })
          .from(products)
          .innerJoin(stores, eq(stores.id, products.storeId))
          .where(inArray(stores.slug, productStoreSlugs))
      : [],
  ]);
  return {
    // Se respeta el orden en que el cliente los guardó.
    stores: storeSlugs.flatMap((slug) => {
      const r = storeRows.find((x) => x.slug === slug);
      return r ? [{ slug: r.slug, name: r.name, description: r.description ?? "", initials: r.initials, color: r.color, href: storeHref(r) }] : [];
    }),
    products: productRefs.flatMap((ref) => {
      const r = productRows.find((x) => x.store === ref.store && x.id === ref.id);
      return r ? [{ store: r.store, storeName: r.storeName, id: r.id, name: r.name, priceCents: r.priceCents, soldOut: !r.available, href: r.kind === "mercado" ? storeHref({ slug: r.store, kind: r.kind }) : `/tienda/${r.store}/${r.id}` }] : [];
    }),
  };
}
/** Borra los pedidos del invitado (con sus paradas y productos, por cascade). Devuelve cuántos eran. */
export async function deleteGuestOrders(guestToken: string): Promise<number> {
  const gone = await db.delete(orders).where(and(eq(orders.guestToken, guestToken))).returning({ id: orders.id });
  return gone.length;
}
