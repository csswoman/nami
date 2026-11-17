import { outOfStockSchema } from "@/lib/panel-input";
import { jsonOk, panelFailure, parseBody, limitPanel } from "@/server/panel-http";
import { markOutOfStock } from "@/server/store-panel";
/**
 * «No hay» (solo mercados): aplica lo que pidió el cliente para ese producto. `{ replacement?: slug }` es el producto
 * con el que la tienda lo reemplaza cuando el cliente pidió «algo parecido» o su producto tampoco hay.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/tienda-admin/[slug]/stops/[stopId]/items/[itemId]">) {
  const limited = await limitPanel(request);
  if (limited) return limited;
  const { slug, stopId, itemId } = await ctx.params;
  const body = await parseBody(request, outOfStockSchema);
  if (body.error) return body.error;
  try {
    await markOutOfStock(slug, stopId, itemId, body.data.replacement);
    return jsonOk({ ok: true });
  } catch (e) {
    return panelFailure(e);
  }
}
