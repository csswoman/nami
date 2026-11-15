"use server";
import { z } from "zod";
import { currentGuestToken } from "@/server/guest";
import { deleteGuestOrders, getFavorites, type FavoriteProductInfo, type FavoriteStore } from "@/server/profile";
const slug = z.string().min(1).max(120);
const refsSchema = z.object({
  stores: z.array(slug).max(50),
  products: z.array(z.object({ store: slug, id: slug })).max(50),
});
/** Nombres y precios actuales de los favoritos que guardó el navegador. */
export async function favoritesInfo(raw: unknown): Promise<{ stores: FavoriteStore[]; products: FavoriteProductInfo[] }> {
  const parsed = refsSchema.safeParse(raw);
  if (!parsed.success) return { stores: [], products: [] };
  return getFavorites(parsed.data.stores, parsed.data.products);
}
/** «Borrar mis datos de demo»: elimina del servidor los pedidos de este invitado. Lo guardado en el navegador lo limpia el cliente. */
export async function deleteMyDemoData(): Promise<{ orders: number }> {
  const token = await currentGuestToken();
  return { orders: token ? await deleteGuestOrders(token) : 0 };
}
