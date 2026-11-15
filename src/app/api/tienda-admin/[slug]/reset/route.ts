import { resetStoreCatalog } from "@/server/store-panel";
import { jsonOk, panelFailure } from "@/server/panel-http";
/** Reponer catálogo: devuelve la tienda a los datos de demo (precios, stock, horario y estado). */
export async function POST(_request: Request, ctx: RouteContext<"/api/tienda-admin/[slug]/reset">) {
  const { slug } = await ctx.params;
  try {
    await resetStoreCatalog(slug);
    return jsonOk({ ok: true });
  } catch (e) {
    return panelFailure(e);
  }
}
