"use server";
import { getSubstituteCandidates } from "@/server/catalog";
import { OrderError, listSlots } from "@/server/orders";
import { placeFromUnknown, quoteFromUnknown, type ActionResult, type QuoteResult } from "@/server/order-api";
import type { Slot } from "@/lib/orders/slots";

/** Server Action del checkout: valida con Zod y crea el pedido en el servidor. */
export async function placeOrder(raw: unknown): Promise<ActionResult> {
  const { body } = await placeFromUnknown(raw);
  return "order" in body ? { ok: true, order: body.order } : { ok: false, error: body.error };
}
/** Server Action del checkout: cuánto descuenta el cupón en este carrito, calculado con los precios de la BD. */
export async function quoteOrder(raw: unknown): Promise<QuoteResult> {
  return quoteFromUnknown(raw);
}
/** Franjas para programar el pedido a estas tiendas. `null` si alguna no está en la BD (pedidos locales: no se puede programar). */
export async function slotsFor(storeSlugs: string[]): Promise<Slot[] | null> {
  try {
    return await listSlots(storeSlugs.filter((s) => typeof s === "string").slice(0, 10));
  } catch (e) {
    if (e instanceof OrderError) return null;
    throw e;
  }
}
/** Productos con los que se puede reemplazar uno que no haya (mercados). */
export async function substituteOptions(storeSlug: string, productSlug: string): Promise<{ id: string; name: string; priceCents: number }[]> {
  return getSubstituteCandidates(String(storeSlug).slice(0, 100), String(productSlug).slice(0, 100));
}
