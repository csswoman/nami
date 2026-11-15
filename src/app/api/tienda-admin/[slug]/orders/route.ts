import { getPanel } from "@/server/store-panel";
import { jsonOk, panelFailure } from "@/server/panel-http";
/** Bandeja de pedidos de la tienda (el panel la consulta cada pocos segundos). */
export async function GET(_request: Request, ctx: RouteContext<"/api/tienda-admin/[slug]/orders">) {
  const { slug } = await ctx.params;
  try {
    return jsonOk(await getPanel(slug));
  } catch (e) {
    return panelFailure(e);
  }
}
