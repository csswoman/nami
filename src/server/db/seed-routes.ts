/**
 * Rutas por calle de cada tienda a cada zona de entrega, calculadas una sola vez con OSRM (servicio público, sin API key)
 * y guardadas en `route-cache.json`. Así el seed y el botón «Reponer catálogo» no necesitan red una vez hecha la caché,
 * y al pedir nunca se llama a un servicio externo. Sin red (o con SEED_ROUTING=estimate) se usa una estimación en línea recta.
 */
import { haversineM, type LatLng, type Zone } from "@/lib/geo";
export type RouteData = { distanceM: number; durationS: number; geometry: [number, number][]; source: "osrm" | "estimate" };
export type RouteCache = Record<string, RouteData>;
/** Clave de caché: cambia si la tienda cambia de lugar, así no se reutiliza una ruta vieja. */
export const routeKey = (slug: string, zone: string, from: LatLng) => `${slug}|${zone}|${from.lat}|${from.lng}`;
const round5 = (n: number) => Math.round(n * 1e5) / 1e5;
/** Ruta de respaldo: línea recta × 1,4 a ~25 km/h (el tráfico de Caracas no perdona). */
export function estimateRoute(from: LatLng, to: LatLng): RouteData {
  const distanceM = Math.round(haversineM(from, to) * 1.4);
  return { distanceM, durationS: Math.round(distanceM / (25_000 / 3600)), geometry: [[from.lng, from.lat], [to.lng, to.lat]], source: "estimate" };
}
const OSRM = process.env.OSRM_URL ?? "https://router.project-osrm.org";
/** Una ruta de OSRM (perfil auto, geometría simplificada). null si el servicio no responde o no hay ruta. */
export async function fetchOsrmRoute(from: LatLng, to: LatLng): Promise<RouteData | null> {
  const url = `${OSRM}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=simplified&geometries=geojson`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      if (!res.ok) return null;
      const body = (await res.json()) as { code: string; routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[] };
      const r = body.code === "Ok" ? body.routes?.[0] : undefined;
      if (!r) return null;
      return { distanceM: Math.round(r.distance), durationS: Math.round(r.duration), geometry: r.geometry.coordinates.map(([lng, lat]) => [round5(lng), round5(lat)]), source: "osrm" };
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return null;
}
export type RoutePair = { slug: string; from: LatLng; zone: Zone };
/**
 * Completa la caché con las rutas que falten. Devuelve la caché y si cambió (para que el seed la escriba).
 * `estimate` no llama a la red: lo que no esté en caché se estima (y no se guarda, para no fijar estimaciones).
 */
export async function completeRouteCache(cache: RouteCache, pairs: RoutePair[], mode: "osrm" | "estimate" = "osrm", log: (m: string) => void = () => {}): Promise<{ cache: RouteCache; changed: boolean }> {
  const out: RouteCache = { ...cache };
  let changed = false;
  const missing = pairs.filter((p) => !out[routeKey(p.slug, p.zone.slug, p.from)]);
  if (mode === "estimate" || missing.length === 0) return { cache: out, changed };
  log(`Calculando ${missing.length} rutas con OSRM (una sola vez; se guardan en route-cache.json)…`);
  let n = 0;
  for (const p of missing) {
    const r = await fetchOsrmRoute(p.from, p.zone);
    if (r) {
      out[routeKey(p.slug, p.zone.slug, p.from)] = r;
      changed = true;
    }
    if (++n % 50 === 0) log(`  ${n}/${missing.length}`);
    await new Promise((res) => setTimeout(res, 120));
  }
  return { cache: out, changed };
}
