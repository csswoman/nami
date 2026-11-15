import { LOCATION_COOKIE } from "@/lib/geo";
/** Guarda en la cookie `nami_loc` el punto de entrega, que el servidor lee para filtrar tiendas y calcular el envío. */
export function setLocationCookie(lat: number, lng: number): void {
  document.cookie = `${LOCATION_COOKIE}=${lat.toFixed(5)}:${lng.toFixed(5)}; path=/; max-age=31536000; samesite=lax`;
}
export function clearLocationCookie(): void {
  document.cookie = `${LOCATION_COOKIE}=; path=/; max-age=0`;
}
/** Recarga completa en el inicio: el carrito y el perfil arrancan de cero sin volver a escribir lo borrado. */
export function reloadHome(): void {
  window.location.href = "/";
}
