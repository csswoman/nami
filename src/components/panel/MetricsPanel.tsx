"use client";
import { useCallback, useEffect, useState } from "react";
import { formatUsd } from "@/lib/money";
import type { StoreMetrics } from "@/server/metrics";
import { callPanel } from "./api";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg bg-surface-tile p-4">
      <span className="text-caption text-ink-muted">{label}</span>
      <b className="font-display text-title-lg tabular-nums">{value}</b>
      {hint ? <span className="text-caption text-ink-muted">{hint}</span> : null}
    </div>
  );
}

/** Ventas por día: una sola serie, barras de un tono con el valor al pasar el mouse y una tabla para lectores de pantalla. */
function SalesChart({ days }: { days: StoreMetrics["days"] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...days.map((d) => d.salesCents));
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-body-strong font-bold">Ventas por día</figcaption>
      <div className="relative flex h-40 items-end gap-0.5 border-b border-border" aria-hidden>
        {days.map((d, i) => (
          <div key={d.date} className="relative flex h-full grow flex-col justify-end" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <div className={`w-full rounded-t-[4px] transition-opacity ${hover === null || hover === i ? "bg-primary" : "bg-primary opacity-50"}`} style={{ height: `${Math.max(d.salesCents ? 2 : 0, (d.salesCents / max) * 100)}%` }} />
            {hover === i ? (
              <div className="absolute bottom-full left-1/2 z-10 mb-1 w-max -translate-x-1/2 rounded-md bg-ink px-2.5 py-1.5 text-caption text-surface shadow-card">
                <b>{d.label}</b> · {formatUsd(d.salesCents)} · {d.orders} {d.orders === 1 ? "pedido" : "pedidos"}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="flex gap-0.5 text-center text-caption text-ink-muted" aria-hidden>
        {days.map((d) => <span key={d.date} className="grow basis-0">{d.label}</span>)}
      </div>
      <details className="text-caption">
        <summary className="cursor-pointer text-primary-text">Ver como tabla</summary>
        <table className="mt-2 w-full text-left">
          <thead><tr className="text-ink-muted"><th className="py-1 font-medium">Día</th><th className="font-medium">Pedidos</th><th className="text-right font-medium">Ventas</th></tr></thead>
          <tbody>{days.map((d) => <tr key={d.date} className="border-t border-border"><td className="py-1">{d.label}</td><td>{d.orders}</td><td className="text-right tabular-nums">{formatUsd(d.salesCents)}</td></tr>)}</tbody>
        </table>
      </details>
    </figure>
  );
}

/** Pestaña «Ventas»: últimos 7 días, liquidación con la comisión de Ñami y lo que más se vende. Se carga al abrirla. */
export function MetricsPanel({ slug, active }: { slug: string; active: boolean }) {
  const [data, setData] = useState<StoreMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const apply = useCallback((r: Awaited<ReturnType<typeof callPanel<StoreMetrics>>>) => {
    setError(r.error);
    if (r.data) setData(r.data);
    setLoading(false);
  }, []);
  async function load() {
    setLoading(true);
    apply(await callPanel<StoreMetrics>(`/api/tienda-admin/${slug}/metrics`));
  }
  // Se carga cada vez que se abre la pestaña (los pedidos cambian mientras tanto).
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    void callPanel<StoreMetrics>(`/api/tienda-admin/${slug}/metrics`).then((r) => {
      if (!cancelled) apply(r);
    });
    return () => {
      cancelled = true;
    };
  }, [active, slug, apply]);
  if (!data) {
    return error ? <p role="alert" className="rounded-md bg-surface-warm px-4 py-3 text-body text-danger">{error}</p> : <div className="min-h-60" aria-busy="true" />;
  }
  const s = data.settlement;
  return (
    <div className="flex flex-col gap-6" data-testid="metrics">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="grow font-display text-title-lg">Últimos 7 días</h2>
        <button type="button" disabled={loading} onClick={() => void load()} className="nm-btn nm-btn--secondary nm-btn--sm">{loading ? "Actualizando…" : "Actualizar"}</button>
      </div>
      <div className="grid grid-cols-2 gap-3 desktop:grid-cols-4">
        <Stat label="Ventas" value={formatUsd(data.salesCents)} hint="Productos, sin envío ni propina" />
        <Stat label="Pedidos" value={String(data.orders)} hint={data.cancelled ? `${data.cancelled} cancelados o rechazados` : "Ninguno cancelado"} />
        <Stat label="Ticket promedio" value={formatUsd(data.avgTicketCents)} />
        <Stat label="Calificación" value={data.rating ? data.rating.avg.toLocaleString("es-VE") : "–"} hint={data.rating ? `${data.rating.count} reseñas` : "Sin reseñas esta semana"} />
      </div>
      <SalesChart days={data.days} />

      <section aria-labelledby="liquidacion" className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <div>
          <h3 id="liquidacion" className="font-display text-title-md">Liquidación</h3>
          <p className="text-caption text-ink-muted">Lo que Ñami le paga a tu tienda. El envío, el recargo y la propina son del motorizado y de Ñami, no de la tienda.</p>
        </div>
        <dl className="flex flex-col gap-1.5 text-body">
          <div className="flex justify-between"><dt>Venta bruta</dt><dd className="tabular-nums">{formatUsd(s.grossCents)}</dd></div>
          <div className="flex justify-between text-ink-muted"><dt>Cupones de tu tienda</dt><dd className="tabular-nums">−{formatUsd(s.storeDiscountCents)}</dd></div>
          <div className="flex justify-between text-ink-muted"><dt>Comisión de Ñami ({data.commissionPercent} %)</dt><dd className="tabular-nums">−{formatUsd(s.commissionCents)}</dd></div>
          <div className="flex justify-between border-t border-dashed border-border pt-2 text-body-strong font-bold"><dt>Neto a cobrar</dt><dd className="tabular-nums">{formatUsd(s.netCents)}</dd></div>
        </dl>
        <p className="text-caption text-ink-muted">Los cupones de Ñami (NAMI10, ENVIOGRATIS) los paga Ñami. Los de tu tienda se descuentan de tu venta y la comisión se cobra sobre lo rebajado.</p>
      </section>

      <div className="grid gap-4 desktop:grid-cols-2">
        <section aria-labelledby="top" className="flex flex-col gap-2">
          <h3 id="top" className="font-display text-title-md">Lo más pedido</h3>
          {data.topProducts.length ? (
            <ol className="flex flex-col">
              {data.topProducts.map((p, i) => (
                <li key={p.name} className="flex items-baseline gap-3 border-b border-border py-2 text-body last:border-b-0">
                  <span className="w-5 text-ink-muted">{i + 1}.</span>
                  <span className="grow">{p.name}</span>
                  <span className="text-caption text-ink-muted">{p.qty} u.</span>
                  <span className="tabular-nums">{formatUsd(p.salesCents)}</span>
                </li>
              ))}
            </ol>
          ) : <p className="text-body text-ink-muted">Todavía no hay ventas esta semana.</p>}
        </section>
        <section aria-labelledby="prep" className="flex flex-col gap-2">
          <h3 id="prep" className="font-display text-title-md">Tiempo de preparación</h3>
          {data.prep ? (
            <p className="text-body">
              <b className="font-display text-title-lg tabular-nums">{data.prep.avgMin.toLocaleString("es-VE")} min</b> en promedio, contra {data.prep.promisedMin.toLocaleString("es-VE")} min prometidos ({data.prep.samples} {data.prep.samples === 1 ? "pedido" : "pedidos"}).
            </p>
          ) : <p className="text-body text-ink-muted">Sale de los pedidos que la tienda prepara desde el panel: de «En preparación» a «Listo para retirar».</p>}
        </section>
      </div>
    </div>
  );
}
