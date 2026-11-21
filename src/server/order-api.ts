import "server-only";
import { z } from "zod";
import type { ApiError } from "@/lib/orders/input";
import { orderInputSchema, type OrderInput } from "@/lib/orders/input";
import type { Order } from "@/lib/cart/store";
import { currentClientIp, currentGuestToken } from "./guest";
import { getDemand } from "./prefs";
import { logError } from "./log";
import { LIMITS, checkRateLimit, rateLimitMessage } from "./rate-limit";
import { OrderError, createOrder, quoteOrder, type OrderQuote } from "./orders";

export type ActionResult = { ok: true; order: Order } | ({ ok: false } & ApiError);

const fail = (code: ApiError["error"]["code"], message: string): ApiError => ({ error: { code, message } });

/** Valida, resuelve el invitado y crea el pedido. Lo usan la Server Action y POST /api/orders. */
export async function placeFromUnknown(raw: unknown): Promise<{ status: number; body: { order: Order } | ApiError; retryAfterS?: number }> {
  const limited = await checkRateLimit(`orders:${await currentClientIp()}`, LIMITS.orders);
  if (!limited.ok) return { status: 429, body: fail("RATE_LIMITED", rateLimitMessage(limited.retryAfterS)), retryAfterS: limited.retryAfterS };
  const parsed = orderInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 400, body: fail("INVALID_INPUT", z.prettifyError(parsed.error)) };
  }
  const token = await currentGuestToken();
  if (!token) return { status: 401, body: fail("NO_GUEST_TOKEN", "Falta la cookie de invitado. Abre la página una vez y vuelve a intentar.") };
  try {
    return { status: 201, body: { order: await createOrder(parsed.data as OrderInput, token, Date.now(), { demand: await getDemand() }) } };
  } catch (e) {
    if (e instanceof OrderError) return { status: e.status, body: fail(e.code, e.message) };
    await logError("createOrder", e);
    return { status: 500, body: fail("INTERNAL", "No pudimos crear el pedido. Intenta de nuevo.") };
  }
}
export type QuoteResult = { ok: true; quote: OrderQuote } | ({ ok: false } & ApiError);
/** Cotiza el pedido con su cupón (sin crearlo). Mismas validaciones que `placeFromUnknown`. */
export async function quoteFromUnknown(raw: unknown): Promise<QuoteResult> {
  const parsed = orderInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, ...fail("INVALID_INPUT", z.prettifyError(parsed.error)) };
  const token = await currentGuestToken();
  if (!token) return { ok: false, ...fail("NO_GUEST_TOKEN", "Falta la cookie de invitado. Abre la página una vez y vuelve a intentar.") };
  try {
    return { ok: true, quote: await quoteOrder(parsed.data as OrderInput, token, Date.now(), { demand: await getDemand() }) };
  } catch (e) {
    if (e instanceof OrderError) return { ok: false, ...fail(e.code, e.message) };
    await logError("quoteOrder", e);
    return { ok: false, ...fail("INTERNAL", "No pudimos revisar el cupón. Intenta de nuevo.") };
  }
}
