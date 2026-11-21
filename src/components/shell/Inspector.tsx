"use client";
import { useEffect, useSyncExternalStore } from "react";
import { Icon } from "@/components/nami";
import { INSPECTOR_KEY, INSPECTOR_MESSAGE, explainRequest, inspect, readInspectorEnabled, useInspector, type InspectEvent, type InspectTone, type NewInspectEvent } from "@/lib/inspector";

const TONE_DOT: Record<InspectTone, string> = { ok: "bg-success", info: "bg-brand-blue", warn: "bg-promo", error: "bg-danger" };
const KIND_LABEL: Record<InspectEvent["kind"], string> = { http: "API", action: "Server Action", domain: "Servidor" };
const clock = (ms: number) => new Date(ms).toLocaleTimeString("es-VE", { hour: "numeric", minute: "2-digit", second: "2-digit" });
const isEmbedded = () => {
  try {
    return window.parent !== window && window.parent.location.origin === window.location.origin;
  } catch {
    return false;
  }
};
const subscribeNoop = () => () => {};
/** De qué lado de la demo es esta página (para la pantalla dividida). */
const sideOf = (path: string) => (path.startsWith("/tienda-admin") ? "Tienda" : path.startsWith("/repartidor") ? "Repartidor" : "Cliente");

let patched = false;
/** Envuelve fetch una sola vez: registra las llamadas a /api y las Server Actions de esta misma app. */
function patchFetch() {
  if (patched || typeof window === "undefined") return;
  patched = true;
  const original = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    if (!useInspector.getState().enabled) return original(input, init);
    const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(raw, window.location.href);
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    const action = headers.has("next-action");
    if (url.origin !== window.location.origin || (!action && !url.pathname.startsWith("/api/"))) return original(input, init);
    const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    const t0 = performance.now();
    try {
      const res = await original(input, init);
      const ms = Math.round(performance.now() - t0);
      const requestId = res.headers.get("x-request-id");
      let code: string | undefined;
      if (!res.ok && !action) {
        try {
          code = ((await res.clone().json()) as { error?: { code?: string } })?.error?.code;
        } catch {}
      }
      inspect({
        kind: action ? "action" : "http",
        title: action ? `Server Action en ${url.pathname}` : `${method} ${url.pathname}`,
        detail: [`${res.status}${code ? ` ${code}` : ""}`, `${ms} ms`, requestId ? `requestId ${requestId.slice(0, 8)}…` : null, explainRequest(method, url.pathname, res.status)].filter(Boolean).join(" · "),
        tone: res.status >= 500 ? "error" : res.status >= 400 ? "warn" : "ok",
        data: { status: res.status, code: code ?? null, requestId, retryAfter: res.headers.get("retry-after") },
        mergeKey: method === "GET" ? `${method} ${url.pathname} ${res.status}` : undefined,
      });
      return res;
    } catch (e) {
      inspect({ kind: action ? "action" : "http", title: `${method} ${url.pathname}`, detail: "Sin conexión", tone: "error" });
      throw e;
    }
  };
}

/**
 * «Bajo el capó»: un panel flotante que muestra lo que hace el servidor mientras usas la demo.
 * Se activa con ?capo=1 (o desde /acerca y /demo) y queda guardado en este navegador.
 * Dentro de la pantalla dividida no se pinta: cada iframe le pasa sus eventos a la página de afuera.
 */
export function Inspector() {
  const { enabled, open, events, setEnabled, setOpen, clear, push } = useInspector();
  const embedded = useSyncExternalStore(subscribeNoop, isEmbedded, () => false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("capo");
    if (q === "1") setEnabled(true);
    else if (q === "0") setEnabled(false);
    else useInspector.setState({ enabled: readInspectorEnabled() });
    patchFetch();
    // Otra pestaña o la página de afuera lo activó o desactivó.
    const onStorage = (e: StorageEvent) => {
      if (e.key === INSPECTOR_KEY) useInspector.setState({ enabled: e.newValue === "1" });
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [setEnabled]);
  // Iframe: reenvía cada evento nuevo a la pantalla dividida.
  useEffect(() => {
    if (!embedded) return;
    const side = sideOf(window.location.pathname);
    return useInspector.subscribe((s, prev) => {
      const top = s.events[0];
      if (!top || top === prev.events[0]) return;
      const message: NewInspectEvent = { ...top, source: side };
      window.parent.postMessage({ type: INSPECTOR_MESSAGE, event: message }, window.location.origin);
    });
  }, [embedded]);
  // Página de afuera: recibe los eventos de sus iframes.
  useEffect(() => {
    if (embedded) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const data = e.data as { type?: unknown; event?: NewInspectEvent } | null;
      if (data?.type === INSPECTOR_MESSAGE && data.event && useInspector.getState().enabled) push({ ...data.event, at: undefined });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [embedded, push]);
  if (!enabled || embedded) return null;
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="fixed bottom-24 left-4 z-50 flex min-h-11 items-center gap-2 rounded-pill bg-ink px-4 text-button text-surface shadow-card desktop:bottom-6" data-testid="inspector-toggle">
        <Icon name="search" />
        Bajo el capó{events.length ? <span className="rounded-pill bg-surface px-2 text-badge text-ink">{events.length}</span> : null}
      </button>
    );
  }
  return (
    <aside aria-label="Bajo el capó" className="fixed inset-x-0 bottom-0 z-50 flex max-h-[70dvh] flex-col rounded-t-xl border border-border bg-surface shadow-card desktop:inset-x-auto desktop:right-4 desktop:bottom-4 desktop:max-h-[80dvh] desktop:w-[440px] desktop:rounded-xl" data-testid="inspector">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="grow">
          <h2 className="font-display text-title-md">Bajo el capó</h2>
          <p className="text-caption text-ink-muted">Lo que hace el servidor mientras usas la demo.</p>
        </div>
        <button type="button" onClick={clear} className="nm-btn nm-btn--ghost nm-btn--sm">Limpiar</button>
        <button type="button" onClick={() => setEnabled(false)} className="nm-btn nm-btn--ghost nm-btn--sm">Desactivar</button>
        <button type="button" onClick={() => setOpen(false)} aria-label="Minimizar" className="nm-iconbtn"><Icon name="chevronDown" /></button>
      </header>
      {events.length === 0 ? (
        <p className="p-4 text-body text-ink-muted">Todavía no pasa nada. Haz un pedido, abre el seguimiento o atiéndelo desde el panel de tienda y mira aquí cada llamada al servidor.</p>
      ) : (
        <ol className="flex min-h-0 grow flex-col overflow-y-auto">
          {events.map((e) => (
            <li key={e.id} className="border-b border-border px-4 py-2.5 last:border-b-0">
              <div className="flex items-start gap-2">
                <span aria-hidden className={`mt-1.5 size-2 shrink-0 rounded-pill ${TONE_DOT[e.tone]}`} />
                <div className="flex min-w-0 grow flex-col gap-0.5">
                  <span className="flex flex-wrap items-baseline gap-x-2 text-caption text-ink-muted">
                    <span className="tabular-nums">{clock(e.at)}</span>
                    <span className="font-bold text-ink">{KIND_LABEL[e.kind]}</span>
                    {e.source ? <span className="rounded-pill bg-surface-tile px-2 text-badge text-ink">{e.source}</span> : null}
                    {e.count && e.count > 1 ? <span>×{e.count}</span> : null}
                  </span>
                  <b className="break-words text-body-strong">{e.title}</b>
                  {e.detail ? <span className="text-caption text-ink-muted">{e.detail}</span> : null}
                  {e.data ? (
                    <details className="text-caption">
                      <summary className="cursor-pointer text-primary-text">Ver datos</summary>
                      <pre className="mt-1 overflow-x-auto rounded-md bg-surface-tile p-2 text-[12px] leading-4">{JSON.stringify(e.data, null, 2)}</pre>
                    </details>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
      <footer className="border-t border-border px-4 py-2.5 text-caption text-ink-muted">Solo en esta pestaña. Nada sale de tu navegador.</footer>
    </aside>
  );
}

/** Botón para activar o desactivar «Bajo el capó» (en /acerca, /bienvenida y /demo). */
export function InspectorSwitch({ className = "" }: { className?: string }) {
  const enabled = useInspector((s) => s.enabled);
  const setEnabled = useInspector((s) => s.setEnabled);
  return (
    <button type="button" aria-pressed={enabled} onClick={() => setEnabled(!enabled)} className={`nm-btn ${enabled ? "nm-btn--primary" : "nm-btn--secondary"} ${className}`} data-testid="inspector-switch">
      <Icon name="search" />
      {enabled ? "Bajo el capó: activo" : "Ver bajo el capó"}
    </button>
  );
}
