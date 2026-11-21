"use client";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Badge, Icon } from "@/components/nami";
import { formatUsd } from "@/lib/money";
import { useNow } from "@/lib/cart/hooks";
import { formatSchedule } from "@/lib/orders/progress";
import type { StopAction, StopStatus } from "@/lib/orders/stop-machine";
import { SUBSTITUTION_LABELS } from "@/lib/orders/substitution";
import type { InventoryItem, PanelData, PanelItem, PanelStop } from "@/server/store-panel";
import { callPanel, notifyCatalogChanged } from "./api";
const POLL_MS = 4000;
const DONE_PREVIEW = 4;
const OFFLINE = "Sin conexión con el servidor.";
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
const EDITABLE: StopStatus[] = ["recibido", "aceptado", "preparando"];
/** Dos notas cortas cuando entra un pedido nuevo (solo si el navegador ya permite audio: hubo un clic en la página). */
function chime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    if (ctx.state === "suspended") return void ctx.close();
    [880, 1320].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.15);
      g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + i * 0.15 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.15 + 0.14);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.15);
      o.stop(ctx.currentTime + i * 0.15 + 0.15);
    });
    setTimeout(() => void ctx.close(), 600);
  } catch {}
}
const SOUND_KEY = "nami_panel_sonido";
const SOUND_EVENT = "nami:panel-sonido";
const readSound = () => {
  try {
    return window.localStorage.getItem(SOUND_KEY) !== "0";
  } catch {
    return true;
  }
};
const subscribeSound = (cb: () => void) => {
  window.addEventListener(SOUND_EVENT, cb);
  return () => window.removeEventListener(SOUND_EVENT, cb);
};
const clock = (ms: number) => new Date(ms).toLocaleTimeString("es-VE", { hour: "numeric", minute: "2-digit" });
const tone = (s: StopStatus) => (s === "cancelado" ? "danger" : s === "recibido" ? "promo" : "success");
/** Qué pidió el cliente que se haga si falta este producto, o qué se hizo ya. */
function substitutionNote(it: PanelItem): string | null {
  if (it.resolution?.kind === "removed") return "Sin stock: quitado del pedido.";
  if (it.resolution?.kind === "replaced") return `Sin stock: reemplaza a ${it.resolution.fromName}.`;
  if (!it.substitution) return null;
  const label = SUBSTITUTION_LABELS[it.substitution.kind];
  return it.substitution.kind === "product" && it.substitution.product ? `Si no hay: ${label.toLowerCase()} (${it.substitution.product}).` : `Si no hay: ${label.toLowerCase()}.`;
}
/** «No hay»: aplica lo que pidió el cliente; si hay que reemplazar, la tienda elige con qué. */
function OutOfStock({ item, slug, stopId, onDone }: { item: PanelItem; slug: string; stopId: string; onDone: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<InventoryItem[] | null>(null);
  const [replacement, setReplacement] = useState(item.substitution?.kind === "product" ? item.substitution.product ?? "" : "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const needsReplacement = (item.substitution?.kind ?? "remove") !== "remove";
  async function loadOptions() {
    setError(null);
    const r = await callPanel<{ items?: InventoryItem[] }>(`/api/tienda-admin/${slug}/inventory`);
    if (r.error) return setError(r.error);
    setOptions((r.data?.items ?? []).filter((i) => i.isAvailable && i.slug !== item.slug));
  }
  function start() {
    setOpen(true);
    if (needsReplacement && !options) void loadOptions();
  }
  async function apply() {
    setBusy(true);
    const r = await callPanel(`/api/tienda-admin/${slug}/stops/${stopId}/items/${item.id}`, "POST", needsReplacement && replacement ? { replacement } : {});
    setError(r.error);
    if (!r.error) await onDone();
    setBusy(false);
  }
  if (!open) return <button type="button" onClick={start} className="nm-btn nm-btn--secondary nm-btn--sm">No hay</button>;
  return (
    <div className="flex w-full flex-col gap-2 rounded-md bg-surface-tile p-3">
      {needsReplacement ? (
        <>
          <label htmlFor={`rep-${item.id}`} className="text-caption font-bold">Reemplazar «{item.name}» por</label>
          <select id={`rep-${item.id}`} value={replacement} onChange={(e) => setReplacement(e.target.value)} disabled={!options} className="min-h-11 rounded-md border border-border bg-surface px-3 text-body">
            <option value="">{options ? (options.length ? "Elige un producto…" : "No hay productos disponibles") : "Cargando…"}</option>
            {(options ?? []).map((o) => <option key={o.slug} value={o.slug}>{o.name} · {formatUsd(o.priceCents)}</option>)}
          </select>
          <p className="text-caption text-ink-muted">Si el reemplazo cuesta más, se cobra lo que pidió el cliente.</p>
        </>
      ) : <p className="text-caption">El cliente pidió quitarlo del pedido si no hay.</p>}
      {error ? (
        <p role="alert" className="text-caption font-bold text-danger">
          {error}
          {needsReplacement && !options ? <> <button type="button" onClick={() => void loadOptions()} className="underline">Reintentar</button></> : null}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button type="button" disabled={busy || (needsReplacement && !replacement)} onClick={() => void apply()} className="nm-btn nm-btn--primary grow">{needsReplacement ? "Reemplazar" : "Quitar del pedido"}</button>
        <button type="button" onClick={() => setOpen(false)} className="nm-btn nm-btn--secondary">Volver</button>
      </div>
    </div>
  );
}
function StopCard({ stop, busy, market, slug, now, onAct, onChanged }: { stop: PanelStop; busy: boolean; market: boolean; slug: string; now: number; onAct?: (a: StopAction, reason?: string) => void; onChanged: () => Promise<void> }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const primary = onAct ? stop.actions.find((a) => a !== "rechazar") : undefined;
  const canReject = !!onAct && stop.actions.includes("rechazar");
  const editable = market && !!onAct && EDITABLE.includes(stop.status);
  const fresh = stop.status === "recibido";
  return (
    <article className={`flex flex-col gap-3 rounded-lg border bg-surface-raised p-4 ${fresh ? "border-primary" : "border-border"}`} data-testid="panel-stop" data-status={stop.status} aria-busy={busy || undefined}>
      <header className="flex flex-wrap items-center gap-2">
        <h3 className="font-display text-title-md">{stop.code}</h3>
        <Badge tone={tone(stop.status)}>{STATUS_LABEL[stop.status]}</Badge>
        <span className="grow" />
        <span className="text-caption text-ink-muted">{clock(stop.createdAt)} · {stop.customerArea}</span>
      </header>
      {stop.scheduledFor ? <p className="rounded-md bg-surface-warm px-3 py-2 text-caption">Pedido programado: empieza {formatSchedule(stop.scheduledFor, now)}.</p> : null}
      <ul className="flex flex-col gap-1.5">
        {stop.items.map((it) => {
          const note = market ? substitutionNote(it) : null;
          return (
            <li key={it.id} className="flex flex-wrap items-baseline gap-2 text-body">
              <b>{it.qty}×</b>
              <span className={`grow ${it.resolution?.kind === "removed" ? "line-through opacity-60" : ""}`}>
                {it.name}
                {it.options.length || it.note ? <span className="block text-caption text-ink-muted">{[...it.options, it.note].filter(Boolean).join(" · ")}</span> : null}
                {note ? <span className="block text-caption text-ink-muted">{note}</span> : null}
              </span>
              <span className="text-ink-muted">{formatUsd(it.unitCents * it.qty)}</span>
              {editable && !it.resolution ? <OutOfStock item={it} slug={slug} stopId={stop.stopId} onDone={onChanged} /> : null}
            </li>
          );
        })}
      </ul>
      <p className="flex justify-between text-body-strong"><span>Subtotal de tu tienda</span><span>{formatUsd(stop.subtotalCents)}</span></p>
      {stop.otherStores.length ? <p className="text-caption text-ink-muted">Pedido con otras tiendas: {stop.otherStores.join(", ")}. El motorizado pasa por todas.</p> : null}
      {stop.rejectReason ? <p className="text-caption text-danger">Motivo: {stop.rejectReason}</p> : null}
      {rejecting && onAct ? (
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
      ) : primary || canReject ? (
        <div className="flex gap-2">
          {primary ? <button type="button" disabled={busy} onClick={() => onAct?.(primary)} className="nm-btn nm-btn--primary grow">{ACTION_LABEL[primary]}</button> : null}
          {canReject ? <button type="button" disabled={busy} onClick={() => setRejecting(true)} className="nm-btn nm-btn--secondary">{ACTION_LABEL.rechazar}</button> : null}
        </div>
      ) : null}
    </article>
  );
}
/**
 * Bandeja de la tienda: consulta cada pocos segundos (eso mantiene el panel "abierto" y le da el control de los pedidos).
 * Las consultas no se solapan y una respuesta vieja nunca pisa a una más nueva.
 */
export function StorePanel({ slug, initial, onQueueChange }: { slug: string; initial: PanelData; onQueueChange?: (pending: number) => void }) {
  const [data, setData] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busyStop, setBusyStop] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simulated, setSimulated] = useState<string | null>(null);
  const sound = useSyncExternalStore(subscribeSound, readSound, () => true);
  const now = useNow(30_000);
  const seq = useRef(0);
  const refresh = useCallback(async () => {
    const mine = ++seq.current;
    const r = await callPanel<PanelData>(`/api/tienda-admin/${slug}/orders`);
    if (mine !== seq.current) return; // salió otra consulta después: esta respuesta ya está vieja
    if (r.data) {
      setData(r.data);
      setError((e) => (e === OFFLINE ? null : e));
    } else setError(OFFLINE);
  }, [slug]);
  useEffect(() => {
    const requests = seq;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    const loop = async () => {
      await refresh();
      if (!stopped) timer = setTimeout(loop, POLL_MS);
    };
    timer = setTimeout(loop, POLL_MS);
    // Al volver a la pestaña, poner la bandeja al día de una vez.
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      requests.current++; // descarta la consulta que esté en vuelo (p. ej. de la tienda anterior)
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);
  useEffect(() => onQueueChange?.(data.queue.length), [data.queue.length, onQueueChange]);
  async function act(stopId: string, action: StopAction, reason?: string) {
    setBusyStop(stopId);
    const r = await callPanel(`/api/tienda-admin/${slug}/stops/${stopId}`, "POST", { action, reason });
    setError(r.error);
    await refresh();
    setBusyStop(null);
  }
  /** Pide al servidor un pedido de prueba para esta tienda (mismo flujo que un cliente real). */
  async function simulate() {
    setSimulating(true);
    setSimulated(null);
    const r = await callPanel<{ code: string }>(`/api/tienda-admin/${slug}/simulate`, "POST");
    setError(r.error);
    if (r.data) setSimulated(r.data.code);
    await refresh();
    setSimulating(false);
  }
  function toggleSound() {
    try {
      window.localStorage.setItem(SOUND_KEY, sound ? "0" : "1");
    } catch {}
    window.dispatchEvent(new Event(SOUND_EVENT));
  }
  async function toggleOpen() {
    setToggling(true);
    const r = await callPanel(`/api/tienda-admin/${slug}/open`, "POST", { open: !data.store.isOpen });
    setError(r.error);
    if (!r.error) notifyCatalogChanged();
    await refresh();
    setToggling(false);
  }
  const market = data.store.kind === "mercado";
  const fresh = data.queue.filter((s) => s.status === "recibido").length;
  // Pedido nuevo: suena (si está activado) y el título de la pestaña lleva la cuenta, aunque estés en otra pestaña.
  const seenFresh = useRef(fresh);
  useEffect(() => {
    if (fresh > seenFresh.current && sound) chime();
    seenFresh.current = fresh;
    const base = document.title.replace(/^\(\d+\) /, "");
    document.title = fresh ? `(${fresh}) ${base}` : base;
  }, [fresh, sound]);
  const done = showDone ? data.done : data.done.slice(0, DONE_PREVIEW);
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-wrap items-center gap-3 rounded-lg bg-surface-tile p-4">
        <span aria-hidden className={`size-3 shrink-0 rounded-pill ${data.store.isOpen ? "bg-success" : "bg-ink-muted"}`} />
        <div className="grow">
          <p className="text-body-strong font-bold">{data.store.isOpen ? "Tienda abierta" : "Tienda cerrada"}</p>
          <p className="text-caption text-ink-muted">{data.store.isOpen ? "Recibe pedidos dentro de su horario." : "Los clientes pueden pedir y quedan programados para la próxima apertura."}</p>
        </div>
        <button type="button" disabled={toggling} onClick={() => void toggleOpen()} className="nm-btn nm-btn--secondary">
          {data.store.isOpen ? "Cerrar tienda" : "Abrir tienda"}
        </button>
      </section>
      {error ? <p role="alert" className="rounded-md bg-surface-warm px-4 py-3 text-body text-danger">{error}</p> : null}
      <section className="flex flex-col gap-3" aria-label="Pedidos por atender">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="font-display text-title-lg">Por atender ({data.queue.length})</h2>
          <span className="text-caption font-bold text-primary-text" role="status">{fresh ? (fresh === 1 ? "1 pedido nuevo" : `${fresh} pedidos nuevos`) : ""}</span>
          <span className="grow" />
          <button type="button" onClick={toggleSound} aria-pressed={sound} className="nm-btn nm-btn--ghost nm-btn--sm"><Icon name="bell" />{sound ? "Sonido activado" : "Sin sonido"}</button>
          <button type="button" disabled={simulating} onClick={() => void simulate()} className="nm-btn nm-btn--secondary nm-btn--sm" data-testid="simulate-order"><Icon name="plus" />{simulating ? "Creando…" : "Simular pedido entrante"}</button>
        </div>
        {simulated ? <p role="status" className="text-caption text-ink-muted">Llegó el pedido de prueba {simulated}: lo creó el servidor con el mismo flujo que un cliente real.</p> : null}
        {data.queue.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg bg-surface-tile p-6 text-center text-body text-ink-muted">
            <p>No hay pedidos pendientes. Haz un pedido desde la app del cliente o simula uno: aparecerá aquí en unos segundos.</p>
            <button type="button" disabled={simulating} onClick={() => void simulate()} className="nm-btn nm-btn--primary">{simulating ? "Creando…" : "Simular pedido entrante"}</button>
          </div>
        ) : null}
        <div className="grid gap-3 desktop:grid-cols-2">
          {data.queue.map((s) => (
            <StopCard key={s.stopId} stop={s} now={now} busy={busyStop === s.stopId} market={market} slug={slug} onAct={(action, reason) => void act(s.stopId, action, reason)} onChanged={refresh} />
          ))}
        </div>
      </section>
      {data.done.length ? (
        <section className="flex flex-col gap-3" aria-label="Pedidos atendidos">
          <h2 className="font-display text-title-md">Atendidos hoy ({data.done.length})</h2>
          <div className="grid gap-3 desktop:grid-cols-2">
            {done.map((s) => <StopCard key={s.stopId} stop={s} now={now} busy={false} market={market} slug={slug} onChanged={refresh} />)}
          </div>
          {data.done.length > DONE_PREVIEW ? (
            <button type="button" onClick={() => setShowDone((v) => !v)} className="nm-btn nm-btn--ghost self-start">
              {showDone ? "Ver menos" : `Ver los ${data.done.length} atendidos`}
            </button>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
