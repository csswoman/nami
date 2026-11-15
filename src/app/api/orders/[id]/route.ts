import { NextResponse } from "next/server";
import { currentGuestToken } from "@/server/guest";
import { getOrder } from "@/server/orders";

/** Estado actual de un pedido del invitado (el seguimiento lo consulta cada pocos segundos). */
export async function GET(_request: Request, ctx: RouteContext<"/api/orders/[id]">) {
  const { id } = await ctx.params;
  const headers = { "Cache-Control": "no-store" };
  const token = await currentGuestToken();
  if (!token) return NextResponse.json({ error: { code: "NO_GUEST_TOKEN", message: "Falta la cookie de invitado." } }, { status: 401, headers });
  const order = await getOrder(id, token);
  if (!order) return NextResponse.json({ error: { code: "NOT_FOUND", message: "No encontramos ese pedido." } }, { status: 404, headers });
  return NextResponse.json({ order }, { headers });
}
