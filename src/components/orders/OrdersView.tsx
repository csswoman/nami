"use client";

import { ActiveOrderCard, NoActiveOrder } from "@/components/cart/ActiveOrderCard";
import { OrderHistoryItem } from "@/components/orders/OrderHistoryItem";
import { useNow, useOrders } from "@/lib/cart/hooks";
import { fromOrder, type OrderView } from "@/lib/orders/view";

/** "En curso" y "Anteriores": tus pedidos de este navegador primero, luego el historial de ejemplo. */
export function OrdersView({ demo }: { demo: OrderView[] }) {
  const now = useNow();
  const { ready, active, past } = useOrders(now);
  const history = [...past.map((t) => fromOrder(t.order, t.progress, now)), ...demo];
  return (
    <>
      <section aria-labelledby="en-curso" className="flex flex-col gap-3">
        <h2 id="en-curso" className="font-display text-title-lg">En curso{active.length > 1 ? ` (${active.length})` : ""}</h2>
        {!ready ? <div className="h-28 rounded-xl bg-surface-tile" aria-busy="true" /> : active.length === 0 ? <NoActiveOrder /> : active.map((t) => <ActiveOrderCard key={t.order.id} t={t} />)}
      </section>
      <section aria-labelledby="anteriores" className="flex flex-col gap-2">
        <h2 id="anteriores" className="font-display text-title-lg">Anteriores</h2>
        <div className="-mx-3 grid grid-cols-1 gap-x-6 gap-y-1 desktop:-mx-4 desktop:grid-cols-2">
          {history.map((o) => <OrderHistoryItem key={o.id} o={o} />)}
        </div>
      </section>
    </>
  );
}
