"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/nami";
import { formatUsd } from "@/lib/money";
import { useNow } from "@/lib/cart/hooks";
import { formatSchedule } from "@/lib/orders/progress";
import type { StopAction, StopStatus } from "@/lib/orders/stop-machine";
import { SUBSTITUTION_LABELS } from "@/lib/orders/substitution";
import type { InventoryItem, PanelData, PanelItem, PanelStop } from "@/server/store-panel";
const POLL_MS = 4000;
const STATUS_LABEL: Record<StopStatus, string> = {
  recibido: "Nuevo",
  aceptado: "Aceptado",
  preparando: "En preparación",
  listo: "Listo para retirar",
  en_camino: "En camino",
  entregado: "Entregado",
  cancelado: "Rechazado",
};
const ACTION_LABEL: Record<StopAction, string> = {
  aceptar: "Aceptar",
  rechazar: "Rechazar",
  preparar: "Empezar a preparar",
  listo: "Listo para retirar",
};
const clock = (ms: number) => new Date(ms).toLocaleTimeString("es-VE", { hour: "numeric", minute: "2-digit" });
type ApiFailure = { error?: { message?: string } };
async function post(url: string, body: unknown): Promise<string | null> {
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) return null;
    return ((await res.json()) as ApiFailure).error?.message ?? "No se pudo completar la acción.";
  } catch {
    return "Sin conexión. Intenta de nuevo.";
  }
}
/** Qué pidió el cliente que se haga si falta este producto, o qué se hizo ya. */
function substitutionNote(it: PanelItem): string | null {
  if (it.resolution?.kind === "removed") return "Sin stock: quitado del pedido.";
  if (it.resolution?.kind === "replaced") return `Sin stock: reemplaza a ${it.resolution.fromName}.`;
  if (!it.substitution) return null;
  const label = SUBSTITUTION_LABELS[it.substitution.kind];
  return it.substitution.kind === "product" && it.substitution.product ? `Si no hay: ${label.toLowerCase()} (${it.substitution.product}).` : `Si no hay: ${label.toLowerCase()}.`;
}
/** «No hay»: aplica lo que pidió el cliente; si hay que reemplazar, la tienda elige con qué. */
function OutOfStock({ item, slug, stopId, onDone }: { item: PanelItem; slug: string; stopId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<InventoryItem[] | null>(null);
  const [replacement, setReplacement] = useState(item.substitution?.kind === "product" ? item.substitution.product ?? "" : "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const needsReplacement = (item.substitution?.kind ?? "remove") !== "remove";
  async function start() {
    setOpen(true);
    if (needsReplacement && !options) {
      const res = await fetch(`/api/tienda-admin/${slug}/inventory`, { cache: "no-store" });
      const data = (await res.json()) as { items?: InventoryItem[] };
      setOptions((data.items ?? []).filter((i) => i.isAvailable && i.slug !== item.slug));
    }
  }
  async function apply() {
    setBusy(true);
    const message = await post(`/api/tienda-admin/${slug}/stops/${stopId}/items/${item.id}`, needsReplacement && replacement ? { replacement } : {});
    setError(message);
    setBusy(false);
    if (!message) onDone();
  }
  if (!open) return <button type="button" onClick={() => void start()} className="nm-btn nm-btn--secondary">No hay</button>;
  return (
    <div className="flex w-full flex-col gap-2 rounded-md bg-surface-tile p-3">
      {needsReplacement ? (
        <>
          <label htmlFor={`rep-${item.id}`} className="text-caption font-bold">Reemplazar «{item.name}» por</label>
          <select id={`rep-${item.id}`} value={replacement} onChange={(e) => setReplacement(e.target.value)} disabled={!options} className="min-h-11 rounded-md border border-border bg-surface px-3 text-body">
            <option value="">{options ? "Elige un producto…" : "Cargando…"}</option>
            {(options ?? []).map((o) => <option key={o.slug} value={o.slug}>{o.name} · {formatUsd(o.priceCents)}</option>)}
          </select>
          <p className="text-caption text-ink-muted">Si el reemplazo cuesta más, se cobra lo que pidió el cliente.</p>
        </>
      ) : <p className="text-caption">El cliente pidió quitarlo del pedido si no hay.</p>}
      {error ? <p role="alert" className="text-caption font-bold text-danger">{error}</p> : null}
      <div className="flex gap-2">
        <button type="button" disabled={busy || (needsReplacement && !replacement)} onClick={() => void apply()} className="nm-btn nm-btn--primary grow">{needsReplacement ? "Reemplazar" : "Quitar del pedido"}</button>
        <button type="button" onClick={() => setOpen(false)} className="nm-btn nm-btn--secondary">Volver</button>
      </div>
    </div>
  );
}
function StopCard({ stop, busy, market, slug, onAct, onChanged }: { stop: PanelStop; busy: boolean; market: boolean; slug: string; onAct: (a: StopAction, reason?: string) => void; onChanged: () => void }) {
  const now = useNow(30_000);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const primary = stop.actions.find((a) => a !== "rechazar");
  const canReject = stop.actions.includes("rechazar");
  return (
    <article className="flex flex-col gap-3 rounded-lg border border-border bg-surface-raised p-4" data-testid="panel-stop" data-status={stop.status}>
      <header className="flex flex-wrap items-center gap-2">
        <h3 className="font-display text-title-md">{stop.code}</h3>
        <Badge tone={stop.status === "cancelado" ? "danger" : stop.status === "recibido" ? "promo" : "success"}>{STATUS_LABEL[stop.status]}</Badge>
        <span className="grow" />
        <span className="text-caption text-ink-muted">{clock(stop.createdAt)} · {stop.customerArea}</span>
      </header>
      {stop.scheduledFor ? <p className="rounded-md bg-surface-warm px-3 py-2 text-caption">Pedido programado: empieza {formatSchedule(stop.scheduledFor, now)}.</p> : null}
      <ul className="flex flex-col gap-1.5">
        {stop.items.map((it) => (
          <li key={it.id} className="flex flex-wrap items-baseline gap-2 text-body">
            <b>{it.qty}×</b>
            <span className={`grow ${it.resolution?.kind === "removed" ? "line-through opacity-60" : ""}`}>
              {it.name}
              {it.options.length || it.note ? <span className="block text-caption text-ink-muted">{[...it.options, it.note].filter(Boolean).join(" · ")}</span> : null}
              {market && substitutionNote(it) ? <span className="block text-caption text-ink-muted">{substitutionNote(it)}</span> : null}
            </span>
            <span className="text-ink-muted">{formatUsd(it.unitCents * it.qty)}</span>
            {market && !it.resolution && ["recibido", "aceptado", "preparando"].includes(stop.status) ? <OutOfStock item={it} slug={slug} stopId={stop.stopId} onDone={onChanged} /> : null}
          </li>
        ))}
      </ul>
      <p className="flex justify-between text-body-strong"><span>Subtotal de tu tienda</span><span>{formatUsd(stop.subtotalCents)}</span></p>
      {stop.otherStores.length ? <p className="text-caption text-ink-muted">Pedido con otras tiendas: {stop.otherStores.join(", ")}. El motorizado pasa por todas.</p> : null}
      {stop.rejectReason ? <p className="text-caption text-danger">Motivo: {stop.rejectReason}</p> : null}
      {rejecting ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (reason.trim()) onAct("rechazar", reason.trim());
          }}
        >
          <label className="text-caption font-bold" htmlFor={`why-${stop.stopId}`}>Motivo del rechazo</label>
          <input id={`why-${stop.stopId}`} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} autoFocus placeholder="Ej.: se acabó la harina" className="min-h-11 rounded-md border border-border px-3 text-body" />
          <div className="flex gap-2">
            <button type="submit" disabled={busy || !reason.trim()} className="nm-btn nm-btn--primary grow">Confirmar rechazo</button>
            <button type="button" onClick={() => setRejecting(false)} className="nm-btn nm-btn--secondary">Volver</button>
          </div>
        </form>
      ) : (
        <div className="flex gap-2">
          {primary ? <button type="button" disabled={busy} onClick={() => onAct(primary)} className="nm-btn nm-btn--primary grow">{ACTION_LABEL[primary]}</button> : null}
          {canReject ? <button type="button" disabled={busy} onClick={() => setRejecting(true)} className="nm-btn nm-btn--secondary">{ACTION_LABEL.rechazar}</button> : null}
        </div>
      )}
    </article>
  );
}
/** Bandeja de la tienda: consulta cada pocos segundos (eso mantiene el panel "abierto" y le da el control de los pedidos). */
export function StorePanel({ slug, initial }: { slug: string; initial: PanelData }) {
  const [data, setData] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/tienda-admin/${slug}/orders`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const next = (await res.json()) as PanelData;
      if (alive.current) {
        setData(next);
        setError((e) => (e === "Sin conexión con el servidor." ? null : e));
      }
    } catch {
      if (alive.current) setError("Sin conexión con el servidor.");
    }
  }, [slug]);
  useEffect(() => {
    alive.current = true;
    const id = setInterval(refresh, POLL_MS);
    return () => {
      alive.current = false;
      clearInterval(id);
    };
  }, [refresh]);
  async function run(url: string, body: unknown) {
    setBusy(true);
    setError(await post(url, body));
    await refresh();
    setBusy(false);
  }
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-wrap items-center gap-3 rounded-lg bg-surface-tile p-4">
        <div className="grow">
          <p className="text-body-strong font-bold">{data.store.isOpen ? "Tienda abierta" : "Tienda cerrada"}</p>
          <p className="text-caption text-ink-muted">{data.store.isOpen ? "Recibe pedidos dentro de su horario." : "Los clientes pueden pedir y quedan programados para la próxima apertura."}</p>
        </div>
        <button type="button" disabled={busy} onClick={() => run(`/api/tienda-admin/${slug}/open`, { open: !data.store.isOpen })} className="nm-btn nm-btn--secondary">
          {data.store.isOpen ? "Cerrar tienda" : "Abrir tienda"}
        </button>
      </section>
      {error ? <p role="alert" className="rounded-md bg-surface-warm px-4 py-3 text-body text-danger">{error}</p> : null}
      <section className="flex flex-col gap-3" aria-label="Pedidos por atender">
        <h2 className="font-display text-title-lg">Por atender ({data.queue.length})</h2>
        {data.queue.length === 0 ? <p className="rounded-lg bg-surface-tile p-6 text-center text-body text-ink-muted">No hay pedidos pendientes. Haz un pedido desde la app del cliente y aparecerá aquí en unos segundos.</p> : null}
        <div className="grid gap-3 desktop:grid-cols-2">
          {data.queue.map((s) => <StopCard key={s.stopId} stop={s} busy={busy} market={data.store.kind === "mercado"} slug={slug} onAct={(action, reason) => run(`/api/tienda-admin/${slug}/stops/${s.stopId}`, { action, reason })} onChanged={refresh} />)}
        </div>
      </section>
      {data.done.length ? (
        <section className="flex flex-col gap-3" aria-label="Pedidos atendidos">
          <h2 className="font-display text-title-md">Atendidos hoy</h2>
          <div className="grid gap-3 desktop:grid-cols-2">
            {data.done.map((s) => <StopCard key={s.stopId} stop={s} busy={busy} market={data.store.kind === "mercado"} slug={slug} onAct={() => {}} onChanged={refresh} />)}
          </div>
        </section>
      ) : null}
    </div>
  );
}
