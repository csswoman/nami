import { getSchedule, setSchedule } from "@/server/store-panel";
import { hoursSchema } from "@/lib/panel-input";
import { jsonOk, panelFailure, parseBody, limitPanel } from "@/server/panel-http";
/** Horario semanal: lista de turnos `{ day: 0-6 (lunes = 0), opensAt, closesAt }` en minutos desde la medianoche. */
export async function GET(_request: Request, ctx: RouteContext<"/api/tienda-admin/[slug]/hours">) {
  const { slug } = await ctx.params;
  try {
    return jsonOk({ schedule: await getSchedule(slug) });
  } catch (e) {
    return panelFailure(e);
  }
}
/** Reemplaza el horario: `{ schedule: [...] }`. */
export async function PUT(request: Request, ctx: RouteContext<"/api/tienda-admin/[slug]/hours">) {
  const limited = await limitPanel(request);
  if (limited) return limited;
  const { slug } = await ctx.params;
  const body = await parseBody(request, hoursSchema);
  if (body.error) return body.error;
  try {
    return jsonOk({ schedule: await setSchedule(slug, body.data.schedule) });
  } catch (e) {
    return panelFailure(e);
  }
}
