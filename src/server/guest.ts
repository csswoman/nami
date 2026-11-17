import "server-only";
import { cookies, headers } from "next/headers";
import { clientIp } from "@/lib/client-ip";
import { GUEST_COOKIE, isGuestToken } from "@/lib/guest";

/** Token de invitado de la petición (lo crea proxy.ts). null si no hay o es inválido. */
export async function currentGuestToken(): Promise<string | null> {
  const v = (await cookies()).get(GUEST_COOKIE)?.value;
  return isGuestToken(v) ? v : null;
}

/** IP del cliente de la petición en curso (para el límite de peticiones). */
export async function currentClientIp(): Promise<string> {
  return clientIp(await headers());
}
