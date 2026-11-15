import Link from "next/link";
import { Icon } from "@/components/nami";
import { RepeatOrderButton } from "@/components/cart/RepeatOrderButton";
import { ProductStrip, StatusPill, StoreStack, kindIcon } from "@/components/orders/OrderParts";
import type { OrderView } from "@/lib/orders/view";
import { formatUsd } from "@/lib/money";

/**
 * Un pedido anterior. Lo que lo distingue a simple vista: la tienda y su tipo, los productos con su icono
 * y color, el número de pedido y el estado. Toda la fila abre el detalle; "Repetir" va aparte.
 */
export function OrderHistoryItem({ o }: { o: OrderView }) {
  const cancelled = o.status === "cancelled";
  const first = o.stops[0];
  const name = o.stops.map((s) => s.store.name).join(" + ");
  const kinds = [...new Set(o.stops.map((s) => s.kindLabel))].join(" + ");
  const thumbs = o.stops.flatMap((s) => s.lines.map((l) => ({ key: `${s.store.slug}-${l.key}`, icon: l.icon, qty: l.qty, name: l.name, color: s.store.color })));
  const href = `/pedidos/${encodeURIComponent(o.id)}`;
  return (
    <article className="group relative flex flex-col gap-3 rounded-xl p-3 transition-colors hover:bg-surface-tile/60 desktop:p-4">
      <div className="flex items-start gap-3">
        <span className={cancelled ? "opacity-55 grayscale" : undefined}><StoreStack stores={o.stops.map((s) => s.store)} size={52} /></span>
        <div className="flex min-w-0 grow flex-col gap-0.5">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="truncate text-body-strong font-bold">
              <Link href={href} className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-(--focus-ring)">{name}</Link>
            </h3>
            <span className={`shrink-0 text-price ${cancelled ? "text-ink-muted line-through decoration-1" : ""}`}>{formatUsd(o.totalCents)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-ink-muted">
            <StatusPill status={o.status} />
            <span className="inline-flex items-center gap-1 [&_.nm-icon]:size-3.5"><Icon name={kindIcon(first.store, first.kindLabel)} />{kinds}</span>
            <span>{o.when}</span>
          </div>
        </div>
      </div>
      <div className="flex items-end justify-between gap-3 pl-0 desktop:pl-16">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className={cancelled ? "opacity-60 grayscale" : undefined}><ProductStrip items={thumbs} max={5} size={44} /></div>
          <p className="line-clamp-1 text-caption text-ink-muted">
            {cancelled && o.cancelReason ? o.cancelReason : `${o.itemCount} ${o.itemCount === 1 ? "producto" : "productos"} · Pedido #${o.id}`}
          </p>
        </div>
        <RepeatOrderButton stops={o.stops} label={cancelled ? "Volver a pedir" : "Repetir"} className="nm-btn nm-btn--secondary nm-btn--sm relative z-10 shrink-0" />
      </div>
    </article>
  );
}
