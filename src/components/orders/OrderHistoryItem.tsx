import Link from "next/link";
import { Icon } from "@/components/nami";
import { RepeatOrderButton } from "@/components/cart/RepeatOrderButton";
import { ProductStrip, StatusPill, StoreStack, kindIcon } from "@/components/orders/OrderParts";
import { DEMO_RATE } from "@/lib/demo/home";
import type { OrderView } from "@/lib/orders/view";
import { formatUsd, formatVes, type Currency } from "@/lib/money";

/**
 * Un pedido anterior. Estructurado como tarjeta con superficie y jerarquía clara:
 * - Cabecera: Marca y tipo de tienda a la izquierda; total en USD (principal) con Bs. más pequeño y estado a la derecha.
 * - Cuerpo: Fila de productos con fotos reales (o iconos si no tienen), total de ítems y código de pedido.
 *   Si fue cancelado, muestra el motivo completo y legible.
 * - Pie: Acción directa para repetir pedido y affordance para ver el detalle.
 */
export function OrderHistoryItem({ o, money }: { o: OrderView; money?: { currency: Currency; rate: number } }) {
  const cancelled = o.status === "cancelled";
  const first = o.stops[0];
  const name = o.stops.map((s) => s.store.name).join(" + ");
  const kinds = [...new Set(o.stops.map((s) => s.kindLabel))].join(" + ");
  const thumbs = o.stops.flatMap((s) =>
    s.lines.map((l) => ({
      key: `${s.store.slug}-${l.key}`,
      icon: l.icon,
      image: l.image,
      qty: l.qty,
      name: l.name,
      color: s.store.color,
    }))
  );
  const href = `/pedidos/${encodeURIComponent(o.id)}`;
  const rate = money?.rate ?? DEMO_RATE;

  return (
    <article className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-surface p-4 transition-all duration-200 hover:border-primary/40 hover:bg-surface-tile/30 hover:shadow-card desktop:p-5">
      {/* 1. Cabecera: Identidad de tienda a la izq; USD principal, Bs. secundario y estado a la der */}
      <div className="flex items-start justify-between gap-2.5 tablet:gap-3">
        <div className="flex min-w-0 items-start gap-2.5 tablet:gap-3">
          <span className={cancelled ? "shrink-0 opacity-55 grayscale" : "shrink-0"}>
            <span className="block tablet:hidden">
              <StoreStack stores={o.stops.map((s) => s.store)} size={44} />
            </span>
            <span className="hidden tablet:block">
              <StoreStack stores={o.stops.map((s) => s.store)} size={48} />
            </span>
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex min-w-0 items-center gap-2">
            <h3 className="min-w-0 truncate text-body-strong font-bold text-ink transition-colors group-hover:text-primary-text">
              <Link
                href={href}
                className="outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-(--focus-ring)"
              >
                {name}
              </Link>
            </h3>
            <span className="shrink-0"><StatusPill status={o.status} /></span>
            </div>
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-caption text-ink-muted">
              <span className="inline-flex items-center gap-1 shrink-0 [&_.nm-icon]:size-3.5">
                <Icon name={kindIcon(first.store, first.kindLabel)} />
                {kinds}
              </span>
              <span className="inline-flex items-center gap-1.5 shrink-0">
                <span aria-hidden="true">·</span>
                <span>{o.when}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end">
          <div className="flex flex-col items-end">
            <span className={`text-price font-bold tabular-nums ${cancelled ? "text-ink-muted line-through decoration-1" : "text-ink"}`}>
              {formatUsd(o.totalCents)}
            </span>
            <span className="text-[11px] font-medium text-ink-muted tabular-nums">
              {formatVes(o.totalCents, rate)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Cuerpo: Tira de productos con fotos reales y resumen */}
      <div className="my-3 flex flex-1 flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className={cancelled ? "min-w-0 opacity-60 grayscale" : "min-w-0"}>
            <span className="block tablet:hidden">
              <ProductStrip items={thumbs} max={5} size={42} />
            </span>
            <span className="hidden tablet:block">
              <ProductStrip items={thumbs} max={5} size={46} />
            </span>
          </div>
          <div className="flex shrink-0 flex-col items-end text-caption text-ink-muted">
            <span className="font-semibold text-ink">{o.itemCount} {o.itemCount === 1 ? "producto" : "productos"}</span>
            <span className="tabular-nums">#{o.code}</span>
          </div>
        </div>
        {/* Motivo de cancelación legible sin recortar */}
        {cancelled && o.cancelReason ? (
          <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-surface-tile px-3 py-2 text-caption text-ink-muted">
            <Icon name="close" className="mt-0.5 size-3.5 shrink-0 text-danger" />
            <p className="leading-snug">{o.cancelReason}</p>
          </div>
        ) : null}
      </div>

      {/* 3. Pie: Ver detalle y botón de Repetir */}
      <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-3">
        <span className="inline-flex items-center gap-1 text-caption font-semibold text-ink-muted transition-colors group-hover:text-primary-text [&_.nm-icon]:size-3.5">
          Ver detalle
          <Icon name="chevronRight" />
        </span>
        <RepeatOrderButton
          stops={o.stops}
          label={cancelled ? "Volver a pedir" : "Repetir"}
          className="nm-btn nm-btn--secondary nm-btn--sm relative z-10 shrink-0"
        />
      </div>
    </article>
  );
}
