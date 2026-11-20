/**
 * Formato de dinero para la UI. Los montos llegan en centavos (integer).
 * USD: "$ 3,50" · Bs.: "Bs. 128,10" (coma decimal, punto de miles).
 * Puro y sin dependencias de servidor: sirve también en el cliente.
 */

export type Currency = "USD" | "VES";

function formatNumber(cents: number): string {
  const value = Math.round(cents) / 100;
  return value.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatUsd(cents: number): string {
  return `$ ${formatNumber(cents)}`;
}

/** `rate` = bolívares por dólar. Convierte centavos de USD a centavos de Bs. */
export function usdToVesCents(usdCents: number, rate: number): number {
  return Math.round(usdCents * rate);
}

export function formatVes(usdCents: number, rate: number): string {
  return `Bs. ${formatNumber(usdToVesCents(usdCents, rate))}`;
}

export function formatMoney(usdCents: number, currency: Currency, rate: number): string {
  return currency === "USD" ? formatUsd(usdCents) : formatVes(usdCents, rate);
}

/** Monto que ya está en céntimos de bolívar (p. ej. el total en Bs. guardado en el pedido). */
export function formatBs(vesCents: number): string {
  return `Bs. ${formatNumber(vesCents)}`;
}

/** Lo que la tienda escribe en un campo de precio ("3,50", "3.5", "12") → centavos. NaN si no es un precio válido. */
export function parsePriceCents(text: string): number {
  const clean = text.trim().replace(",", ".");
  if (!/^\d+(\.\d{0,2})?$/.test(clean)) return NaN;
  return Math.round(Number(clean) * 100);
}

/** Centavos → texto editable con coma decimal y sin símbolo ("3,50"). */
export function priceInputValue(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}
