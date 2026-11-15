"use client";

import Link from "next/link";
import { Icon } from "@/components/nami";
import { StoreStack } from "@/components/orders/OrderParts";
import type { TrackedOrder } from "@/lib/cart/hooks";
import { orderStoreName } from "@/lib/cart/store";
import { STAGE_COUNT, formatClock, stageHeadline, stageLabels } from "@/lib/orders/progress";
import { DEMO_RATE } from "@/lib/demo/home";
import { formatUsd, formatVes, type Currency } from "@/lib/money";

/** Pedido en curso: etapa real del recorrido, hora de llegada y lo que pediste en una tarjeta viva. */
export function ActiveOrderCard({ t, money }: { t: TrackedOrder; money?: { currency: Currency; rate: number } }) {
  const { order: o, progress: p } = t;
  const [title] = stageHeadline(p.stage, o.stops, o.courier);
  const labels = stageLabels(o.stops);
  const items = o.lines.reduce((n, l) => n + l.qty, 0);

  return (
    <Link
      href={`/seguimiento?id=${encodeURIComponent(o.id)}`}
      className="group relative flex flex-col gap-4.5 rounded-2xl border-2 border-primary/20 bg-primary-tint/70 p-4.5 transition-all duration-200 hover:border-primary/40 hover:bg-primary-tint hover:shadow-card desktop:flex-row desktop:items-center desktop:gap-6 desktop:p-6"
    >
      <div className="flex min-w-0 grow items-start gap-4">
        <StoreStack stores={o.stops.map((s) => s.store)} size={56} />
        <div className="flex min-w-0 grow flex-col gap-2.5">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="font-display text-title-md text-ink">{title}</span>
              <span className="inline-flex items-center gap-1 rounded-pill bg-primary/10 px-2 py-0.5 text-badge font-bold text-primary-text">
                <span className="size-1.5 rounded-pill bg-primary animate-pulse" />
                En vivo
              </span>
            </div>
            <span className="truncate text-caption text-ink-muted">
              {orderStoreName(o)} · {items} {items === 1 ? "producto" : "productos"} ·{" "}
              <b className="font-semibold text-ink">{formatUsd(o.totalCents)}</b>{" "}
              <span className="text-[11px]">({formatVes(o.totalCents, money?.rate ?? DEMO_RATE)})</span>
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="grid grid-cols-5 gap-1.5" aria-hidden="true">
              {Array.from({ length: STAGE_COUNT }, (_, i) => (
                <span
                  key={i}
                  className={`h-2 rounded-pill transition-all ${
                    i < p.stage || p.arrived
                      ? "bg-primary"
                      : i === p.stage
                      ? "bg-primary animate-pulse"
                      : "bg-surface"
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between text-badge">
              <span className="font-bold text-primary-text">
                Paso {p.stage + 1} de {STAGE_COUNT}: {labels[p.stage]}
              </span>
              <span className="text-ink-muted hidden tablet:inline">Pedido #{o.code ?? o.id}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-primary/15 pt-3 desktop:min-w-[190px] desktop:flex-col desktop:items-end desktop:border-t-0 desktop:border-l desktop:pt-0 desktop:pl-6">
        <span className="flex flex-col desktop:items-end">
          <span className="text-caption text-ink-muted">{p.arrived ? "Llegó a las" : "Hora estimada"}</span>
          <b className="font-display text-title-lg text-ink">{formatClock(p.etaAt)}</b>
          {p.arrived ? null : <span className="text-caption font-semibold text-primary-text">en {p.minsLeft} min</span>}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-primary px-3.5 py-1.5 text-button font-bold text-on-primary shadow-xs transition-transform group-hover:scale-[1.02] [&_.nm-icon]:size-4">
          {p.arrived ? "Confirmar entrega" : "Ver recorrido"}
          <Icon name="chevronRight" />
        </span>
      </div>
      <span className="sr-only">Pedido #{o.code ?? o.id}</span>
    </Link>
  );
}

/** Sin pedidos en curso. */
export function NoActiveOrder() {
  return (
    <div className="flex flex-col tablet:flex-row tablet:items-center tablet:justify-between gap-4 rounded-2xl border border-border/80 bg-surface-tile/50 p-4 desktop:p-5">
      <div className="flex items-center gap-3.5">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface text-ink-muted shadow-xs">
          <Icon name="moto" className="size-5.5" />
        </div>
        <div className="flex flex-col">
          <span className="text-body-strong font-bold text-ink">No tienes pedidos en curso</span>
          <span className="text-caption text-ink-muted">Cuando hagas un pedido, podrás seguir el recorrido del repartidor en vivo.</span>
        </div>
      </div>
      <Link href="/listado" className="nm-btn nm-btn--secondary nm-btn--sm self-start tablet:self-auto shrink-0">
        Explorar restaurantes
      </Link>
    </div>
  );
}
