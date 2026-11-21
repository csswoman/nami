import { shippingOf, type DeliveryMode } from "./index";
/**
 * Totales de un pedido después de que cambie una parada: la tienda quitó productos, rechazó su parte
 * o no respondió a tiempo. Lo cancelado no se cobra: ni sus productos ni su envío. Función pura.
 */
export type RepriceOrder = { delivery: DeliveryMode; shippingCents: number; tipCents: number; surchargeCents: number; discountCents: number };
export type RepriceStop = { subtotalCents: number; feeCents: number; cancelled: boolean };
export type Repriced = { subtotalCents: number; shippingCents: number; discountCents: number; totalCents: number };

/** `null` si todas las paradas están canceladas: el pedido entero se cancela y no se cobra nada. */
export function repriceOrder(o: RepriceOrder, stops: RepriceStop[]): Repriced | null {
  const alive = stops.filter((s) => !s.cancelled);
  if (alive.length === 0) return null;
  const subtotalCents = alive.reduce((n, s) => n + s.subtotalCents, 0);
  // Sin paradas canceladas el envío no cambia. Pedidos viejos sin envío por parada (todo en 0) tampoco.
  const someCancelled = alive.length < stops.length;
  const known = stops.some((s) => s.feeCents > 0);
  const shippingCents = someCancelled && known ? shippingOf(alive.map((s) => ({ feeCents: s.feeCents })), o.delivery) : o.shippingCents;
  // El descuento nunca supera lo que se paga por productos y envío.
  const discountCents = Math.min(o.discountCents, subtotalCents + shippingCents);
  return { subtotalCents, shippingCents, discountCents, totalCents: subtotalCents + shippingCents + o.tipCents + o.surchargeCents - discountCents };
}
