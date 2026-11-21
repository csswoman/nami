import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { FRANJA_COOKIE, isFranja } from "@/lib/demo/franja";
import { DEMAND_COOKIE, isDemand } from "@/lib/pricing/demand";
import { GUEST_COOKIE, GUEST_COOKIE_MAX_AGE, isGuestToken, newGuestToken } from "@/lib/guest";
const REQUEST_ID_HEADER = "x-request-id";
/**
 * 1) Id de petición: llega a la app en `x-request-id` (los logs de src/server/log.ts lo incluyen) y vuelve en la
 *    respuesta, así un error que ve el visitante se puede buscar en los logs.
 * 2) Token de invitado: si no hay cookie `nami_guest`, crea una (httpOnly). También se la pasa a la
 *    petición en curso para que el primer POST /api/orders ya la vea.
 * 3) Recuerda la franja del modo demo en una cookie para que sobreviva a la navegación.
 *    `?franja=cena` la fija; `?franja=real` la borra (vuelve a la hora real de Caracas).
 * 4) Igual con la demanda del modo demo: `?demanda=lluvia` o `?demanda=pico`; `?demanda=normal` la borra.
 */
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  const requestId = request.headers.get("x-vercel-id") ?? crypto.randomUUID();
  headers.set(REQUEST_ID_HEADER, requestId);
  const existing = request.cookies.get(GUEST_COOKIE)?.value;
  const token = isGuestToken(existing) ? undefined : newGuestToken();
  if (token) {
    const cookie = request.headers.get("cookie");
    headers.set("cookie", `${cookie ? `${cookie}; ` : ""}${GUEST_COOKIE}=${token}`);
  }
  const res = NextResponse.next({ request: { headers } });
  res.headers.set(REQUEST_ID_HEADER, requestId);
  if (token) {
    res.cookies.set(GUEST_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: GUEST_COOKIE_MAX_AGE,
    });
  }
  const value = request.nextUrl.searchParams.get("franja");
  if (isFranja(value ?? undefined)) res.cookies.set(FRANJA_COOKIE, value!, { path: "/", sameSite: "lax" });
  else if (value === "real") res.cookies.delete(FRANJA_COOKIE);
  const demand = request.nextUrl.searchParams.get("demanda");
  if (isDemand(demand) && demand !== "normal") res.cookies.set(DEMAND_COOKIE, demand, { path: "/", sameSite: "lax" });
  else if (demand === "normal") res.cookies.delete(DEMAND_COOKIE);
  return res;
}
export const config = { matcher: ["/((?!_next|brand|.*\\..*).*)"] };
