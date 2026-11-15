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
