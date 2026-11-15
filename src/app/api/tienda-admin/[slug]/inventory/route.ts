import { getInventory } from "@/server/store-panel";
import { jsonOk, panelFailure } from "@/server/panel-http";
/** Productos de la tienda con su precio y si están disponibles. */
export async function GET(_request: Request, ctx: RouteContext<"/api/tienda-admin/[slug]/inventory">) {
  const { slug } = await ctx.params;
  try {
    return jsonOk({ items: await getInventory(slug) });
  } catch (e) {
    return panelFailure(e);
  }
}
