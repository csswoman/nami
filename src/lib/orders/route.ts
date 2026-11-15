export type RoutePoint = { lat: number; lng: number };

/** Puntos de referencia de la demo (Chacao → Altamira, Caracas). */
const STORE: RoutePoint = { lat: 10.4985, lng: -66.8517 };
const HOME: RoutePoint = { lat: 10.4962, lng: -66.848 };

/**
 * Ruta precalculada de la tienda a la casa: calles en ángulo recto, una parada más por cada tienda extra.
 * La demo dibuja el recorrido sobre su propio mapa; el servidor guarda esta ruta para cuando haya un mapa real.
 */
export function routeFor(stopCount: number): RoutePoint[] {
  const pts: RoutePoint[] = [STORE];
  const steps = 3 + Math.max(0, stopCount - 1);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const lng = STORE.lng + (HOME.lng - STORE.lng) * t;
    const lat = STORE.lat + (HOME.lat - STORE.lat) * t;
    // Alterna tramo este-oeste y norte-sur.
    pts.push(i % 2 ? { lat: pts[i - 1].lat, lng } : { lat, lng: pts[i - 1].lng });
  }
  pts.push(HOME);
  return pts;
}
