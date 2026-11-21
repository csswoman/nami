"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge, Icon } from "@/components/nami";
import { callPanel } from "@/components/panel/api";
import { formatUsd } from "@/lib/money";
import type { RiderAction } from "@/lib/rider-input";
import type { RiderBoard, RiderOrder } from "@/server/rider";

const POLL_MS = 4000;
const ACTION: Record<RiderOrder["stage"], { action: RiderAction; label: string } | null> = {
  disponible: { action: "tomar", label: "Tomar pedido" },
  a_tienda: { action: "recoger", label: "Ya lo recogí" },
  en_camino: { action: "llegue", label: "Llegué a la puerta" },
  llego: null,
};
const STAGE_LABEL: Record<RiderOrder["stage"], string> = { disponible: "Esperando repartidor", a_tienda: "Ve a la tienda", en_camino: "En camino al cliente", llego: "Entregado" };
const clock = (ms: number) => new Date(ms).toLocaleTimeString("es-VE", { hour: "numeric", minute: "2-digit" });

function OrderCard({ o, busy, onAct }: { o: RiderOrder; busy: boolean; onAct?: (a: RiderAction) => void }) {
  const next = ACTION[o.stage];
  return (
    <article className={`flex flex-col gap-3 rounded-lg border bg-surface-raised p-4 ${o.stage === "disponible" ? "border-primary" : "border-border"}`} data-testid="rider-order" data-stage={o.stage}>
      <header className="flex flex-wrap items-center gap-2">
        <h3 className="font-display text-title-md">{o.code}</h3>
        <Badge tone={o.stage === "disponible" ? "promo" : o.stage === "llego" ? "success" : "primary"}>{STAGE_LABEL[o.stage]}</Badge>
        <span className="grow" />
        <span className="text-caption text-ink-muted">{clock(o.createdAt)}</span>
      </header>
      <ol className="flex flex-col gap-2 text-body">
        {o.stores.map((s) => (
          <li key={s.name} className="flex items-start gap-2 [&_.nm-icon]:mt-0.5 [&_.nm-icon]:size-4"><Icon name="bag" /><span><b>Recoge en {s.name}</b>{s.area ? <span className="block text-caption text-ink-muted">{s.area}</span> : null}</span></li>
        ))}
        <li className="flex items-start gap-2 [&_.nm-icon]:mt-0.5 [&_.nm-icon]:size-4"><Icon name="pin" /><span><b>Entrega en {o.customerArea}</b><span className="block text-caption text-ink-muted">{o.address}{o.reference ? ` · ${o.reference}` : ""}</span></span></li>
      </ol>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-caption text-ink-muted">
        <span>Ganas <b className="text-body-strong text-ink">{formatUsd(o.earningCents)}</b> (envío y propina)</span>
        {o.cashCents !== null ? <span>Cobra en efectivo: <b className="text-ink">{formatUsd(o.cashCents)}</b></span> : <span>Ya está pagado</span>}
        {o.stage !== "disponible" ? <span>El cliente te ve como {o.courierName}</span> : null}
      </div>
      {next && onAct ? <button type="button" disabled={busy} onClick={() => onAct(next.action)} className="nm-btn nm-btn--primary nm-btn--block">{next.label}</button> : null}
    </article>
  );
}

/**
 * App del repartidor. Mientras está conectada consulta el servidor cada pocos segundos: eso hace que los pedidos
 * listos esperen a esta persona en vez de asignarse solos. Al desconectarse (o cerrar la pestaña), siguen solos.
 */
export function RiderApp({ initial, embedded = false }: { initial: RiderBoard; embedded?: boolean }) {
  const [board, setBoard] = useState(initial);
  const [online, setOnline] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);
  const refresh = useCallback(async () => {
    const mine = ++seq.current;
    const r = await callPanel<RiderBoard>("/api/repartidor");
    if (mine !== seq.current) return;
    if (r.data) {
      setBoard(r.data);
      setError(null);
    } else setError(r.error);
  }, []);
  useEffect(() => {
    if (!online) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const loop = async () => {
      await refresh();
      if (!stopped) timer = setTimeout(loop, POLL_MS);
    };
    void loop();
    return () => {
      stopped = true;
      seq.current++;
      clearTimeout(timer);
    };
  }, [online, refresh]);
  async function act(id: string, action: RiderAction) {
    setBusy(id);
    const r = await callPanel(`/api/repartidor/orders/${id}`, "POST", { action });
    setError(r.error);
    await refresh();
    setBusy(null);
  }
  const earned = board.done.reduce((n, o) => n + o.earningCents, 0);
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-wrap items-center gap-3 rounded-lg bg-surface-tile p-4">
        <span aria-hidden className={`size-3 shrink-0 rounded-pill ${online ? "bg-success" : "bg-ink-muted"}`} />
        <div className="grow">
          <p className="text-body-strong font-bold">{online ? "Conectado" : "Desconectado"}</p>
          <p className="text-caption text-ink-muted">{online ? "Los pedidos listos te esperan a ti. Si te desconectas, se asignan solos." : "Los pedidos se asignan solos a un motorizado simulado."}</p>
        </div>
        <button type="button" onClick={() => setOnline((v) => !v)} className="nm-btn nm-btn--secondary" aria-pressed={online}>{online ? "Desconectarme" : "Conectarme"}</button>
      </section>
      {error ? <p role="alert" className="rounded-md bg-surface-warm px-4 py-3 text-body text-danger">{error}</p> : null}

      {board.mine.length ? (
        <section aria-label="Mis entregas" className="flex flex-col gap-3">
          <h2 className="font-display text-title-lg">En curso ({board.mine.length})</h2>
          <div className={`grid gap-3 ${embedded ? "" : "desktop:grid-cols-2"}`}>
            {board.mine.map((o) => <OrderCard key={o.id} o={o} busy={busy === o.id} onAct={(a) => void act(o.id, a)} />)}
          </div>
        </section>
      ) : null}

      <section aria-label="Pedidos esperando repartidor" className="flex flex-col gap-3">
        <h2 className="font-display text-title-lg">Esperando repartidor ({board.available.length})</h2>
        {board.available.length === 0 ? (
          <div className="flex flex-col gap-2 rounded-lg bg-surface-tile p-5 text-body text-ink-muted">
            <p>No hay pedidos listos ahora. Ves tus propios pedidos (los que haces desde este navegador) y los simulados desde el panel de una tienda: cuando la tienda los deja «Listos para retirar», aparecen aquí y te esperan hasta 90 s.</p>
            {embedded ? null : <p>Para probarlo: abre la <Link href="/demo" className="font-bold text-primary-text underline">pantalla dividida</Link>, haz un pedido y déjalo listo desde el panel.</p>}
          </div>
        ) : (
          <div className={`grid gap-3 ${embedded ? "" : "desktop:grid-cols-2"}`}>
            {board.available.map((o) => <OrderCard key={o.id} o={o} busy={busy === o.id} onAct={online ? (a) => void act(o.id, a) : undefined} />)}
          </div>
        )}
      </section>

      {board.done.length ? (
        <section aria-label="Entregados" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <h2 className="font-display text-title-md">Entregados ({board.done.length})</h2>
            <span className="text-caption text-ink-muted">Ganaste {formatUsd(earned)}</span>
          </div>
          <div className={`grid gap-3 ${embedded ? "" : "desktop:grid-cols-2"}`}>
            {board.done.map((o) => <OrderCard key={o.id} o={o} busy={false} />)}
          </div>
        </section>
      ) : null}
    </div>
  );
}
