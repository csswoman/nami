"use client";
import { useEffect } from "react";
import { create } from "zustand";
import { advanceOrderAction, confirmOrderAction, restartOrderAction } from "@/app/seguimiento/actions";
import { useCartStore, type Order } from "@/lib/cart/store";

/**
 * Pedidos guardados en el servidor: el contenido vive en la BD y aquí solo hay una copia para pintar.
 * El navegador guarda los ids (zustand `orderIds`); esta copia se refresca con GET /api/orders/[id].
 */
type RemoteState = {
  orders: Record<string, Order>;
  /** Ids ya consultados al menos una vez (con éxito o no), para no dejar la pantalla cargando. */
  settled: Record<string, true>;
  put: (o: Order) => void;
  settle: (id: string) => void;
  drop: (id: string) => void;
};
export const useRemoteOrders = create<RemoteState>((set) => ({
  orders: {},
  settled: {},
  put: (o) => set((s) => ({ orders: { ...s.orders, [o.id]: o }, settled: { ...s.settled, [o.id]: true } })),
  settle: (id) => set((s) => ({ settled: { ...s.settled, [id]: true } })),
  drop: (id) => set((s) => {
    const orders = { ...s.orders };
    delete orders[id];
    return { orders, settled: { ...s.settled, [id]: true } };
  }),
}));

/** Los pedidos locales llevan ids "ÑM-2101"; los del servidor, uuid. */
export const isRemoteId = (id: string) => !id.startsWith("ÑM-");

async function fetchOrder(id: string) {
  const { put, settle, drop } = useRemoteOrders.getState();
  try {
    const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, { cache: "no-store" });
    if (res.ok) put((await res.json()).order as Order);
    else if (res.status === 404) drop(id);
    else settle(id);
  } catch {
    settle(id);
  }
}

let wanted: string[] = [];
let subscribers = 0;
let timer: ReturnType<typeof setInterval> | undefined;
const tick = () => {
  if (typeof document !== "undefined" && document.hidden) return;
  void Promise.all(wanted.map(fetchOrder));
};

/** Consulta los pedidos cada `intervalMs` mientras haya una pantalla que los use (un solo temporizador compartido). */
export function useRemoteOrdersSync(ids: string[], intervalMs = 4000) {
  const key = ids.join(",");
  useEffect(() => {
    wanted = key ? key.split(",") : [];
    tick();
  }, [key]);
  useEffect(() => {
    if (subscribers++ === 0) timer = setInterval(tick, intervalMs);
    return () => {
      if (--subscribers === 0) clearInterval(timer);
    };
  }, [intervalMs]);
}

/** Demo y confirmación: van al servidor si el pedido es suyo, o al estado local si es un pedido local. */
export function useOrderActions() {
  const put = useRemoteOrders((s) => s.put);
  const local = useCartStore.getState;
  const remote = async (act: (id: string) => ReturnType<typeof advanceOrderAction>, id: string) => {
    const r = await act(id);
    if (r.ok) put(r.order);
    return r.ok;
  };
  return {
    advance: (id: string) => (isRemoteId(id) ? remote(advanceOrderAction, id) : (local().advanceOrder(id), Promise.resolve(true))),
    restart: (id: string) => (isRemoteId(id) ? remote(restartOrderAction, id) : (local().restartOrder(id), Promise.resolve(true))),
    confirm: (id: string) => (isRemoteId(id) ? remote(confirmOrderAction, id) : (local().confirmDelivered(id), Promise.resolve(true))),
  };
}
