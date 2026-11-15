/**
 * Máquina de estados de un pedido con varias tiendas.
 * Cada parada (`order_stop`) avanza por su cuenta con las acciones de su tienda; `advanceOrderStatus`
 * decide el estado general del pedido a partir de todas las paradas. Funciones puras, sin BD.
 */
export type StopStatus = "recibido" | "aceptado" | "preparando" | "listo" | "en_camino" | "entregado" | "cancelado";
export type StopAction = "aceptar" | "rechazar" | "preparar" | "listo";
export type OrderStatusName = "recibido" | "preparando" | "buscando_motorizado" | "en_camino" | "entregado" | "cancelado";
export const STOP_ACTIONS: readonly StopAction[] = ["aceptar", "rechazar", "preparar", "listo"];
export const isStopAction = (v: unknown): v is StopAction => typeof v === "string" && (STOP_ACTIONS as readonly string[]).includes(v);
const TRANSITIONS: Record<StopAction, { from: StopStatus[]; to: StopStatus }> = {
  aceptar: { from: ["recibido"], to: "aceptado" },
  rechazar: { from: ["recibido", "aceptado", "preparando"], to: "cancelado" },
  preparar: { from: ["aceptado"], to: "preparando" },
  listo: { from: ["preparando"], to: "listo" },
};
/** Transición no permitida desde el estado actual; las rutas la devuelven como 409. */
export class InvalidTransition extends Error {
  constructor(public from: StopStatus, public action: StopAction) {
    super(`No se puede «${action}» una parada en estado «${from}».`);
  }
}
/** Estado al que pasa una parada con esa acción; lanza `InvalidTransition` si no corresponde. */
export function applyStopAction(current: StopStatus, action: StopAction): StopStatus {
  const t = TRANSITIONS[action];
  if (!t.from.includes(current)) throw new InvalidTransition(current, action);
  return t.to;
}
/** Acciones que la tienda puede hacer ahora. */
export function allowedActions(current: StopStatus): StopAction[] {
  return STOP_ACTIONS.filter((a) => TRANSITIONS[a].from.includes(current));
}
/**
 * Etapa máxima del recorrido mientras una tienda atiende el pedido: 0 si alguna parada espera respuesta,
 * 1 si alguna está aceptada o en preparación, null si todas las paradas vivas están listas (sigue el motorizado).
 */
export function holdStageOf(stops: StopStatus[]): 0 | 1 | null {
  const alive = stops.filter((s) => s !== "cancelado");
  if (alive.some((s) => s === "recibido")) return 0;
  if (alive.some((s) => s === "aceptado" || s === "preparando")) return 1;
  return null;
}
/** Estado general del pedido según sus paradas. Una vez en camino o cerrado, el pedido no retrocede. */
export function advanceOrderStatus(current: OrderStatusName, stops: StopStatus[]): OrderStatusName {
  if (stops.length > 0 && stops.every((s) => s === "cancelado")) return "cancelado";
  if (current === "cancelado" || current === "entregado" || current === "en_camino") return current;
  const hold = holdStageOf(stops);
  return hold === 0 ? "recibido" : hold === 1 ? "preparando" : "buscando_motorizado";
}
/** Estado de una parada cuando el recorrido avanza solo por tiempo (etapa 0–4). */
const STOP_BY_STAGE: StopStatus[] = ["recibido", "preparando", "listo", "en_camino", "en_camino"];
export const stopStatusAtStage = (stage: number): StopStatus => STOP_BY_STAGE[Math.max(0, Math.min(stage, STOP_BY_STAGE.length - 1))];
