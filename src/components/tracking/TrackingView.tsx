"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/nami";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { EmptyState } from "@/components/shell/EmptyState";
import { BackIcon, RoundLink } from "@/components/shell/ScreenBar";
import { ROUTE_POINTS, STORE_SPOTS, TrackingMap, type Rider } from "@/components/tracking/TrackingMap";
import { useNow, useOrders } from "@/lib/cart/hooks";
import { CancelOrder } from "@/components/tracking/CancelOrder";
import { isRemoteId, useOrderActions } from "@/lib/orders/remote";
import { STAGE_COUNT, couriersOf, formatClock, formatSchedule, stageHeadline, stageLabels } from "@/lib/orders/progress";
import { formatUsd } from "@/lib/money";

const pts = (a: [number, number][]) => a.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(" ");

/** Ruta que sigue un motorizado que recoge en `spot` y va a casa: el tramo de la ruta general desde ese punto. */
function routeFrom(spot: [number, number]): [number, number][] {
  for (let i = 0; i < ROUTE_POINTS.length - 1; i++) {
    const [a, b] = [ROUTE_POINTS[i], ROUTE_POINTS[i + 1]];
    const on = spot[0] >= Math.min(a[0], b[0]) && spot[0] <= Math.max(a[0], b[0]) && spot[1] >= Math.min(a[1], b[1]) && spot[1] <= Math.max(a[1], b[1]);
    if (on) return [spot, ...ROUTE_POINTS.slice(i + 1)];
  }
  return ROUTE_POINTS;
}

/** Punto sobre la ruta (Manhattan) a la fracción `t` y la polilínea recorrida hasta ahí. */
function along(route: [number, number][], t: number) {
  const seg = route.slice(1).map((p, i) => Math.abs(p[0] - route[i][0]) + Math.abs(p[1] - route[i][1]));
  const len = seg.reduce((a, b) => a + b, 0);
  let d = Math.max(0, Math.min(1, t)) * len;
  const out: [number, number][] = [route[0]];
  for (let i = 0; i < seg.length; i++) {
    if (d >= seg[i]) { out.push(route[i + 1]); d -= seg[i]; continue; }
    const a = route[i], b = route[i + 1], k = d / seg[i];
    out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]);
    break;
  }
  return out;
}

/** Seguimiento de un pedido hecho en este navegador (consulta el servidor cada pocos segundos; la moto se mueve aquí): etapas con su hora real o estimada, mapa y resumen. */
export function TrackingView({ id }: { id?: string }) {
  const router = useRouter();
  const now = useNow(250); // fino para que el motorizado avance suave
  const { ready, active, byId } = useOrders(now);
  const { advance, restart, confirm, cancel } = useOrderActions();

  if (!ready) return <div className="min-h-dvh" aria-busy="true" />;
  const t = id ? byId(id) : active[0];
  if (!t) {
    return (
      <EmptyState
        title={id ? "No encontramos ese pedido" : "No tienes pedidos en curso"}
        text="Cuando hagas un pedido, aquí verás en qué va y a qué hora llega."
        primary={{ href: "/pedidos", label: "Ver mis pedidos" }}
        secondary={{ href: "/listado", label: "Explorar restaurantes" }}
      />
    );
  }
  const { order: o, progress: p } = t;
  const st = p.stage;
  const done = p.finished;
  const cancelled = o.status === "cancelled";
  // El motorizado solo se mueve en "En camino": avanza según el tiempo entre esa etapa y la llegada.
  const ride = st < 3 ? 0 : st >= 4 ? 1 : Math.min(0.95, Math.max(0.05, (now - p.times[3]) / Math.max(1, p.times[4] - p.times[3])));
  const couriers = couriersOf(o);
  // Envíos separados: un motorizado por tienda, cada uno con su camino desde esa tienda hasta tu casa.
  const routes = couriers.length > 1 ? o.stops.map((_, i) => routeFrom(STORE_SPOTS[Math.min(i, STORE_SPOTS.length - 1)])) : [ROUTE_POINTS];
  const riders: Rider[] = routes.map((route) => {
    const path = along(route, ride);
    return { route: pts(route), traveled: pts(path), moto: path[path.length - 1] };
  });
  const labels = stageLabels(o.stops);
  const [title, text] = cancelled
    ? ["Pedido cancelado", o.cancelReason ? `Motivo: ${o.cancelReason}` : "La tienda no pudo atender tu pedido. No te cobramos nada."]
    : done ? ["Pedido entregado", `Lo recibiste a las ${formatClock(p.etaAt)}.`] : stageHeadline(st, o.stops, o.courier);
  const first = o.courier.name.split(" ")[0];
  const range = `entre ${formatClock(p.etaAt - 60_000)} y ${formatClock(p.etaAt + 60_000)}`;

  async function received() {
    if (await confirm(o.id)) router.push(`/entregado?id=${encodeURIComponent(o.id)}`);
  }

  return (
    <div className="mx-auto w-full desktop:grid desktop:max-w-300 desktop:grid-cols-[600px_minmax(0,1fr)] desktop:items-start desktop:gap-10 desktop:pt-7">
      <div className="relative h-85 overflow-hidden bg-surface-tile desktop:sticky desktop:top-6 desktop:h-180.75 desktop:rounded-xl desktop:shadow-card">
        <TrackingMap
          className="size-full"
          riders={riders}
          stores={o.stops.map((s) => ({ initials: s.store.initials, color: s.store.color }))}
        />
        <div className="absolute inset-x-4 top-4 flex items-center justify-between desktop:inset-x-5 desktop:top-5">
          <span className="desktop:hidden"><RoundLink href="/pedidos" label="Volver a mis pedidos" onTile><BackIcon /></RoundLink></span>
          <Link href="/pedidos" className="hidden min-h-11 items-center gap-1 rounded-pill bg-surface-raised pr-4 pl-2.5 text-button text-ink shadow-card desktop:flex [&_.nm-icon]:size-5"><BackIcon />Mis pedidos</Link>
          <Link href="/acerca" className="flex min-h-11 items-center rounded-pill bg-surface-raised px-5 text-button text-ink shadow-card desktop:hidden">Ayuda</Link>
        </div>
      </div>
      <div className="relative -mt-6 flex flex-col gap-5 rounded-t-xl bg-surface px-4 pt-3 pb-10 desktop:mt-0 desktop:gap-5.5 desktop:rounded-none desktop:px-0 desktop:pt-0">
        <span className="mx-auto h-1 w-10 rounded-pill bg-border desktop:hidden" aria-hidden="true" />
        <div className="flex flex-col gap-1.5" aria-live="polite">
          <span className="text-caption font-bold text-ink-muted">
            {cancelled ? "Cancelado" : done ? `Entregado a las ${formatClock(p.etaAt)}` : p.arrived ? `Llegó a las ${formatClock(p.etaAt)}` : `Llega en ${p.minsLeft} min · ${range}`}
          </span>
          <h1 className="font-display text-[28px] leading-8 font-extrabold desktop:text-[36px] desktop:leading-10">{title}</h1>
          <p className="text-body text-ink-muted">{text}</p>
          {cancelled && o.compensation ? (
            <p className="mt-1 flex flex-col gap-0.5 rounded-md bg-success-tint px-3 py-2 text-caption" data-testid="compensation">
              <b>Te dejamos {formatUsd(o.compensation.amountCents)} de regalo para tu próximo pedido.</b>
              <span>Usa el cupón <b className="tracking-wide">{o.compensation.code}</b> al pagar. Vale 7 días y es solo tuyo.</span>
            </p>
          ) : null}
          {o.riderLive && !done ? (
            <p className="mt-1 flex items-center gap-2 rounded-md bg-surface-tile px-3 py-2 text-caption [&_.nm-icon]:size-4"><Icon name="user" />Un repartidor de la demo lleva tu pedido en vivo desde su app.</p>
          ) : null}
          {o.scheduledFor && o.scheduledFor > now && !done ? (
            <p className="flex items-center gap-2 rounded-md bg-surface-warm px-3 py-2 text-caption font-bold [&_.nm-icon]:size-4"><Icon name="clock" />Pedido programado: empezamos a prepararlo {formatSchedule(o.scheduledFor, now)}.</p>
          ) : null}
          <div className="mt-2 grid grid-cols-5 gap-1.5" aria-hidden="true">
            {labels.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-pill ${i < st || p.arrived ? "bg-primary" : i === st ? "bg-promo" : "bg-border"}`} />
            ))}
          </div>
        </div>
        <ol className="flex flex-col" data-tour="etapas">
          {labels.map((label, i) => {
            const isDone = i < st || p.arrived;
            const cur = i === st && !p.arrived;
            return (
              <li key={label} className="flex min-h-12 gap-3.5" aria-current={cur ? "step" : undefined}>
                <span className="flex w-6 shrink-0 flex-col items-center">
                  <span className={`box-border grid size-6 place-items-center rounded-pill text-on-primary ${isDone ? "bg-primary" : cur ? "border-[7px] border-primary bg-surface-raised" : "border-2 border-border bg-surface"}`}>
                    {isDone ? <svg viewBox="0 0 24 24" className="size-3.5 fill-none stroke-current stroke-3" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" /></svg> : null}
                  </span>
                  {i < STAGE_COUNT - 1 ? <span className={`min-h-5 w-0.5 grow ${i < st ? "bg-primary" : "bg-border"}`} /> : null}
                </span>
                <span className="flex grow justify-between gap-2 pt-px">
                  <span className={`text-body ${cur ? "font-bold" : "font-medium"} ${isDone || cur ? "text-ink" : "text-ink-muted"}`}>{label}</span>
                  <span className="text-caption text-ink-muted tabular-nums">{isDone || cur ? formatClock(p.times[i]) : `aprox. ${formatClock(p.times[i])}`}</span>
                </span>
              </li>
            );
          })}
        </ol>
        {st >= 2 || done ? couriers.map((c) => (
          <div key={c.plate} className="flex items-center gap-3 rounded-lg bg-surface-tile p-3.5">
            <span className="grid size-13 shrink-0 place-items-center rounded-pill bg-ink font-display text-[17px] font-black text-surface">{c.initials}</span>
            <div className="flex min-w-0 grow flex-col gap-0.5">
              <span className="text-body-strong font-bold">{st === 2 && !done ? `Asignando a ${c.name}` : c.name}</span>
              <span className="flex items-center gap-1 text-caption text-ink-muted [&_.nm-icon]:size-4"><Icon name="star" />{c.rating} · {c.vehicle} · {c.plate}</span>
            </div>
            <button type="button" aria-label={`Llamar a ${c.name.split(" ")[0]}`} className="grid size-11 place-items-center rounded-pill bg-surface-raised text-ink">
              <svg className="nm-icon size-5" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /></svg>
            </button>
            <button type="button" aria-label={`Escribirle a ${c.name.split(" ")[0]}`} className="grid size-11 place-items-center rounded-pill bg-surface-raised text-ink">
              <svg className="nm-icon size-5" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4V5Z" /></svg>
            </button>
          </div>
        )) : null}
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-pill bg-primary-tint text-primary-text [&_.nm-icon]:size-5"><Icon name="pin" /></span>
          <div className="flex flex-col gap-0.5">
            <span className="text-body-strong font-semibold">{o.address.line}</span>
            <span className="text-caption text-ink-muted">{o.address.reference}</span>
          </div>
        </div>
        {p.arrived && !done ? <button type="button" onClick={() => void received()} className="nm-btn nm-btn--primary nm-btn--block">Confirmar que lo recibí</button> : null}
        {!done && st < 3 && isRemoteId(o.id) ? <CancelOrder onCancel={(reason) => cancel(o.id, reason)} /> : null}
        {done ? <Link href={`/pedidos/${encodeURIComponent(o.id)}`} className="nm-btn nm-btn--primary nm-btn--block">Ver detalle del pedido</Link> : null}
        <OrderSummary order={o} />
        {done ? null : (
          <div className="flex flex-col gap-2.5 rounded-lg border border-dashed border-border p-4">
            <span className="text-caption font-bold text-ink-muted">Modo demo · El recorrido avanza solo con el tiempo</span>
            {p.arrived ? (
              <button type="button" onClick={() => void restart(o.id)} className="nm-btn nm-btn--secondary nm-btn--block"><Icon name="repeat" />Reiniciar simulación</button>
            ) : o.hold != null ? (
              <p className="text-caption text-ink-muted">{o.hold >= 2 ? "Ahora lo lleva el repartidor desde /repartidor: avanza cuando él lo marque." : "La tienda lo está atendiendo desde su panel: avanza cuando ella lo marque."}</p>
            ) : (
              <button type="button" onClick={() => void advance(o.id)} className="nm-btn nm-btn--secondary nm-btn--block"><Icon name="chevronRight" />Saltar a «{labels[st + 1]}»</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
