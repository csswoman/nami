"use server";
import { nearestZone } from "@/lib/geo";
import { getDeliveryQuotes, getRoutesTo } from "@/server/catalog";
export type DeliveryInfo = {
  zone: { slug: string; name: string } | null;
  /** Una entrada por tienda pedida: lo que cobraría de envío y si llega. */
  stores: { slug: string; feeCents: number; covered: boolean; distanceM: number | null }[];
  /** Cuántas tiendas del catálogo llegan hasta ahí. */
  reachable: number;
  total: number;
};
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
/** Envío y cobertura para un punto del mapa. Los montos los calcula el servidor con las rutas guardadas. */
export async function deliveryFor(lat: number, lng: number, slugs: string[] = []): Promise<DeliveryInfo | null> {
  const la = num(lat);
  const ln = num(lng);
  if (la === null || ln === null) return null;
  const near = nearestZone({ lat: la, lng: ln });
  const q = await getDeliveryQuotes(near?.zone.slug ?? null, slugs.filter((s) => typeof s === "string").slice(0, 20));
  return { zone: near ? { slug: near.zone.slug, name: near.zone.name } : null, ...q };
}
/** Rutas guardadas de las tiendas del carrito hasta el punto del mapa (para dibujarlas). */
export async function routesFor(lat: number, lng: number, slugs: string[]): Promise<{ slug: string; name: string; geometry: [number, number][]; store: { lat: number; lng: number } }[]> {
  const la = num(lat);
  const ln = num(lng);
  if (la === null || ln === null) return [];
  const near = nearestZone({ lat: la, lng: ln });
  if (!near) return [];
  const rows = await getRoutesTo(near.zone.slug, slugs.filter((s) => typeof s === "string").slice(0, 10));
  return rows.map(({ slug, name, geometry, store }) => ({ slug, name, geometry, store }));
}
