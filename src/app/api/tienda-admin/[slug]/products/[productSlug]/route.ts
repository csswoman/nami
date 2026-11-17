import { productPatchSchema } from "@/lib/panel-input";
import { jsonOk, panelFailure, parseBody, limitPanel } from "@/server/panel-http";
import { updateProduct } from "@/server/store-panel";
/** Agota o repone un producto o cambia su precio: `{ available?: boolean, priceCents?: number }`. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/tienda-admin/[slug]/products/[productSlug]">) {
  const limited = await limitPanel(request);
  if (limited) return limited;
  const { slug, productSlug } = await ctx.params;
  const body = await parseBody(request, productPatchSchema);
  if (body.error) return body.error;
  try {
    return jsonOk({ item: await updateProduct(slug, productSlug, body.data) });
  } catch (e) {
    return panelFailure(e);
  }
}
