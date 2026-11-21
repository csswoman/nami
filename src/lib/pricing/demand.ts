/**
 * Demanda del modo demo: el visitante elige si en Caracas está despejado, lloviendo o en hora pico.
 * Con lluvia u hora pico el envío lleva un recargo fijo y el motorizado tarda más. Funciones puras (cliente y servidor).
 * El servidor lee la elección de una cookie y recalcula el recargo él mismo: el cliente nunca manda el monto.
 */
export const DEMANDS = ["normal", "lluvia", "pico"] as const;
export type Demand = (typeof DEMANDS)[number];
export const DEMAND_COOKIE = "nami_demanda";

export type DemandInfo = {
  /** Recargo por pedido, en centavos. */
  surchargeCents: number;
  /** Cuánto se alarga el viaje del motorizado (1 = igual). */
  rideFactor: number;
  /** Nombre corto para el selector. */
  label: string;
  /** Línea del resumen del pedido. */
  line: string | null;
  /** Aviso para el cliente. */
  notice: string | null;
};

export const DEMAND_INFO: Record<Demand, DemandInfo> = {
  normal: { surchargeCents: 0, rideFactor: 1, label: "Despejado", line: null, notice: null },
  lluvia: { surchargeCents: 75, rideFactor: 1.6, label: "Lluvia", line: "Tarifa por lluvia", notice: "Está lloviendo en Caracas: los envíos tardan un poco más y llevan un recargo." },
  pico: { surchargeCents: 50, rideFactor: 1.3, label: "Hora pico", line: "Tarifa por alta demanda", notice: "Hay muchos pedidos ahora: los envíos llevan un pequeño recargo." },
};

export const isDemand = (v: unknown): v is Demand => typeof v === "string" && (DEMANDS as readonly string[]).includes(v);
/** Demanda guardada en la cookie; cualquier otro valor es "normal". */
export const demandOf = (cookie: string | undefined | null): Demand => (isDemand(cookie) ? cookie : "normal");
/** Recargo de un pedido. Los pedidos solo de recogida no existen en la demo: siempre hay envío. */
export const surchargeFor = (demand: Demand): number => DEMAND_INFO[demand].surchargeCents;
