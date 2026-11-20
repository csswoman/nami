"use client";

import { ActiveOrderCard, NoActiveOrder } from "@/components/cart/ActiveOrderCard";
import { OrderHistoryItem } from "@/components/orders/OrderHistoryItem";
import { useNow, useOrders } from "@/lib/cart/hooks";
import { fromOrder, type OrderView } from "@/lib/orders/view";
import type { Currency } from "@/lib/money";

/** "En curso" y "Anteriores": tus pedidos de este navegador primero, luego el historial de ejemplo. */
export function OrdersView({ demo, money }: { demo: OrderView[]; money?: { currency: Currency; rate: number } }) {
  const now = useNow();
  const { ready, active, past } = useOrders(now);
  const history = [...past.map((t) => fromOrder(t.order, t.progress, now)), ...demo];

  return (
    <div className="flex flex-col gap-9 desktop:gap-11">
      {/* Sección: En curso */}
      <section aria-labelledby="en-curso" className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 id="en-curso" className="font-display text-title-lg text-ink">
              En curso
            </h2>
            {active.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-primary/10 px-2.5 py-0.5 text-badge font-bold text-primary-text">
                <span className="size-2 rounded-pill bg-primary animate-pulse" />
                {active.length} {active.length === 1 ? "activo" : "activos"}
              </span>
            )}
          </div>
        </div>

        {!ready ? (
          <div className="h-28 rounded-2xl bg-surface-tile animate-pulse" aria-busy="true" />
        ) : active.length === 0 ? (
          <NoActiveOrder />
        ) : (
          <div className="flex flex-col gap-3">
            {active.map((t) => (
              <ActiveOrderCard key={t.order.id} t={t} money={money} />
            ))}
          </div>
        )}
      </section>

      {/* Sección: Anteriores */}
      <section aria-labelledby="anteriores" className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between border-b border-border/40 pb-2">
          <h2 id="anteriores" className="font-display text-title-lg text-ink">
            Anteriores
          </h2>
          <span className="text-caption text-ink-muted">
            {history.length} {history.length === 1 ? "pedido" : "pedidos"}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 desktop:grid-cols-2 desktop:items-start desktop:gap-5">
          {history.map((o) => (
            <OrderHistoryItem key={o.id} o={o} money={money} />
          ))}
        </div>
      </section>
    </div>
  );
}
