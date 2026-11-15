/**
 * Zonas de Caracas y cálculo de envío por distancia. Funciones puras (sin BD ni red).
 * Las rutas reales por calle se calculan una vez en el seed (OSRM) entre cada tienda y el centro de cada zona.
 * El pin del cliente se asigna a su zona más cercana y se usa la ruta guardada de esa zona.
 */
export type Zone = { slug: string; name: string; lat: number; lng: number };
export type LatLng = { lat: number; lng: number };
export const ZONES: readonly Zone[] = [
  { slug: "chacao", name: "Chacao", lat: 10.4936, lng: -66.853 },
  { slug: "altamira", name: "Altamira", lat: 10.5047, lng: -66.8476 },
  { slug: "los-palos-grandes", name: "Los Palos Grandes", lat: 10.5018, lng: -66.8416 },
  { slug: "la-castellana", name: "La Castellana", lat: 10.4985, lng: -66.8515 },
  { slug: "chacaito", name: "Chacaíto", lat: 10.4895, lng: -66.8685 },
  { slug: "sabana-grande", name: "Sabana Grande", lat: 10.4925, lng: -66.8785 },
  { slug: "las-mercedes", name: "Las Mercedes", lat: 10.4835, lng: -66.8595 },
  { slug: "los-chaguaramos", name: "Los Chaguaramos", lat: 10.4905, lng: -66.8925 },
  { slug: "los-proceres", name: "Los Próceres", lat: 10.4805, lng: -66.8865 },
  { slug: "la-candelaria", name: "La Candelaria", lat: 10.5035, lng: -66.9055 },
  { slug: "el-cafetal", name: "El Cafetal", lat: 10.4645, lng: -66.8255 },
  { slug: "23-de-enero", name: "23 de Enero", lat: 10.5165, lng: -66.9335 },
  { slug: "caricuao", name: "Caricuao", lat: 10.4315, lng: -66.9745 },
];
export const zoneBySlug = (slug: string): Zone | undefined => ZONES.find((z) => z.slug === slug);
const plain = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
/** Zona por su nombre ("Chacaíto", "chacaito"), para ubicar tiendas a partir de su `area`. */
export const zoneByName = (name: string): Zone | undefined => ZONES.find((z) => plain(z.name) === plain(name));
/** Un pin a más de esto del centro de la zona más cercana queda fuera del mapa de entregas. */
export const ZONE_RADIUS_M = 2_500;
/** Distancia máxima por calle a la que una tienda reparte, salvo que la tienda diga otra cosa. */
export const DEFAULT_MAX_DELIVERY_M = 7_000;
const EARTH_M = 6_371_000;
const rad = (d: number) => (d * Math.PI) / 180;
/** Distancia en línea recta entre dos puntos (metros). */
export function haversineM(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_M * Math.asin(Math.sqrt(h));
}
/** Zona más cercana al punto, o null si el punto cae lejos de todas (o no es una coordenada válida). */
export function nearestZone(p: LatLng): { zone: Zone; distanceM: number } | null {
  if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng) || Math.abs(p.lat) > 90 || Math.abs(p.lng) > 180) return null;
  let best: { zone: Zone; distanceM: number } | null = null;
  for (const zone of ZONES) {
    const distanceM = haversineM(p, zone);
    if (!best || distanceM < best.distanceM) best = { zone, distanceM };
  }
  return best && best.distanceM <= ZONE_RADIUS_M ? best : null;
}
/** Posición estable de una tienda: el centro de su zona más un desplazamiento fijo (hasta ~400 m) según su slug. */
export function storeLocation(slug: string, area: string | null): LatLng {
  const zone = (area ? zoneByName(area) : undefined) ?? ZONES[0];
  let h = 2166136261;
  for (const ch of slug) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const unit = (n: number) => ((n >>> 0) % 2001) / 1000 - 1; // -1 … 1
  return { lat: round5(zone.lat + unit(h) * 0.0035), lng: round5(zone.lng + unit(Math.imul(h, 2654435761)) * 0.0035) };
}
const round5 = (n: number) => Math.round(n * 1e5) / 1e5;
/** Kilómetros de recorrido sin costo extra en el envío. */
export const FREE_KM = 2;
/** Cargo por cada kilómetro de más, en centavos. */
export const PER_KM_CENTS = 30;
/** Envío = tarifa base de la tienda + cargo por kilómetro pasados los primeros 2, redondeado a 5 centavos. */
export function deliveryFeeCents(baseCents: number, distanceM: number): number {
  const extraKm = Math.max(0, distanceM / 1000 - FREE_KM);
  return Math.round((baseCents + extraKm * PER_KM_CENTS) / 5) * 5;
}
/** Distancia para mostrar: "850 m" o "2,3 km". */
export function formatDistance(distanceM: number): string {
  return distanceM < 1000 ? `${Math.round(distanceM / 10) * 10} m` : `${(distanceM / 1000).toFixed(1).replace(".", ",")} km`;
}
/** Tiempo de viaje para mostrar: "12 min". */
export const formatTravel = (durationS: number) => `${Math.max(1, Math.round(durationS / 60))} min`;
/** Cookie con el punto elegido en el mapa ("lat:lng"): el servidor la lee para filtrar tiendas y calcular el envío. */
export const LOCATION_COOKIE = "nami_loc";
/** Dirección de Altamira que usa la app mientras el cliente no elija otra. */
export const DEFAULT_LOCATION: LatLng = { lat: zoneBySlug("altamira")!.lat, lng: zoneBySlug("altamira")!.lng };
