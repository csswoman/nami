/** Filtros y orden del listado y de la búsqueda de tiendas (funciones puras, sin BD). */
import { isOpenAt, type StoreSummary } from "@/lib/catalog";
export type PriceLevel = 1 | 2 | 3;
export type SortKey = "rapido" | "top";
export type ListingFilters = {
  /** Solo tiendas abiertas a esa hora. */
  open: boolean;
  /** Envío gratis (Ñami+ o tarifa de $ 0). */
  free: boolean;
  /** Llega en 30 min o menos. */
  fast: boolean;
  /** Nivel de precio ($, $$, $$$) según el promedio de sus productos. */
  price: PriceLevel | null;
  sort: SortKey | null;
};
export const FAST_MAX_MIN = 30;
/** Hasta cuánto promedia un producto en cada nivel: $ ≤ 3,00 · $$ ≤ 4,50 · $$$ más. */
export const PRICE_LIMITS_CENTS = [300, 450] as const;
export const SORT_LABELS: Record<SortKey, string> = { rapido: "Más rápido", top: "Mejor calificados" };
export const NO_FILTERS: ListingFilters = { open: false, free: false, fast: false, price: null, sort: null };
export function priceLevel(avgCents: number | null): PriceLevel | null {
  if (avgCents === null) return null;
  return avgCents <= PRICE_LIMITS_CENTS[0] ? 1 : avgCents <= PRICE_LIMITS_CENTS[1] ? 2 : 3;
}
/** Lee los filtros de los parámetros de la URL; lo desconocido se ignora. */
export function parseFilters(get: (key: string) => string | undefined): ListingFilters {
  const price = Number(get("price"));
  const sort = get("sort");
  return {
    open: get("open") === "1",
    free: get("free") === "1",
    fast: get("fast") === "1",
    price: price === 1 || price === 2 || price === 3 ? price : null,
    sort: sort === "rapido" || sort === "top" ? sort : null,
  };
}
/** Parámetros de URL de los filtros activos (los que no están activos no aparecen). */
export function filterParams(f: ListingFilters): Record<string, string | undefined> {
  return { open: f.open ? "1" : undefined, free: f.free ? "1" : undefined, fast: f.fast ? "1" : undefined, price: f.price ? String(f.price) : undefined, sort: f.sort ?? undefined };
}
export const isFreeShipping = (s: Pick<StoreSummary, "plusFree" | "feeCents">) => s.plusFree || s.feeCents === 0;
const ratingOf = (s: Pick<StoreSummary, "rating">) => (s.rating ? Number(s.rating.replace(",", ".")) : -1);
export function matchesFilters(s: StoreSummary, f: ListingFilters, minutes: number): boolean {
  if (f.open && !isOpenAt(s, minutes)) return false;
  if (f.free && !isFreeShipping(s)) return false;
  if (f.fast && !(s.etaMaxMin !== null && s.etaMaxMin <= FAST_MAX_MIN)) return false;
  if (f.price && priceLevel(s.avgPriceCents) !== f.price) return false;
  return true;
}
/** Filtra y ordena sin tocar la lista original. Sin `sort` se conserva el orden que traía. */
export function applyListing(stores: StoreSummary[], f: ListingFilters, minutes: number): StoreSummary[] {
  const kept = stores.filter((s) => matchesFilters(s, f, minutes));
  if (f.sort === "rapido") return [...kept].sort((a, b) => (a.etaMaxMin ?? 999) - (b.etaMaxMin ?? 999));
  if (f.sort === "top") return [...kept].sort((a, b) => ratingOf(b) - ratingOf(a));
  return kept;
}
