"use client";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { CURRENCY_COOKIE, parseCurrency } from "@/lib/currency";
import type { Currency } from "@/lib/money";
const EVENT = "nami-currency";
const read = (): Currency => parseCurrency(document.cookie.split("; ").find((c) => c.startsWith(`${CURRENCY_COOKIE}=`))?.split("=")[1]);
const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
};
/** Selector USD / Bs.: guarda la elección en una cookie y recarga la página para que el servidor la lea. */
export function CurrencyToggle() {
  const router = useRouter();
  const currency = useSyncExternalStore(subscribe, read, () => "USD" as Currency);
  function toggle() {
    const next: Currency = currency === "USD" ? "VES" : "USD";
    document.cookie = `${CURRENCY_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    window.dispatchEvent(new Event(EVENT));
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={currency === "USD" ? "Mostrar precios en bolívares" : "Mostrar precios en dólares"}
      title={currency === "USD" ? "Precios en dólares" : "Precios en bolívares"}
      className="nm-iconbtn text-button font-bold"
    >
      {currency === "USD" ? "$" : "Bs."}
    </button>
  );
}
