import type { Currency } from "@/lib/money";
/** Moneda en que se muestran los precios del catálogo. Cookie legible en el servidor. */
export const CURRENCY_COOKIE = "nami_moneda";
export const parseCurrency = (v: string | undefined | null): Currency => (v === "VES" ? "VES" : "USD");
