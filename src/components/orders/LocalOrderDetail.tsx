"use client";

import { OrderDetail } from "@/components/orders/OrderDetail";
import { EmptyState } from "@/components/shell/EmptyState";
import { useNow, useOrders } from "@/lib/cart/hooks";
import { fromOrder } from "@/lib/orders/view";

/** Detalle de un pedido hecho en este navegador (se lee de localStorage). */
export function LocalOrderDetail({ id }: { id: string }) {
  const now = useNow(60_000);
  const { ready, byId } = useOrders(now);
  if (!ready) return <div className="min-h-[60dvh]" aria-busy="true" />;
  const t = byId(id);
  if (!t) {
    return <EmptyState title="No encontramos ese pedido" text="Puede que se haya hecho en otro navegador o que se borraran los datos de este." primary={{ href: "/pedidos", label: "Ver mis pedidos" }} />;
  }
  if (!t.progress.finished) {
    return <EmptyState title="Este pedido sigue en curso" text="Cuando llegue y confirmes que lo recibiste, aquí verás el resumen completo." primary={{ href: `/seguimiento?id=${encodeURIComponent(id)}`, label: "Ver recorrido" }} />;
  }
  return <OrderDetail o={fromOrder(t.order, t.progress, now)} />;
}
