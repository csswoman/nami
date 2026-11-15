"use server";
import { currentGuestToken } from "@/server/guest";
import { OrderError } from "@/server/orders";
import { submitReview } from "@/server/reviews";
export type ReviewResult = { ok: true } | { ok: false; message: string };
/** Guarda la calificación de un pedido entregado (se puede volver a enviar para corregirla). */
export async function submitReviewAction(orderId: string, raw: unknown): Promise<ReviewResult> {
  const token = await currentGuestToken();
  if (!token) return { ok: false, message: "Falta la cookie de invitado." };
  try {
    const saved = await submitReview(String(orderId), token, raw);
    return saved ? { ok: true } : { ok: false, message: "No encontramos ese pedido." };
  } catch (e) {
    if (e instanceof OrderError) return { ok: false, message: e.message };
    console.error("submitReview", e);
    return { ok: false, message: "No pudimos guardar tu calificación. Intenta de nuevo." };
  }
}
