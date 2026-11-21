"use client";
import { useEffect } from "react";
import { create } from "zustand";
import { advanceOrderAction, cancelOrderAction, confirmOrderAction, restartOrderAction } from "@/app/seguimiento/actions";
import { useCartStore, type Order } from "@/lib/cart/store";
import { inspect } from "@/lib/inspector";

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

/** Para «Bajo el capó»: qué cambió en el pedido desde la consulta anterior (estado, quién lo atiende, montos). */
function reportChange(prev: Order | undefined, next: Order) {
  if (!prev) return;
  const who = (o: Order) => (o.hold == null ? "el reloj del pedido" : o.hold >= 2 ? "el repartidor de la demo" : "la tienda, desde su panel");
  const changes: string[] = [];
  if (prev.status !== next.status) changes.push(`estado: ${prev.status} → ${next.status}`);
  if ((prev.hold ?? null) !== (next.hold ?? null)) changes.push(`lo controla ahora ${who(next)}${next.hold != null ? ` (detenido en la etapa ${next.hold})` : ""}`);
  if (prev.totalCents !== next.totalCents) changes.push(`total recalculado en el servidor: ${prev.totalCents} → ${next.totalCents} centavos`);
  if ((prev.changes?.length ?? 0) !== (next.changes?.length ?? 0)) changes.push("la tienda cambió el pedido");
  if (!changes.length) return;
  inspect({ kind: "domain", title: `Pedido ${next.code ?? next.id}: cambió en el servidor`, detail: changes.join(" · "), tone: next.status === "cancelled" ? "warn" : "info", data: { status: next.status, hold: next.hold ?? null, stageAt: next.stageAt, totalCents: next.totalCents } });
}

async function fetchOrder(id: string) {
  const { put, settle, drop, orders } = useRemoteOrders.getState();
  try {
    const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, { cache: "no-store" });
    if (res.ok) {
      const next = (await res.json()).order as Order;
      reportChange(orders[id], next);
      put(next);
    }
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
    /** Cancela con un motivo. Devuelve el error para mostrarlo, o null si salió bien. Solo pedidos del servidor. */
    cancel: async (id: string, reason: string): Promise<string | null> => {
      const r = await cancelOrderAction(id, reason);
      if (r.ok) put(r.order);
      return r.ok ? null : r.error.message;
    },
    confirm: (id: string) => (isRemoteId(id) ? remote(confirmOrderAction, id) : (local().confirmDelivered(id), Promise.resolve(true))),
  };
}
