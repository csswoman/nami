/** Cookie del invitado: token anónimo que da acceso a sus pedidos (sin login de cliente). */
export const GUEST_COOKIE = "nami_guest";
export const GUEST_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
export const isGuestToken = (v: string | undefined | null): v is string => !!v && /^[A-Za-z0-9_-]{32,64}$/.test(v);
/** 32 bytes aleatorios en base64url (43 caracteres). */
export function newGuestToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
