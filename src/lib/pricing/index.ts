/**
 * Cálculos de precios del carrito. Funciones puras, sin estado ni "use client":
 * las usan tanto el servidor (checkout real) como el navegador (carrito, panel, pedido).
 * Los tipos son estructurales: solo piden los campos que cada función lee.
 */
/** Cómo llega un carrito con varias tiendas: un motorizado por tienda o uno solo que pasa por todas. */
export type DeliveryMode = "separate" | "combined";
/** Recargo por cada parada extra cuando un solo motorizado recoge en varias tiendas. */
export const EXTRA_STOP_CENTS = 60;
export type PricedLine = { qty: number; unitCents: number };
export type PricedStore = { feeCents: number; minOrderCents: number };
export type PricedGroup = { store: Pick<PricedStore, "feeCents">; lines: PricedLine[] };
export type CartTotals = { itemCount: number; subtotalCents: number; shippingCents: number; tipCents: number; totalCents: number };
export const sumLines = (lines: PricedLine[]) => lines.reduce((n, l) => n + l.qty * l.unitCents, 0);
/** Centavos que faltan para el pedido mínimo de la tienda (0 si ya lo alcanza). */
export const minOrderShortfall = (store: Pick<PricedStore, "minOrderCents">, subtotalCents: number) => Math.max(0, store.minOrderCents - subtotalCents);
export const countLines = (lines: Pick<PricedLine, "qty">[]) => lines.reduce((n, l) => n + l.qty, 0);
export const countGroups = (groups: { lines: Pick<PricedLine, "qty">[] }[]) => groups.reduce((n, g) => n + countLines(g.lines), 0);
export const subtotalGroups = (groups: { lines: PricedLine[] }[]) => groups.reduce((n, g) => n + sumLines(g.lines), 0);
/** Envío: separado = suma de cada tienda; combinado = el envío más caro + recargo por cada parada extra. */
export function shippingOf(stores: Pick<PricedStore, "feeCents">[], mode: DeliveryMode): number {
  if (stores.length === 0) return 0;
  if (mode === "separate" || stores.length === 1) return stores.reduce((n, s) => n + s.feeCents, 0);
  return Math.max(...stores.map((s) => s.feeCents)) + EXTRA_STOP_CENTS * (stores.length - 1);
}
/** Única fuente de las sumas del carrito: todas las pantallas (carrito, panel, checkout, pedido) usan esto. */
export function cartTotals(groups: PricedGroup[], mode: DeliveryMode, tipCents = 0): CartTotals {
  const subtotalCents = subtotalGroups(groups);
  const shippingCents = shippingOf(groups.map((g) => g.store), mode);
  return { itemCount: countGroups(groups), subtotalCents, shippingCents, tipCents, totalCents: subtotalCents + shippingCents + tipCents };
}
