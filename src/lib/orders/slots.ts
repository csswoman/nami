/**
 * Franjas para programar un pedido: horas en punto o y media, desde 30 minutos adelante hasta el fin de mañana,
 * en las que TODAS las tiendas del pedido están abiertas según su horario semanal. Funciones puras (hora de Caracas, UTC-4).
 */
import { caracasMinutes, caracasWeekday, clockLabel, isOpenAt, type DayHours } from "@/lib/catalog";
export const SLOT_STEP_MIN = 30;
/** Antelación mínima al elegir una franja (al validar se tolera un poco menos por el tiempo que tarda el pedido). */
export const SLOT_LEAD_MIN = 30;
const SLOT_GRACE_MIN = 10;
const STEP_MS = SLOT_STEP_MIN * 60_000;
const DAY_MS = 86_400_000;
const CARACAS_MS = 4 * 3_600_000;
export type Slot = { at: number; /** "Hoy" o "Mañana" */ day: "Hoy" | "Mañana"; label: string };
type Schedule = { schedule: DayHours[] };
const startOfDay = (now: number) => Math.floor((now - CARACAS_MS) / DAY_MS) * DAY_MS + CARACAS_MS;
/** Última franja posible: el final de mañana (hora de Caracas). */
export const slotHorizon = (now: number) => startOfDay(now) + 2 * DAY_MS;
const allOpenAt = (stores: Schedule[], at: number) => stores.length > 0 && stores.every((s) => isOpenAt(s, caracasMinutes(at), caracasWeekday(at)));
/** Franjas disponibles ahora para estas tiendas, en orden. */
export function availableSlots(stores: Schedule[], now: number): Slot[] {
  const out: Slot[] = [];
  const today = startOfDay(now);
  const first = Math.ceil((now + SLOT_LEAD_MIN * 60_000) / STEP_MS) * STEP_MS;
  for (let at = first; at < slotHorizon(now); at += STEP_MS) {
    if (!allOpenAt(stores, at)) continue;
    out.push({ at, day: at < today + DAY_MS ? "Hoy" : "Mañana", label: clockLabel(caracasMinutes(at)) });
  }
  return out;
}
export type SlotCheck = { ok: true } | { ok: false; message: string };
/** Valida la franja que mandó el cliente: en la cuadrícula, ni muy pronto ni muy lejos, y con todas las tiendas abiertas. */
export function validateSlot(at: number, stores: Schedule[], now: number): SlotCheck {
  if (!Number.isInteger(at) || at % STEP_MS !== 0) return { ok: false, message: "La hora elegida no es válida." };
  if (at < now + (SLOT_LEAD_MIN - SLOT_GRACE_MIN) * 60_000) return { ok: false, message: "Esa hora ya no está disponible. Elige una franja más adelante." };
  if (at >= slotHorizon(now)) return { ok: false, message: "Solo puedes programar para hoy o mañana." };
  if (!allOpenAt(stores, at)) return { ok: false, message: "Alguna de las tiendas está cerrada a esa hora. Elige otra franja." };
  return { ok: true };
}
