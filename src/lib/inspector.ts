"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * «Bajo el capó»: registro de lo que pasa por detrás mientras alguien usa la demo (peticiones a la API,
 * Server Actions, recálculos del servidor, cambios de estado). Es estado de cliente y vive solo en esta pestaña.
 * Para quien revisa el proyecto sin leer el código: hace visible el backend.
 */
export type InspectTone = "ok" | "info" | "warn" | "error";
export type InspectEvent = {
  id: number;
  at: number;
  /** http = petición a /api · action = Server Action · domain = algo que decidió el servidor. */
  kind: "http" | "action" | "domain";
  title: string;
  detail?: string;
  tone: InspectTone;
  data?: unknown;
  /** De qué lado vino, en la pantalla dividida ("Cliente", "Tienda", "Repartidor"). */
  source?: string;
  /** Eventos seguidos con la misma clave se juntan en uno (el polling no llena la lista). */
  mergeKey?: string;
  count?: number;
};
export type NewInspectEvent = Omit<InspectEvent, "id" | "at" | "count"> & { at?: number };
const MAX = 80;
export const INSPECTOR_KEY = "nami_capo";
/** Mensaje con el que un iframe de la pantalla dividida le pasa sus eventos a la página de afuera. */
export const INSPECTOR_MESSAGE = "nami:capo-event";

type State = {
  enabled: boolean;
  open: boolean;
  events: InspectEvent[];
  setEnabled: (on: boolean) => void;
  setOpen: (open: boolean) => void;
  push: (e: NewInspectEvent) => void;
  clear: () => void;
};
let seq = 0;
export const readInspectorEnabled = () => {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(INSPECTOR_KEY) === "1";
  } catch {
    return false;
  }
};
export const useInspector = create<State>()(
  persist(
    (set) => ({
  enabled: false,
  open: false,
  events: [],
  setEnabled: (on) => {
    try {
      if (on) window.localStorage.setItem(INSPECTOR_KEY, "1");
      else window.localStorage.removeItem(INSPECTOR_KEY);
    } catch {}
    set({ enabled: on, open: on });
  },
  setOpen: (open) => set({ open }),
  push: (e) =>
    set((s) => {
      const at = e.at ?? Date.now();
      const top = s.events[0];
      if (e.mergeKey && top?.mergeKey === e.mergeKey && top.source === e.source) {
        return { events: [{ ...top, ...e, at, id: top.id, count: (top.count ?? 1) + 1 }, ...s.events.slice(1)] };
      }
      return { events: [{ ...e, id: ++seq, at, count: 1 }, ...s.events].slice(0, MAX) };
    }),
  clear: () => set({ events: [] }),
    }),
    {
      // Los eventos sobreviven a una recarga dentro de la misma pestaña (sessionStorage), no más.
      name: "nami_capo_eventos",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ events: s.events }),
      onRehydrateStorage: () => (state) => {
        seq = Math.max(seq, ...(state?.events ?? []).map((e) => e.id), 0);
      },
    },
  ),
);
/** Registra un evento si el inspector está activo; si no, no hace nada (y no cuesta nada). */
export function inspect(e: NewInspectEvent): void {
  const s = useInspector.getState();
  if (s.enabled) s.push(e);
}

/** Qué significa cada llamada, para quien no conoce el código. */
export function explainRequest(method: string, path: string, status: number): string | undefined {
  if (status === 429) return "Límite por IP guardado en Postgres (INSERT … ON CONFLICT). Responde 429 con Retry-After.";
  if (status === 409) return "La máquina de estados rechazó la transición: no corresponde al estado actual.";
  if (/^\/api\/orders\/[^/]+$/.test(path)) return "Seguimiento por polling (cada 4 s). Antes de responder, el servidor pone al día el pedido en una transacción según la hora y quién lo atiende.";
  if (path === "/api/orders" && method === "POST") return "Crear pedido: valida con Zod y recalcula precios en el servidor.";
  if (/\/api\/tienda-admin\/[^/]+\/orders$/.test(path)) return "Bandeja del panel. Consultarla marca la tienda como atendida: ella toma el control de sus pedidos.";
  if (/\/api\/tienda-admin\/[^/]+\/stops\/[^/]+\/items\//.test(path)) return "«No hay»: aplica la sustitución que pidió el cliente y recalcula los totales.";
  if (/\/api\/tienda-admin\/[^/]+\/stops\//.test(path)) return "Acción sobre la parada de esta tienda (máquina de estados por parada).";
  if (/\/api\/tienda-admin\/[^/]+\/simulate$/.test(path)) return "Pedido de prueba creado por el servidor con el mismo flujo que un cliente real.";
  if (/\/api\/tienda-admin\/[^/]+\/metrics$/.test(path)) return "Ventas y liquidación agregadas en SQL.";
  if (/\/api\/tienda-admin\//.test(path)) return "Cambio en el catálogo compartido: vuelve solo al seed a los 15 minutos.";
  if (path === "/api/repartidor") return "App del repartidor: consultarla lo marca conectado y los pedidos listos lo esperan.";
  if (path.startsWith("/api/repartidor/")) return "Acción del repartidor: tomar, recoger o llegar. Mueve el pedido del cliente.";
  if (path === "/api/search") return "Búsqueda tolerante a errores de tipeo con pg_trgm.";
  return undefined;
}
