/**
 * Recorrido simulado de un pedido: etapas, horas reales o estimadas y cuánto falta.
 * Funciones puras (sin estado) para que las usen el seguimiento, "Mis pedidos" y el detalle.
 */

export const STAGE_COUNT = 5;

export type Courier = { name: string; initials: string; vehicle: string; plate: string; rating: string };

const COURIERS: Courier[] = [
  { name: "Carlos Mendoza", initials: "CM", vehicle: "Moto negra", plate: "AB2C34D", rating: "4,9" },
  { name: "Yusmary Pérez", initials: "YP", vehicle: "Moto azul", plate: "AD4K09M", rating: "4,8" },
  { name: "Luis Ramírez", initials: "LR", vehicle: "Moto roja", plate: "AC8F21K", rating: "4,9" },
];

export const pickCourier = (n: number): Courier => COURIERS[Math.abs(n) % COURIERS.length];

/** Un motorizado por tienda cuando el pedido va en envíos separados; uno solo si pasa por todas. */
export function couriersOf(o: { stops: unknown[]; delivery: "separate" | "combined"; courier: Courier }): Courier[] {
  if (o.delivery !== "separate" || o.stops.length < 2) return [o.courier];
  const start = Math.max(0, COURIERS.findIndex((c) => c.plate === o.courier.plate));
  return o.stops.map((_, i) => (i === 0 ? o.courier : COURIERS[(start + i) % COURIERS.length]));
}

type StoreLike = { kind: "restaurante" | "mercado"; name: string };

/**
 * Minutos desde que haces el pedido hasta cada etapa. Es una demo: todo el recorrido dura ~2 min reales
 * y el motorizado se mueve en el mapa durante ~50 s (menos de 1 min). Varias tiendas suman paradas.
 */
export function planFor(stores: StoreLike[], delivery: "separate" | "combined"): number[] {
  const extra = stores.length > 1 && delivery === "combined" ? stores.length - 1 : 0;
  const ride = 0.85 + extra * 0.15;
  const go = 0.9 + extra * 0.1; // sale la moto
  return [0, 0.2, 0.5, go, go + ride];
}

type Trackable = {
  status: "active" | "delivered" | "cancelled";
  plan: number[];
  startAt: number;
  stageAt: (number | null)[];
  deliveredAt: number | null;
  /** Etapa máxima mientras una tienda atiende el pedido desde su panel; ausente o null = avanza solo por tiempo. */
  hold?: number | null;
};

const at = (o: Trackable, i: number) => o.startAt + o.plan[i] * 60_000;

/** Etapa alcanzada (0–4) a la hora `now`. */
export function reachedStage(o: Trackable, now: number): number {
  if (o.status === "delivered") return STAGE_COUNT - 1;
  let s = 0;
  for (let i = 0; i < STAGE_COUNT; i++) if (o.stageAt[i] != null || at(o, i) <= now) s = i;
  return o.hold != null ? Math.min(s, o.hold) : s;
}

/** Después de este tiempo con el pedido en la puerta lo damos por entregado aunque no lo confirmes. */
const AUTO_DELIVER_MS = 30 * 60_000;

export type Progress = {
  stage: number;
  /** Hora de cada etapa: real si ya pasó, estimada si no. */
  times: number[];
  reached: boolean[];
  /** Hora estimada (o real) de llegada. */
  etaAt: number;
  minsLeft: number;
  /** El motorizado ya está en tu puerta. */
  arrived: boolean;
  /** Ya terminó: confirmado o llegó hace rato. Va a "Anteriores". */
  finished: boolean;
};

export function progressOf(o: Trackable, now: number): Progress {
  const stage = reachedStage(o, now);
  const times = o.plan.map((_, i) => o.stageAt[i] ?? at(o, i));
  // Si una etapa llegó antes de lo previsto, las siguientes no pueden quedar antes que ella.
  for (let i = 1; i < times.length; i++) times[i] = Math.max(times[i], times[i - 1]);
  // Con la tienda al mando, las etapas que faltan empiezan a contar desde ahora, no desde el plan original.
  if (o.hold != null) {
    const lag = Math.max(0, now - at(o, o.hold + 1));
    for (let i = o.hold + 1; i < times.length; i++) if (o.stageAt[i] == null) times[i] += lag;
  }
  const etaAt = o.deliveredAt ?? times[STAGE_COUNT - 1];
  const arrived = stage === STAGE_COUNT - 1;
  return {
    stage,
    times,
    reached: times.map((_, i) => i <= stage),
    etaAt,
    minsLeft: arrived ? 0 : Math.max(1, Math.ceil((etaAt - now) / 60_000)),
    arrived,
    finished: o.status !== "active" || (arrived && now - etaAt > AUTO_DELIVER_MS),
  };
}

type StopLike = { store: StoreLike };

/** Nombres de las etapas según el tipo de pedido (comida, mercado, varias tiendas). */
export function stageLabels(stops: StopLike[]): string[] {
  const multi = stops.length > 1;
  const market = stops.every((s) => s.store.kind === "mercado");
  return [
    "Recibido",
    multi ? `Preparando en ${stops.length} tiendas` : market ? "Armando tu compra" : "Preparando",
    "Buscando motorizado",
    multi ? "Recogiendo y en camino" : "En camino",
    "Llegó",
  ];
}

/** Título y texto grande de cada etapa en el seguimiento. */
export function stageHeadline(stage: number, stops: StopLike[], courier: Courier): [string, string] {
  const first = courier.name.split(" ")[0];
  const names = stops.map((s) => s.store.name).join(" y ");
  const market = stops.every((s) => s.store.kind === "mercado");
  switch (stage) {
    case 0: return ["Recibimos tu pedido", `${names} lo está revisando.`];
    case 1: return [market ? "Armando tu compra" : "Preparando tu pedido", stops.length > 1 ? `${names} ya están trabajando en tu pedido.` : `${names} ya está trabajando en tu pedido.`];
    case 2: return ["Buscando motorizado", "Estamos asignando a alguien cerca de la tienda."];
    case 3: return ["Tu pedido va en camino", stops.length > 1 ? `${first} pasa por ${stops.length} tiendas y sigue hacia tu casa.` : `${first} va hacia tu casa.`];
    default: return ["¡Llegó tu pedido!", `Sal a recibirlo: ${first} te espera en la puerta.`];
  }
}

const TZ_OPTS = { hour: "numeric", minute: "2-digit", hour12: true } as const;

/** "3:42 p. m." */
export function formatClock(ts: number): string {
  return new Date(ts).toLocaleTimeString("es-VE", TZ_OPTS).replace(/\s+/g, " ").replace(/\.$/, ".");
}

/** "Hoy, 3:42 p. m." · "Ayer, 10:42 p. m." · "28 sep., 7:52 a. m." */
export function formatWhen(ts: number, now: number): string {
  const d = new Date(ts);
  const today = new Date(now);
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(today) - startOf(d)) / 86_400_000);
  const clock = formatClock(ts);
  if (days === 0) return `Hoy, ${clock}`;
  if (days === 1) return `Ayer, ${clock}`;
  return `${d.toLocaleDateString("es-VE", { day: "numeric", month: "short" })}, ${clock}`;
}

/** Minutos entre dos horas, redondeado y nunca negativo. */
export const minutesBetween = (a: number, b: number) => Math.max(0, Math.round((b - a) / 60_000));
/** Cuándo empieza un pedido programado: "hoy a las 6:00 p. m." · "mañana a las 10:00 a. m." · "9 ene., 10:00 a. m.". */
export function formatSchedule(ts: number, now: number): string {
  const startOf = (ms: number) => { const x = new Date(ms); return new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime(); };
  const ahead = Math.round((startOf(ts) - startOf(now)) / 86_400_000);
  if (ahead === 0) return `hoy a las ${formatClock(ts)}`;
  if (ahead === 1) return `mañana a las ${formatClock(ts)}`;
  return `${new Date(ts).toLocaleDateString("es-VE", { day: "numeric", month: "short" })}, ${formatClock(ts)}`;
}
