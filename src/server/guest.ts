import "server-only";
import { cookies } from "next/headers";
import { GUEST_COOKIE, isGuestToken } from "@/lib/guest";

/** Token de invitado de la petición (lo crea proxy.ts). null si no hay o es inválido. */
export async function currentGuestToken(): Promise<string | null> {
  const v = (await cookies()).get(GUEST_COOKIE)?.value;
  return isGuestToken(v) ? v : null;
}
