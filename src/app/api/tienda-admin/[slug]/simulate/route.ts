import { NextResponse } from "next/server";
import { clientIp } from "@/lib/client-ip";
import { LIMITS, checkRateLimit, rateLimitMessage } from "@/server/rate-limit";
import { jsonOk, panelFailure } from "@/server/panel-http";
import { simulateIncomingOrder } from "@/server/simulate";
/** Simular pedido entrante: el servidor crea un pedido de prueba para esta tienda con el flujo normal. */
export async function POST(request: Request, ctx: RouteContext<"/api/tienda-admin/[slug]/simulate">) {
  // Escribe pedidos: su propio límite por IP, más corto que el del resto del panel.
  const limited = await checkRateLimit(`simulate:${clientIp(request.headers)}`, LIMITS.simulate);
  if (!limited.ok) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: rateLimitMessage(limited.retryAfterS) } },
      { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": String(limited.retryAfterS) } },
    );
  }
  const { slug } = await ctx.params;
  try {
    return jsonOk(await simulateIncomingOrder(slug), 201);
  } catch (e) {
    return panelFailure(e);
  }
}
