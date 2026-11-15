/**
 * Tipos y funciones puras del catálogo (sin acceso a la BD, sirven en servidor y cliente).
 * Las consultas viven en src/server/catalog.ts.
 */
import type { IconName } from "@/components/nami";
import type { BrandColor } from "@/lib/demo/home";

/** Un turno de un día: `day` 0 = lunes … 6 = domingo; minutos desde la medianoche, `closesAt` puede pasar de 1440. */
export type DayHours = { day: number; opensAt: number; closesAt: number };
export type StoreSummary = {
  id: string;
  slug: string;
  name: string;
  kind: "restaurante" | "mercado";
  category: "comida" | "mercado" | "farmacia" | "tienda";
  /** Tipo de comercio ("Arepas · Desayunos · Chacao", "Abasto"). */
  description: string;
  area: string | null;
  imageUrl: string | null;
  initials: string;
  color: BrandColor;
  /** "4,8" (coma decimal) o null si no tiene calificación. */
  rating: string | null;
  reviews: string | null;
  /** "20–30 min" */
  time: string;
  feeCents: number;
  minOrderCents: number;
  plusFree: boolean;
  /** Interruptor manual de la tienda (independiente del horario). */
  isOpen: boolean;
  /** Horario semanal (hora de Caracas). Un día sin turnos está cerrado. */
  schedule: DayHours[];
  tags: string[];
  verticals: number[];
};

export type CatalogProduct = {
  /** Slug estable dentro de la tienda. */
  id: string;
  name: string;
  description: string;
  unit: string | null;
  priceCents: number;
  oldPriceCents: number | null;
  image: string | null;
  icon: IconName | null;
  /** Unidades que quedan (aviso "Quedan N"). */
  stock: number | null;
  soldOut: boolean;
  /** ISO; cuándo vuelve a haber. */
  soldOutUntil: string | null;
  hasOptions: boolean;
};

export type CatalogSection = { id: string; title: string; products: CatalogProduct[] };
export type StoreDetail = StoreSummary & { sections: CatalogSection[] };

export type OptionGroup = {
  id: string;
  title: string;
  hint: string;
  kind: "one" | "many";
  required: boolean;
  max?: number;
  options: { id: string; label: string; priceCents: number }[];
  defaults: string[];
};

export type ProductDetail = {
  store: StoreSummary;
  sectionId: string;
  product: CatalogProduct;
  groups: OptionGroup[];
};

export type SearchResults = {
  stores: StoreSummary[];
  products: (CatalogProduct & { store: Pick<StoreSummary, "slug" | "name" | "kind"> })[];
};

/** Forma que esperan las tarjetas de producto de mercado (`soldOut` ya viene como texto). */
export function marketCard(p: CatalogProduct, now: number = Date.now()) {
  return {
    id: p.id, name: p.name, unit: p.unit ?? "", priceCents: p.priceCents, oldPriceCents: p.oldPriceCents ?? undefined,
    image: p.image ?? undefined, stock: p.stock ?? undefined, soldOut: p.soldOut ? soldOutLabel(p.soldOutUntil, now) : undefined,
  };
}

/** Pestañas del listado (`?v=`): el índice es el valor de `StoreSummary.verticals`. */
export const LISTING_TABS = ["Restaurantes", "Súper", "Farmacia", "Bodegones", "Panaderías", "Tiendas"] as const;

/** Minutos desde la medianoche en Caracas (UTC-4). */
export function caracasMinutes(now: number = Date.now()): number {
  const d = new Date(now - 4 * 3_600_000);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

type Hours = Pick<StoreSummary, "schedule">;
/** Día de la semana en Caracas (UTC-4): 0 = lunes … 6 = domingo. */
export function caracasWeekday(now: number = Date.now()): number {
  return (new Date(now - 4 * 3_600_000).getUTCDay() + 6) % 7;
}
const DAY_NAMES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
/** Turno que cubre ese día y hora (incluye el que empezó el día anterior y pasa de medianoche). */
function coveringShift(s: Hours, minutes: number, day: number): { shift: DayHours; closesToday: number } | null {
  for (const h of s.schedule) {
    if (h.day === day && minutes >= h.opensAt && minutes < h.closesAt) return { shift: h, closesToday: h.closesAt };
    if (h.day === (day + 6) % 7 && minutes + 1440 < h.closesAt) return { shift: h, closesToday: h.closesAt - 1440 };
  }
  return null;
}
/** Abierto a esa hora y día según el horario semanal. */
export function isOpenAt(s: Hours, minutes: number, day: number = caracasWeekday()): boolean {
  return coveringShift(s, minutes, day) !== null;
}
/** Próxima apertura después de ese momento: días por delante (0 = hoy) y minutos del día; null si nunca abre. */
export function nextOpening(s: Hours, minutes: number, day: number = caracasWeekday()): { daysAhead: number; minutes: number } | null {
  for (let ahead = 0; ahead <= 7; ahead++) {
    const d = (day + ahead) % 7;
    const starts = s.schedule.filter((h) => h.day === d && (ahead > 0 || h.opensAt > minutes)).map((h) => h.opensAt % 1440);
    if (starts.length) return { daysAhead: ahead, minutes: Math.min(...starts) };
  }
  return null;
}
/** 900 → "3:00 p. m." */
export function clockLabel(minutes: number): string {
  const h24 = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${((h24 + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h24 < 12 ? "a. m." : "p. m."}`;
}

/** Texto del horario: "Abierto 24 horas", "Hasta las 3:00 p. m." o "Cerrado" si ahora no atiende. */
export function hoursText(s: Hours, minutes: number = caracasMinutes(), day: number = caracasWeekday()): string {
  const cover = coveringShift(s, minutes, day);
  if (!cover) return "Cerrado";
  const always = s.schedule.length >= 7 && s.schedule.every((h) => h.opensAt === 0 && h.closesAt === 1440);
  if (always) return "Abierto 24 horas";
  const close = cover.closesToday % 1440;
  return `Hasta ${Math.floor(close / 60) === 1 ? "la" : "las"} ${clockLabel(close)}`;
}
/** "Abre a las 6:00 p. m." hoy, "Abre mañana a las…" o "Abre el lunes a las…". */
export function opensText(s: Hours, nowMinutes: number, day: number = caracasWeekday()): string {
  const next = nextOpening(s, nowMinutes, day);
  if (!next) return "Sin horario";
  const when = next.daysAhead === 0 ? "" : next.daysAhead === 1 ? "mañana " : `el ${DAY_NAMES[(day + next.daysAhead) % 7]} `;
  return `Abre ${when}a las ${clockLabel(next.minutes)}`;
}
/** "Agotado · Vuelve mañana a las 7:00 a. m."; sin fecha futura, solo "Agotado". */
export function soldOutLabel(until: string | null, now: number = Date.now()): string {
  if (!until) return "Agotado";
  const t = new Date(until).getTime();
  if (t <= now) return "Agotado";
  const day = (ms: number) => Math.floor((ms - 4 * 3_600_000) / 86_400_000);
  const gap = day(t) - day(now);
  const when = gap <= 0 ? "hoy" : gap === 1 ? "mañana" : `en ${gap} días`;
  return `Agotado · Vuelve ${when} a las ${clockLabel(caracasMinutes(t))}`;
}

/** Próxima apertura (ms). Hora de Caracas (UTC-4). Sin horario: mañana a medianoche. */
export function nextOpeningAt(s: Hours, now: number = Date.now()): number {
  const dayStart = Math.floor((now - 4 * 3_600_000) / 86_400_000) * 86_400_000 + 4 * 3_600_000;
  const next = nextOpening(s, caracasMinutes(now), caracasWeekday(now));
  if (!next) return dayStart + 86_400_000;
  return dayStart + next.daysAhead * 86_400_000 + next.minutes * 60_000;
}
/** Sugerencia del carrito ("¿Te provoca algo más?"). */
export type CartExtra = { id: string; name: string; priceCents: number; icon: IconName; image?: string };
