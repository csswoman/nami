/** Validación del horario semanal que edita una tienda. Pura: la usan el servidor y los tests. */
import type { DayHours } from "./catalog";
export const MAX_SHIFTS_PER_DAY = 3;
export type ScheduleResult = { ok: true; schedule: DayHours[] } | { ok: false; message: string };
const isInt = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v);
/** Comprueba y ordena el horario: turnos válidos, sin cruzarse (tampoco con el que pasa de medianoche del día anterior). */
export function validateSchedule(raw: unknown): ScheduleResult {
  if (!Array.isArray(raw)) return { ok: false, message: "El horario debe ser una lista de turnos." };
  if (raw.length > 7 * MAX_SHIFTS_PER_DAY) return { ok: false, message: "Demasiados turnos." };
  const shifts: DayHours[] = [];
  for (const r of raw as Record<string, unknown>[]) {
    if (!r || !isInt(r.day) || !isInt(r.opensAt) || !isInt(r.closesAt)) return { ok: false, message: "Cada turno necesita día, apertura y cierre." };
    if (r.day < 0 || r.day > 6) return { ok: false, message: "El día debe ir de 0 (lunes) a 6 (domingo)." };
    if (r.opensAt < 0 || r.opensAt >= 1440) return { ok: false, message: "La apertura debe estar entre 12:00 a. m. y 11:59 p. m." };
    if (r.closesAt <= r.opensAt) return { ok: false, message: "El cierre debe ser después de la apertura." };
    if (r.closesAt - r.opensAt > 1440) return { ok: false, message: "Un turno no puede durar más de 24 horas." };
    shifts.push({ day: r.day, opensAt: r.opensAt, closesAt: r.closesAt });
  }
  shifts.sort((a, b) => a.day - b.day || a.opensAt - b.opensAt);
  for (let d = 0; d < 7; d++) {
    const today = shifts.filter((s) => s.day === d);
    if (today.length > MAX_SHIFTS_PER_DAY) return { ok: false, message: `Máximo ${MAX_SHIFTS_PER_DAY} turnos por día.` };
    for (let i = 1; i < today.length; i++) if (today[i].opensAt < today[i - 1].closesAt) return { ok: false, message: "Dos turnos del mismo día se cruzan." };
    // Lo que el día anterior deja pasado de medianoche no puede pisar el primer turno de hoy.
    const spill = Math.max(0, ...shifts.filter((s) => s.day === (d + 6) % 7).map((s) => s.closesAt - 1440));
    if (today.length && spill > today[0].opensAt) return { ok: false, message: "Un turno de la noche anterior se cruza con la apertura del día siguiente." };
  }
  return { ok: true, schedule: shifts };
}
