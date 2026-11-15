import "server-only";
import { cookies } from "next/headers";
import { CURRENCY_COOKIE, parseCurrency } from "@/lib/currency";
import { DEFAULT_LOCATION, LOCATION_COOKIE, nearestZone, type LatLng, type Zone } from "@/lib/geo";
import type { Currency } from "@/lib/money";
import { currentRate } from "./orders";

/** Moneda elegida (cookie `nami_moneda`) y tasa vigente, para pintar precios en el servidor. */
export async function getMoneyPrefs(): Promise<{ currency: Currency; rate: number }> {
  const [jar, rate] = await Promise.all([cookies(), currentRate()]);
  return { currency: parseCurrency(jar.get(CURRENCY_COOKIE)?.value), rate };
}
/** Dónde entregamos: el punto elegido (o Altamira, la dirección por defecto) y su zona; `zone` es null si cae fuera de toda zona. */
export type DeliveryContext = { location: LatLng; zone: Zone | null };
export function parseLocation(value: string | undefined): LatLng {
  const m = /^(-?\d{1,3}(?:\.\d+)?):(-?\d{1,3}(?:\.\d+)?)$/.exec(value ?? "");
  return m ? { lat: Number(m[1]), lng: Number(m[2]) } : DEFAULT_LOCATION;
}
export async function getDeliveryContext(): Promise<DeliveryContext> {
  const location = parseLocation((await cookies()).get(LOCATION_COOKIE)?.value);
  return { location, zone: nearestZone(location)?.zone ?? null };
}
