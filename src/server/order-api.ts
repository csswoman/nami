import "server-only";
import { z } from "zod";
import type { ApiError } from "@/lib/orders/input";
import { orderInputSchema, type OrderInput } from "@/lib/orders/input";
import type { Order } from "@/lib/cart/store";
import { currentGuestToken } from "./guest";
import { OrderError, createOrder } from "./orders";

export type ActionResult = { ok: true; order: Order } | ({ ok: false } & ApiError);

const fail = (code: ApiError["error"]["code"], message: string): ApiError => ({ error: { code, message } });

/** Valida, resuelve el invitado y crea el pedido. Lo usan la Server Action y POST /api/orders. */
export async function placeFromUnknown(raw: unknown): Promise<{ status: number; body: { order: Order } | ApiError }> {
  const parsed = orderInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 400, body: fail("INVALID_INPUT", z.prettifyError(parsed.error)) };
  }
  const token = await currentGuestToken();
  if (!token) return { status: 401, body: fail("NO_GUEST_TOKEN", "Falta la cookie de invitado. Abre la página una vez y vuelve a intentar.") };
  try {
    return { status: 201, body: { order: await createOrder(parsed.data as OrderInput, token) } };
  } catch (e) {
    if (e instanceof OrderError) return { status: e.status, body: fail(e.code, e.message) };
    console.error("createOrder", e);
    return { status: 500, body: fail("INTERNAL", "No pudimos crear el pedido. Intenta de nuevo.") };
  }
}
