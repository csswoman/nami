import { openSchema } from "@/lib/panel-input";
import { jsonOk, panelFailure, parseBody } from "@/server/panel-http";
import { setStoreOpen } from "@/server/store-panel";
/** Interruptor manual: `{ open: boolean }`. */
export async function POST(request: Request, ctx: RouteContext<"/api/tienda-admin/[slug]/open">) {
  const { slug } = await ctx.params;
  const body = await parseBody(request, openSchema);
  if (body.error) return body.error;
  try {
    await setStoreOpen(slug, body.data.open);
    return jsonOk({ ok: true });
  } catch (e) {
    return panelFailure(e);
  }
}
