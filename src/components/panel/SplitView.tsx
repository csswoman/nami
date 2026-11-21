"use client";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Icon } from "@/components/nami";
import { PANEL_CHANGED_MESSAGE } from "@/lib/demo/split-view";
/** Recarga la página que el iframe tiene abierta ahora (no la inicial): si el cliente va por el checkout, sigue ahí. */
function reloadFrame(frame: HTMLIFrameElement | null) {
  try {
    frame?.contentWindow?.location.reload();
  } catch {
    if (frame) frame.src = frame.getAttribute("src") ?? "";
  }
}
/** Abre en una pestaña nueva la página que el iframe muestra ahora. */
function openFrame(frame: HTMLIFrameElement | null, fallback: string) {
  let href = fallback;
  try {
    href = frame?.contentWindow?.location.href ?? fallback;
  } catch {}
  window.open(href, "_blank", "noopener");
}
function Pane({ label, hint, title, src, frameRef, notice }: { label: string; hint: string; title: string; src: string; frameRef: RefObject<HTMLIFrameElement | null>; notice?: ReactNode }) {
  return (
    <section aria-label={label} className="flex min-h-0 flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <h2 className="grow text-caption text-ink-muted"><b className="text-ink">{label}:</b> {hint}</h2>
        <button type="button" onClick={() => reloadFrame(frameRef.current)} className="nm-btn nm-btn--ghost nm-btn--sm" aria-label={`Recargar ${label.toLowerCase()}`}>
          <Icon name="repeat" /> Recargar
        </button>
        <button type="button" onClick={() => openFrame(frameRef.current, src)} className="nm-btn nm-btn--ghost nm-btn--sm" aria-label={`Abrir ${label.toLowerCase()} en una pestaña nueva`}>
          <Icon name="arrowRight" /> Abrir aparte
        </button>
      </div>
      <div className="relative min-h-0 grow">
        <iframe ref={frameRef} title={title} src={src} className="size-full rounded-lg border border-border bg-surface" />
        {notice}
      </div>
    </section>
  );
}
/**
 * Los dos lados de la demo. El panel embebido avisa (postMessage) cuando cambia algo que el cliente ve
 * —precios, stock, horario, abrir o cerrar— y aquí se ofrece recargar el lado del cliente, sin recargarlo a la fuerza
 * (podría estar a mitad de un pedido).
 */
export function SplitView({ clientHref, panelHref, riderHref }: { clientHref: string; panelHref: string; riderHref?: string }) {
  const client = useRef<HTMLIFrameElement>(null);
  const panel = useRef<HTMLIFrameElement>(null);
  const rider = useRef<HTMLIFrameElement>(null);
  const [stale, setStale] = useState(false);
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== panel.current?.contentWindow) return;
      if ((e.data as { type?: unknown } | null)?.type === PANEL_CHANGED_MESSAGE) setStale(true);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);
  const notice = stale ? (
    <div role="status" className="absolute inset-x-3 top-3 flex items-center gap-3 rounded-lg bg-ink p-3 text-surface shadow-card">
      <p className="grow text-caption">La tienda cambió algo. Recarga para verlo como cliente.</p>
      <button
        type="button"
        onClick={() => {
          setStale(false);
          reloadFrame(client.current);
        }}
        className="nm-btn nm-btn--primary nm-btn--sm"
      >
        Recargar
      </button>
      <button type="button" onClick={() => setStale(false)} aria-label="Cerrar aviso" className="text-surface"><Icon name="close" /></button>
    </div>
  ) : null;
  return (
    <div className={`hidden min-h-0 grow gap-3 desktop:grid ${riderHref ? "grid-cols-3" : "grid-cols-2"}`} data-tour="split">
      <Pane label="Cliente" hint="pide algo de esta tienda" title="App del cliente" src={clientHref} frameRef={client} notice={notice} />
      <Pane label="Tienda" hint="acepta y prepara el pedido" title="Panel de tienda" src={panelHref} frameRef={panel} />
      {riderHref ? <Pane label="Repartidor" hint="tómalo y entrégalo" title="App del repartidor" src={riderHref} frameRef={rider} /> : null}
    </div>
  );
}
