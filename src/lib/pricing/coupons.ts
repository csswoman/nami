/**
 * Cupones: reglas y cálculo del descuento. Funciones puras, sin estado: las usa el servidor al crear el pedido
 * y al cotizar el cupón en el checkout, así que el cliente nunca decide cuánto se descuenta.
 */
export type CouponRule = {
  code: string;
  description: string;
  /** Descuento en % del subtotal (1-100). */
  percent: number | null;
  /** Descuento fijo en centavos. */
  amountCents: number | null;
  freeShipping: boolean;
  /** "2x1": en esta sección de la tienda del cupón, de cada dos unidades la más barata es gratis. */
  bogoSection: string | null;
  /** Subtotal mínimo (de la tienda del cupón, si tiene una). */
  minSubtotalCents: number;
  expiresAt: number | null;
  /** Slug de la única tienda donde vale; null = cualquiera. */
  storeSlug: string | null;
  firstOrderOnly: boolean;
};
export type CouponLine = { storeSlug: string; section: string; qty: number; unitCents: number };
export type CouponContext = { now: number; firstOrder: boolean; lines: CouponLine[]; shippingCents: number };
export type CouponErrorCode = "COUPON_EXPIRED" | "COUPON_NOT_APPLICABLE" | "COUPON_MIN_NOT_MET";
export type CouponResult =
  | { ok: true; discountCents: number; shippingDiscountCents: number }
  | { ok: false; code: CouponErrorCode; message: string };
const usd = (cents: number) => `$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
const fail = (code: CouponErrorCode, message: string): CouponResult => ({ ok: false, code, message });
/** Código normalizado: sin espacios y en mayúsculas ("nami10 " → "NAMI10"). */
export const normalizeCode = (code: string) => code.trim().toUpperCase();
/** Ahorro del 2x1: con las unidades ordenadas de mayor a menor precio, se regalan la 2.ª, la 4.ª, la 6.ª… */
export function bogoSavings(unitPrices: number[]): number {
  const sorted = [...unitPrices].sort((a, b) => b - a);
  let free = 0;
  for (let i = 1; i < sorted.length; i += 2) free += sorted[i];
  return free;
}
export function applyCoupon(rule: CouponRule, ctx: CouponContext): CouponResult {
  if (rule.expiresAt !== null && ctx.now > rule.expiresAt) return fail("COUPON_EXPIRED", `El cupón ${rule.code} ya venció.`);
  if (rule.firstOrderOnly && !ctx.firstOrder) return fail("COUPON_NOT_APPLICABLE", `El cupón ${rule.code} es solo para tu primer pedido.`);
  const lines = rule.storeSlug ? ctx.lines.filter((l) => l.storeSlug === rule.storeSlug) : ctx.lines;
  if (rule.storeSlug && lines.length === 0) return fail("COUPON_NOT_APPLICABLE", `El cupón ${rule.code} solo vale en un comercio que no está en tu carrito.`);
  const base = lines.reduce((n, l) => n + l.qty * l.unitCents, 0);
  if (base < rule.minSubtotalCents) return fail("COUPON_MIN_NOT_MET", `El cupón ${rule.code} pide un mínimo de ${usd(rule.minSubtotalCents)}; te faltan ${usd(rule.minSubtotalCents - base)}.`);
  let discount = 0;
  if (rule.percent !== null) discount += Math.floor((base * rule.percent) / 100);
  if (rule.amountCents !== null) discount += rule.amountCents;
  if (rule.bogoSection !== null) {
    const units = lines.filter((l) => l.section === rule.bogoSection).flatMap((l) => Array<number>(l.qty).fill(l.unitCents));
    const saved = bogoSavings(units);
    if (saved === 0) return fail("COUPON_NOT_APPLICABLE", `El cupón ${rule.code} pide al menos 2 productos de la sección de promoción.`);
    discount += saved;
  }
  const shippingDiscountCents = rule.freeShipping ? ctx.shippingCents : 0;
  if (discount === 0 && shippingDiscountCents === 0) return fail("COUPON_NOT_APPLICABLE", `El cupón ${rule.code} no descuenta nada en este pedido.`);
  return { ok: true, discountCents: Math.min(discount, base), shippingDiscountCents };
}
