"use client";
import { useState } from "react";
const REASONS = ["Me equivoqué de pedido", "Tarda demasiado", "Ya no lo necesito", "Otro motivo"] as const;
/** Cancelar el pedido con un motivo (solo se muestra antes de «En camino»). `onCancel` devuelve el error o null. */
export function CancelOrder({ onCancel }: { onCancel: (reason: string) => Promise<string | null> }) {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<(typeof REASONS)[number]>(REASONS[0]);
  const [other, setOther] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!open) {
    return <button type="button" onClick={() => setOpen(true)} className="nm-btn nm-btn--secondary nm-btn--block">Cancelar pedido</button>;
  }
  const reason = choice === "Otro motivo" ? other.trim() : choice;
  async function confirm() {
    setBusy(true);
    setError(await onCancel(reason));
    setBusy(false);
  }
  return (
    <form
      className="flex flex-col gap-3 rounded-lg border border-border p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (reason.length >= 3) void confirm();
      }}
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="pb-1 text-body-strong font-bold">¿Por qué cancelas?</legend>
        {REASONS.map((r) => (
          <label key={r} className="flex min-h-11 items-center gap-3 text-body">
            <input type="radio" name="cancel-reason" checked={choice === r} onChange={() => setChoice(r)} className="size-5 accent-primary" />
            {r}
          </label>
        ))}
      </fieldset>
      {choice === "Otro motivo" ? (
        <>
          <label htmlFor="cancel-other" className="sr-only">Cuéntanos el motivo</label>
          <textarea id="cancel-other" rows={2} maxLength={200} value={other} onChange={(e) => setOther(e.target.value)} placeholder="Cuéntanos qué pasó" className="resize-none rounded-md border border-border bg-surface px-4 py-3 text-body" />
        </>
      ) : null}
      {error ? <p role="alert" className="text-caption font-bold text-danger">{error}</p> : null}
      <div className="flex gap-2">
        <button type="submit" disabled={busy || reason.length < 3} className="nm-btn nm-btn--primary grow">{busy ? "Cancelando…" : "Confirmar cancelación"}</button>
        <button type="button" onClick={() => setOpen(false)} className="nm-btn nm-btn--secondary">Volver</button>
      </div>
    </form>
  );
}
