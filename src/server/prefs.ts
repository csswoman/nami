import "server-only";
import { cookies } from "next/headers";
import { CURRENCY_COOKIE, parseCurrency } from "@/lib/currency";
import type { Currency } from "@/lib/money";
import { currentRate } from "./orders";

/** Moneda elegida (cookie `nami_moneda`) y tasa vigente, para pintar precios en el servidor. */
export async function getMoneyPrefs(): Promise<{ currency: Currency; rate: number }> {
  const [jar, rate] = await Promise.all([cookies(), currentRate()]);
  return { currency: parseCurrency(jar.get(CURRENCY_COOKIE)?.value), rate };
}
