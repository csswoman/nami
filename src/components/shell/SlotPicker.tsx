"use client";
import { useEffect, useState } from "react";
import { slotsFor } from "@/app/checkout/actions";
import type { Slot } from "@/lib/orders/slots";
/** Franja elegida: la hora (ms) y cómo decirla ("hoy a las 6:00 p. m."). */
export type ChosenSlot = { at: number; text: string };
const textOf = (s: Slot) => `${s.day === "Hoy" ? "hoy" : "mañana"} a las ${s.label}`;
/**
 * "¿Cuándo lo quieres?": lo antes posible o una franja de hoy o mañana en que todas las tiendas del pedido están abiertas.
 * Las franjas las calcula el servidor. Si las tiendas no están en la BD (pedido local), no se muestra.
 */
export function SlotPicker({ storeSlugs, value, onChange }: { storeSlugs: string[]; value: ChosenSlot | null; onChange: (slot: ChosenSlot | null) => void }) {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const key = storeSlugs.join(",");
  useEffect(() => {
    let cancelled = false;
    slotsFor(key.split(","))
      .then((res) => {
        if (cancelled) return;
        setSlots(res);
        // Si la franja elegida ya no existe (pasó la hora o cambió el carrito), se vuelve a "lo antes posible".
        if (res && value && !res.some((s) => s.at === value.at)) onChange(null);
      })
      .catch(() => !cancelled && setSlots(null));
    return () => {
      cancelled = true;
    };
    // `value` y `onChange` no deben volver a pedir las franjas: solo cambian las tiendas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  if (!slots || slots.length === 0) return null;
  const groups = (["Hoy", "Mañana"] as const).map((day) => [day, slots.filter((s) => s.day === day)] as const).filter(([, list]) => list.length);
  return (
    <section className="flex flex-col gap-2" aria-label="Cuándo lo quieres">
      <h2 className="font-display text-title-lg desktop:text-[20px]">¿Cuándo lo quieres?</h2>
      <label htmlFor="slot" className="sr-only">Hora de entrega</label>
      <select
        id="slot"
        value={value?.at ?? ""}
        onChange={(e) => {
          const picked = slots.find((s) => String(s.at) === e.target.value);
          onChange(picked ? { at: picked.at, text: textOf(picked) } : null);
        }}
        className="min-h-12 rounded-md border border-border bg-surface px-3 text-body"
      >
        <option value="">Lo antes posible</option>
        {groups.map(([day, list]) => (
          <optgroup key={day} label={day}>
            {list.map((s) => <option key={s.at} value={s.at}>{s.label}</option>)}
          </optgroup>
        ))}
      </select>
      {value ? <p className="text-caption text-ink-muted">Programado para {value.text}. Empezamos a prepararlo a esa hora.</p> : null}
    </section>
  );
}
