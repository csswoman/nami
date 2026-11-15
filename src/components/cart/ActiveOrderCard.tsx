"use client";

import Link from "next/link";
import { Icon } from "@/components/nami";
import { StoreStack } from "@/components/orders/OrderParts";
import type { TrackedOrder } from "@/lib/cart/hooks";
import { orderStoreName } from "@/lib/cart/store";
import { STAGE_COUNT, formatClock, stageHeadline, stageLabels } from "@/lib/orders/progress";
import { formatUsd } from "@/lib/money";

/** Pedido en curso: etapa real del recorrido, hora de llegada y lo que pediste en una línea. */
export function ActiveOrderCard({ t }: { t: TrackedOrder }) {
  const { order: o, progress: p } = t;
  const [title] = stageHeadline(p.stage, o.stops, o.courier);
  const labels = stageLabels(o.stops);
  const items = o.lines.reduce((n, l) => n + l.qty, 0);
  return (
    <Link href={`/seguimiento?id=${encodeURIComponent(o.id)}`} className="flex flex-col gap-4 rounded-xl bg-primary-tint p-4 transition-shadow hover:shadow-card desktop:flex-row desktop:items-center desktop:gap-6 desktop:p-5">
      <div className="flex min-w-0 grow items-start gap-3.5">
        <StoreStack stores={o.stops.map((s) => s.store)} size={56} />
        <div className="flex min-w-0 grow flex-col gap-2">
          <div className="flex flex-col">
            <span className="font-display text-title-md">{title}</span>
            <span className="truncate text-caption text-ink-muted">{orderStoreName(o)} · {items} {items === 1 ? "producto" : "productos"} · {formatUsd(o.totalCents)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="grid grid-cols-5 gap-1" aria-hidden="true">
              {Array.from({ length: STAGE_COUNT }, (_, i) => (
                <span key={i} className={`h-1.5 rounded-pill ${i < p.stage || p.arrived ? "bg-primary" : i === p.stage ? "bg-promo" : "bg-surface"}`} />
              ))}
            </div>
            <span className="text-badge text-primary-text">Paso {p.stage + 1} de {STAGE_COUNT}: {labels[p.stage]}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-primary/15 pt-3 desktop:flex-col desktop:items-end desktop:border-t-0 desktop:border-l desktop:pt-0 desktop:pl-6">
        <span className="flex flex-col desktop:items-end">
          <span className="text-caption text-ink-muted">{p.arrived ? "Llegó a las" : "Llega a las"}</span>
          <b className="font-display text-title-lg">{formatClock(p.etaAt)}</b>
          {p.arrived ? null : <span className="text-caption text-ink-muted">en {p.minsLeft} min</span>}
        </span>
        <span className="flex items-center gap-1 text-button text-primary-text [&_.nm-icon]:size-5">
          {p.arrived ? "Confirmar entrega" : "Ver recorrido"}<Icon name="chevronRight" />
        </span>
      </div>
      <span className="sr-only">Pedido #{o.id}</span>
    </Link>
  );
}

/** Sin pedidos en curso. */
export function NoActiveOrder() {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-border bg-surface-tile p-5 desktop:flex-row desktop:items-center desktop:justify-between">
      <span className="flex flex-col gap-0.5">
        <span className="text-body-strong font-bold">No tienes pedidos en curso</span>
        <span className="text-caption text-ink-muted">Cuando hagas un pedido, aquí verás en qué va y a qué hora llega.</span>
      </span>
      <Link href="/listado" className="nm-btn nm-btn--primary">Explorar restaurantes</Link>
    </div>
  );
}
