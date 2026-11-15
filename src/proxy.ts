import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { FRANJA_COOKIE, isFranja } from "@/lib/demo/franja";
/**
 * Recuerda la franja del modo demo en una cookie para que sobreviva a la navegación.
 * `?franja=cena` la fija; `?franja=real` la borra (vuelve a la hora real de Caracas).
 */
export function proxy(request: NextRequest) {
  const value = request.nextUrl.searchParams.get("franja");
  const res = NextResponse.next();
  if (isFranja(value ?? undefined)) res.cookies.set(FRANJA_COOKIE, value!, { path: "/", sameSite: "lax" });
  else if (value === "real") res.cookies.delete(FRANJA_COOKIE);
  return res;
}
export const config = { matcher: ["/((?!_next|api|brand|.*\\..*).*)"] };
