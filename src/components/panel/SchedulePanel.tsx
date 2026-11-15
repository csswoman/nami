"use client";
import { useState } from "react";
import type { DayHours } from "@/lib/catalog";
import { callPanel } from "./api";
const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const toTime = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const fromTime = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};
/** El cierre que no es mayor que la apertura cae al día siguiente ("00:00" = medianoche). */
const closeFrom = (open: number, t: string) => {
  const c = fromTime(t);
  return c <= open ? c + 1440 : c;
};
/** Editor del horario semanal: turnos por día. Un día sin turnos queda cerrado. */
export function SchedulePanel({ slug, initial }: { slug: string; initial: DayHours[] }) {
  const [shifts, setShifts] = useState(initial);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const update = (next: DayHours[]) => {
    setShifts(next);
    setMessage(null);
  };
  const patch = (target: DayHours, change: Partial<DayHours>) => update(shifts.map((s) => (s === target ? { ...s, ...change } : s)));
  async function save() {
    setBusy(true);
    const r = await callPanel<{ schedule: DayHours[] }>(`/api/tienda-admin/${slug}/hours`, "PUT", { schedule: shifts });
    if (r.data) setShifts(r.data.schedule);
    setMessage(r.error ? { ok: false, text: r.error } : { ok: true, text: "Horario guardado. Los clientes ya lo ven." });
    setBusy(false);
  }
  return (
    <div className="flex flex-col gap-4">
      <p className="text-caption text-ink-muted">Hora de Caracas. Si cierras después de medianoche, el cierre cuenta como del día siguiente. Un día sin turnos queda cerrado y los pedidos se programan para la próxima apertura.</p>
      <ul className="flex flex-col gap-3">
        {DAYS.map((name, day) => {
          const today = shifts.filter((s) => s.day === day);
          return (
            <li key={name} className="flex flex-col gap-2 rounded-lg border border-border p-3" data-testid="schedule-day">
              <div className="flex items-center gap-3">
                <h3 className="grow text-body-strong font-bold">{name}</h3>
                {today.length === 0 ? <span className="text-caption text-ink-muted">Cerrado</span> : null}
                <button type="button" disabled={today.length >= 3} onClick={() => update([...shifts, { day, opensAt: 540, closesAt: 1020 }])} className="nm-btn nm-btn--secondary">Agregar turno</button>
                {day === 0 && today.length ? (
                  <button type="button" onClick={() => update([...today, ...[1, 2, 3, 4, 5, 6].flatMap((d) => today.map((t) => ({ ...t, day: d })))])} className="nm-btn nm-btn--secondary">Copiar a toda la semana</button>
                ) : null}
              </div>
              {today.map((s, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <label className="text-caption" htmlFor={`o-${day}-${i}`}>Abre</label>
                  <input id={`o-${day}-${i}`} type="time" value={toTime(s.opensAt)} onChange={(e) => patch(s, { opensAt: fromTime(e.target.value), closesAt: closeFrom(fromTime(e.target.value), toTime(s.closesAt)) })} className="min-h-11 rounded-md border border-border px-3" />
                  <label className="text-caption" htmlFor={`c-${day}-${i}`}>Cierra</label>
                  <input id={`c-${day}-${i}`} type="time" value={toTime(s.closesAt)} onChange={(e) => patch(s, { closesAt: closeFrom(s.opensAt, e.target.value) })} className="min-h-11 rounded-md border border-border px-3" />
                  {s.closesAt > 1440 ? <span className="text-caption text-ink-muted">(día siguiente)</span> : null}
                  <button type="button" aria-label={`Quitar turno ${i + 1} del ${name}`} onClick={() => update(shifts.filter((x) => x !== s))} className="nm-btn nm-btn--secondary">Quitar</button>
                </div>
              ))}
            </li>
          );
        })}
      </ul>
      {message ? <p role={message.ok ? "status" : "alert"} className={`rounded-md px-4 py-3 text-body ${message.ok ? "bg-surface-tile text-success" : "bg-surface-warm text-danger"}`}>{message.text}</p> : null}
      <button type="button" disabled={busy} onClick={save} className="nm-btn nm-btn--primary nm-btn--block">Guardar horario</button>
    </div>
  );
}
