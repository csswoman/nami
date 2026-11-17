import { resetStoreCatalog } from "@/server/store-panel";
import { jsonOk, panelFailure, limitPanel } from "@/server/panel-http";
/** Reponer catálogo: devuelve la tienda a los datos de demo (precios, stock, horario y estado). */
export async function POST(request: Request, ctx: RouteContext<"/api/tienda-admin/[slug]/reset">) {
  const limited = await limitPanel(request);
  if (limited) return limited;
  const { slug } = await ctx.params;
  try {
    await resetStoreCatalog(slug);
    return jsonOk({ ok: true });
  } catch (e) {
    return panelFailure(e);
  }
}
