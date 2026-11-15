"use server";
import { placeFromUnknown, type ActionResult } from "@/server/order-api";

/** Server Action del checkout: valida con Zod y crea el pedido en el servidor. */
export async function placeOrder(raw: unknown): Promise<ActionResult> {
  const { body } = await placeFromUnknown(raw);
  return "order" in body ? { ok: true, order: body.order } : { ok: false, error: body.error };
}
