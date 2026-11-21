import { NextResponse } from "next/server";
import { clientIp } from "@/lib/client-ip";
import { riderActionSchema } from "@/lib/rider-input";
import { currentGuestToken } from "@/server/guest";
import { jsonOk, panelFailure, parseBody } from "@/server/panel-http";
import { LIMITS, checkRateLimit, rateLimitMessage } from "@/server/rate-limit";
import { riderAct } from "@/server/rider";
/** Tomar, recoger o avisar que llegó: `{ action }`. Una acción fuera de orden es un 409. */
export async function POST(request: Request, ctx: RouteContext<"/api/repartidor/orders/[id]">) {
  const limited = await checkRateLimit(`rider:${clientIp(request.headers)}`, LIMITS.rider);
  if (!limited.ok) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: rateLimitMessage(limited.retryAfterS) } },
      { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": String(limited.retryAfterS) } },
    );
  }
  const { id } = await ctx.params;
  const body = await parseBody(request, riderActionSchema);
  if (body.error) return body.error;
  try {
    await riderAct(await currentGuestToken(), id, body.data.action);
    return jsonOk({ ok: true });
  } catch (e) {
    return panelFailure(e);
  }
}
