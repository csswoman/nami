import { getStoreMetrics } from "@/server/metrics";
import { jsonOk, panelFailure } from "@/server/panel-http";
/** Ventas de los últimos 7 días y liquidación de la tienda (comisión de Ñami, cupones, neto). */
export async function GET(_request: Request, ctx: RouteContext<"/api/tienda-admin/[slug]/metrics">) {
  const { slug } = await ctx.params;
  try {
    return jsonOk(await getStoreMetrics(slug));
  } catch (e) {
    return panelFailure(e);
  }
}
