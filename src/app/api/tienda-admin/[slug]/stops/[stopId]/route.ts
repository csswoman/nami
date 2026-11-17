import { stopActionSchema } from "@/lib/panel-input";
import { isStopAction } from "@/lib/orders/stop-machine";
import { jsonError, jsonOk, panelFailure, parseBody, limitPanel } from "@/server/panel-http";
import { actOnStop } from "@/server/store-panel";
/** Acción de la tienda sobre una parada: `{ action: "aceptar" | "rechazar" | "preparar" | "listo", reason? }`. Transición inválida = 409. */
export async function POST(request: Request, ctx: RouteContext<"/api/tienda-admin/[slug]/stops/[stopId]">) {
  const limited = await limitPanel(request);
  if (limited) return limited;
  const { slug, stopId } = await ctx.params;
  const body = await parseBody(request, stopActionSchema);
  if (body.error) return body.error;
  if (!isStopAction(body.data.action)) return jsonError("INVALID_INPUT", "Acción no válida.", 400);
  try {
    await actOnStop(slug, stopId, body.data.action, body.data.reason);
    return jsonOk({ ok: true });
  } catch (e) {
    return panelFailure(e);
  }
}
