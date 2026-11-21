/**
 * Cuentas del marketplace: cuánto se queda Ñami y cuánto recibe cada tienda por su parte de un pedido.
 * Funciones puras (las usan el panel y las pruebas).
 *
 * Reglas de la demo:
 * - Ñami cobra una comisión sobre el subtotal de productos de la tienda: 18 % a restaurantes, 12 % a mercados.
 * - El envío, el recargo por demanda y la propina no son de la tienda: van al motorizado y a Ñami.
 * - Un cupón de una sola tienda lo paga esa tienda; un cupón de Ñami (sirve en cualquier tienda) lo paga Ñami.
 *   Si el pedido tiene varias tiendas, el descuento de productos se reparte según el subtotal de cada una.
 * - Una parada rechazada o cancelada no genera venta ni comisión.
 */
export const COMMISSION_BPS = { restaurante: 1800, mercado: 1200 } as const;
export type StoreKind = keyof typeof COMMISSION_BPS;

export type SettlementStop = {
  kind: StoreKind;
  /** Subtotal de productos de esta tienda (centavos). */
  subtotalCents: number;
  /** Subtotal de productos de todo el pedido (todas las tiendas vivas). */
  orderSubtotalCents: number;
  /** Descuento de productos del pedido (sin el de envío). */
  productDiscountCents: number;
  /** El cupón es de esta tienda (lo paga ella) o de Ñami. */
  couponFundedByStore: boolean;
  cancelled: boolean;
};
export type StopSettlement = { grossCents: number; commissionCents: number; storeDiscountCents: number; netCents: number };

/** Comisión redondeada al centavo (mitad hacia arriba). */
export const commissionOf = (cents: number, kind: StoreKind) => Math.round((cents * COMMISSION_BPS[kind]) / 10_000);

/** Parte del descuento que le toca a esta tienda, proporcional a su subtotal. */
export function discountShare(stop: Pick<SettlementStop, "subtotalCents" | "orderSubtotalCents" | "productDiscountCents">): number {
  if (stop.orderSubtotalCents <= 0 || stop.productDiscountCents <= 0) return 0;
  return Math.min(stop.subtotalCents, Math.round((stop.productDiscountCents * stop.subtotalCents) / stop.orderSubtotalCents));
}

/** Liquidación de una parada: venta bruta, comisión de Ñami, descuento que asume la tienda y neto a pagarle. */
export function settleStop(stop: SettlementStop): StopSettlement {
  if (stop.cancelled) return { grossCents: 0, commissionCents: 0, storeDiscountCents: 0, netCents: 0 };
  const share = discountShare(stop);
  const storeDiscountCents = stop.couponFundedByStore ? share : 0;
  // La comisión se cobra sobre lo que la tienda vende de verdad: si ella paga el cupón, sobre el subtotal ya rebajado.
  const base = stop.subtotalCents - storeDiscountCents;
  const commissionCents = commissionOf(base, stop.kind);
  return { grossCents: stop.subtotalCents, commissionCents, storeDiscountCents, netCents: base - commissionCents };
}

/** Suma de varias liquidaciones. */
export function sumSettlements(list: StopSettlement[]): StopSettlement {
  return list.reduce(
    (a, s) => ({ grossCents: a.grossCents + s.grossCents, commissionCents: a.commissionCents + s.commissionCents, storeDiscountCents: a.storeDiscountCents + s.storeDiscountCents, netCents: a.netCents + s.netCents }),
    { grossCents: 0, commissionCents: 0, storeDiscountCents: 0, netCents: 0 },
  );
}
