"use server";
import type { ApiError } from "@/lib/orders/input";
import { currentGuestToken } from "@/server/guest";
import { advanceOrder, confirmDelivered, restartOrder } from "@/server/orders";
import type { ActionResult } from "@/server/order-api";

type Op = (id: string, token: string) => ReturnType<typeof advanceOrder>;
async function run(op: Op, id: string): Promise<ActionResult> {
  const token = await currentGuestToken();
  const err = (code: ApiError["error"]["code"], message: string): ActionResult => ({ ok: false, error: { code, message } });
  if (!token) return err("NO_GUEST_TOKEN", "Falta la cookie de invitado.");
  const order = await op(String(id), token);
  return order ? { ok: true, order } : err("NOT_FOUND", "No encontramos ese pedido.");
}

/** Demo: salta a la etapa siguiente. */
export const advanceOrderAction = async (id: string) => run(advanceOrder, id);
/** Demo: reinicia el recorrido. */
export const restartOrderAction = async (id: string) => run(restartOrder, id);
/** «Confirmar que lo recibí». */
export const confirmOrderAction = async (id: string) => run(confirmDelivered, id);
