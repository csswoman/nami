/** Funciones puras de favoritos y direcciones guardadas (sirven en servidor y cliente). */
import type { Address } from "@/lib/cart/store";
export type FavoriteProduct = { store: string; id: string };
export type SavedAddress = Address & { id: string; lat: number; lng: number };
export const MAX_FAVORITES = 50;
export const MAX_ADDRESSES = 10;
const isText = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v.length < 120;
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
/** Agrega el valor si no está y lo quita si ya estaba. Los nuevos van primero y la lista tiene tope. */
export function toggleIn<T>(list: T[], item: T, same: (a: T, b: T) => boolean = (a, b) => a === b, max = MAX_FAVORITES): T[] {
  return list.some((x) => same(x, item)) ? list.filter((x) => !same(x, item)) : [item, ...list].slice(0, max);
}
export const sameProduct = (a: FavoriteProduct, b: FavoriteProduct) => a.store === b.store && a.id === b.id;
export const productKey = (p: FavoriteProduct) => `${p.store}/${p.id}`;
/** Lee lo guardado en el navegador descartando lo que no tenga la forma esperada. */
export function cleanStores(v: unknown): string[] {
  return Array.isArray(v) ? [...new Set(v.filter(isText))].slice(0, MAX_FAVORITES) : [];
}
export function cleanProducts(v: unknown): FavoriteProduct[] {
  if (!Array.isArray(v)) return [];
  const out: FavoriteProduct[] = [];
  for (const x of v) {
    const p = x as Partial<FavoriteProduct> | null;
    if (p && isText(p.store) && isText(p.id) && !out.some((o) => sameProduct(o, p as FavoriteProduct))) out.push({ store: p.store, id: p.id });
  }
  return out.slice(0, MAX_FAVORITES);
}
export function cleanAddresses(v: unknown): SavedAddress[] {
  if (!Array.isArray(v)) return [];
  const out: SavedAddress[] = [];
  for (const x of v) {
    const a = x as Partial<SavedAddress> | null;
    if (a && isText(a.id) && isText(a.name) && isText(a.line) && typeof a.reference === "string" && isNum(a.lat) && isNum(a.lng) && !out.some((o) => o.id === a.id)) {
      out.push({ id: a.id, name: a.name, line: a.line, reference: a.reference, lat: a.lat, lng: a.lng });
    }
  }
  return out.slice(0, MAX_ADDRESSES);
}
/** Dos direcciones son la misma si tienen el mismo punto en el mapa (a ~1 m) y el mismo texto. */
export const sameAddress = (a: Address, b: Address) =>
  a.line === b.line && Math.abs((a.lat ?? 0) - (b.lat ?? 0)) < 1e-5 && Math.abs((a.lng ?? 0) - (b.lng ?? 0)) < 1e-5;
/** Agrega una dirección con pin; si ya estaba guardada, la devuelve igual. */
export function addAddress(list: SavedAddress[], a: Address, id: string): SavedAddress[] {
  if (a.lat === undefined || a.lng === undefined) return list;
  if (list.some((x) => sameAddress(x, a))) return list;
  return [{ id, name: a.name, line: a.line, reference: a.reference, lat: a.lat, lng: a.lng }, ...list].slice(0, MAX_ADDRESSES);
}
