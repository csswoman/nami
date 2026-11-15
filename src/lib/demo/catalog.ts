/**
 * Catálogo de ejemplo (solo UI). Precios en centavos de USD, igual que la BD.
 * Cuando la lógica esté lista, estas formas son las que deben devolver los servicios.
 */
import type { IconName } from "@/components/nami";
import type { BrandColor, FoodImage } from "./home";
import { MORE_STORES } from "./tiendas";

export type Restaurant = {
  slug: string; name: string; image: FoodImage; initials: string; color: BrandColor;
  rating: string; time: string; feeCents: number; plusFree: boolean; tags: string[];
};

export const RESTAURANTS: Restaurant[] = [
  { slug: "arepera-dona-chela", name: "Arepera Doña Chela", image: "arepa", initials: "DC", color: "brand-orange", rating: "4,8", time: "20–30 min", feeCents: 120, plusFree: true, tags: ["arepa", "cafe", "empanada", "criolla"] },
  { slug: "empanadas-el-puerto", name: "Empanadas El Puerto", image: "empanada", initials: "EP", color: "primary", rating: "4,6", time: "15–25 min", feeCents: 90, plusFree: false, tags: ["empanada", "tequeno", "patacones", "malta", "papelon"] },
  { slug: "panaderia-la-reina", name: "Panadería La Reina", image: "pan-de-jamon", initials: "LR", color: "primary", rating: "4,7", time: "25–35 min", feeCents: 100, plusFree: true, tags: ["pan-de-jamon", "cafe", "golfeado", "catalina", "chicha"] },
  { slug: "cachapas-el-tio", name: "Cachapas El Tío", image: "cachapa", initials: "ET", color: "brand-orange", rating: "4,8", time: "20–30 min", feeCents: 110, plusFree: false, tags: ["cachapa", "arepa", "papelon", "chicha", "malta"] },
  { slug: "cocina-de-mama-rosa", name: "Cocina de Mamá Rosa", image: "pabellon", initials: "MR", color: "leaf", rating: "4,9", time: "30–40 min", feeCents: 140, plusFree: true, tags: ["criolla", "tajadas", "hallaca", "empanada", "papelon", "chicha", "cafe"] },
  { slug: "pollos-en-brasa-el-rey", name: "Pollos en Brasa El Rey", image: "pollo-en-brasa", initials: "ER", color: "brand-orange", rating: "4,7", time: "25–35 min", feeCents: 120, plusFree: false, tags: ["criolla", "tajadas", "papelon", "malta", "arepa"] },
  { slug: "tequenos-la-esquina", name: "Tequeños La Esquina", image: "tequeno", initials: "TE", color: "primary", rating: "4,6", time: "15–25 min", feeCents: 90, plusFree: false, tags: ["tequeno", "empanada", "patacones", "malta", "papelon"] },
  { slug: "parrilla-los-llanos", name: "Parrilla Los Llanos", image: "parrilla-mixta", initials: "LL", color: "leaf", rating: "4,8", time: "35–45 min", feeCents: 160, plusFree: false, tags: ["parrilla", "criolla", "patacones", "cachapa", "empanada", "arepa", "malta", "papelon"] },
  { slug: "perros-el-gocho", name: "Perros El Gocho", image: "perro", initials: "EG", color: "ink", rating: "4,7", time: "15–25 min", feeCents: 80, plusFree: true, tags: ["perro", "tequeno", "patacones", "malta", "papelon"] },
  { slug: "pepitos-la-castellana", name: "Pepitos La Castellana", image: "pepito", initials: "PC", color: "plus", rating: "4,6", time: "20–30 min", feeCents: 100, plusFree: false, tags: ["pepito", "perro", "patacones", "malta", "papelon"] },
  { slug: "hamburguesas-la-curva", name: "Hamburguesas La Curva", image: "hamburguesa", initials: "LC", color: "primary", rating: "4,5", time: "25–35 min", feeCents: 120, plusFree: true, tags: ["hamburguesa", "patacones", "malta", "papelon", "tequeno"] },
];

/**
 * Horario de los restaurantes con horario limitado, en minutos desde la medianoche de Caracas.
 * `close` puede pasar de 1440 (cierra después de medianoche). Los demás abren todo el día.
 */
export const RESTAURANT_HOURS: Record<string, { open: number; close: number; kind: string }> = {
  "pollos-en-brasa-el-rey": { open: 690, close: 1320, kind: "Pollo en brasa · Almuerzos" },
  "perros-el-gocho": { open: 1080, close: 1500, kind: "Perros calientes · Callejera" },
  "pepitos-la-castellana": { open: 1080, close: 1500, kind: "Pepitos · Callejera" },
};
function isOpenAt(slug: string, minutes: number): boolean {
  const h = RESTAURANT_HOURS[slug];
  if (!h) return true;
  return (minutes >= h.open && minutes < h.close) || (minutes + 1440 >= h.open && minutes + 1440 < h.close);
}
function opensLabel(minutes: number): string {
  const h24 = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `Abre a las ${((h24 + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h24 < 12 ? "a. m." : "p. m."}`;
}
/** Restaurantes abiertos y cerrados a una hora dada (minutos desde la medianoche). */
export function restaurantsAt(minutes: number) {
  const open = RESTAURANTS.filter((r) => isOpenAt(r.slug, minutes));
  const closed = RESTAURANTS.filter((r) => !isOpenAt(r.slug, minutes)).map((r) => ({
    name: r.name, kind: RESTAURANT_HOURS[r.slug].kind, initials: r.initials, color: r.color, opens: opensLabel(RESTAURANT_HOURS[r.slug].open % 1440),
  }));
  return { open, closed };
}
/** Filtros de comida: etiqueta → icono y nombre. Los usan el inicio y el listado. */
export const CUISINE_CHIPS: { icon: IconName; label: string; tag: string }[] = [
  { icon: "pabellon", label: "Criolla", tag: "criolla" },
  { icon: "arepa", label: "Arepas", tag: "arepa" },
  { icon: "empanada", label: "Empanadas", tag: "empanada" },
  { icon: "cachapa", label: "Cachapas", tag: "cachapa" },
  { icon: "tequeno", label: "Tequeños", tag: "tequeno" },
  { icon: "pan-de-jamon", label: "Panadería", tag: "pan-de-jamon" },
  { icon: "golfeado", label: "Golfeados", tag: "golfeado" },
  { icon: "catalina", label: "Catalinas", tag: "catalina" },
  { icon: "cafe", label: "Café", tag: "cafe" },
  { icon: "platano", label: "Tajadas", tag: "tajadas" },
  { icon: "hallaca", label: "Hallacas", tag: "hallaca" },
  { icon: "platano", label: "Patacones", tag: "patacones" },
  { icon: "pabellon", label: "Parrilla", tag: "parrilla" },
  { icon: "perro-caliente", label: "Perros", tag: "perro" },
  { icon: "hamburguesa", label: "Hamburguesas", tag: "hamburguesa" },
  { icon: "pepito", label: "Pepitos", tag: "pepito" },
  { icon: "papelon", label: "Papelón", tag: "papelon" },
  { icon: "chicha", label: "Chicha", tag: "chicha" },
  { icon: "malta", label: "Malta", tag: "malta" },
];
export const LISTING_CHIPS = CUISINE_CHIPS;
/** Etiqueta de filtro a partir del texto del chip del inicio ("Guayoyo" → "cafe"). */
const CHIP_ALIASES: Record<string, string> = { guayoyo: "cafe" };
export function chipTag(label: string): string | undefined {
  const key = label.toLowerCase();
  return CHIP_ALIASES[key] ?? CUISINE_CHIPS.find((c) => c.label.toLowerCase() === key)?.tag;
}

/* ---------- Menú de tienda ---------- */

export type MenuItem = {
  id: string; name: string; desc: string; priceCents: number; icon: IconName;
  /** Unidades que quedan (aviso "Quedan N") */
  low?: number;
  soldOut?: boolean;
  image?: string;
};
export type MenuSection = { id: string; title: string; items: MenuItem[] };

export type StoreDetail = {
  slug: string; name: string; initials: string; color: BrandColor; heroImage: FoodImage;
  kind: string; rating: string; reviews: string; time: string; feeCents: number;
  /** Horario: abierto hasta / abre mañana (ejemplo) */
  openUntil: string; opensAt: string; minOrderCents: number;
  open: boolean;
  menu: MenuSection[];
};

const CHELA_MENU: MenuSection[] = [
  { id: "arepas", title: "Arepas", items: [
    { id: "reina", name: "Reina pepiada", desc: "Pollo desmechado con aguacate y mayonesa. La de siempre.", priceCents: 350, icon: "arepa", image: "/brand/food/reina-pepiada.jpg" },
    { id: "domino", name: "Dominó", desc: "Caraotas negras y queso blanco rallado.", priceCents: 280, icon: "arepa", low: 4, image: "/brand/food/arepa-domino.jpg" },
    { id: "mechada", name: "Carne mechada", desc: "Carne mechada jugosa, hecha en casa cada mañana.", priceCents: 380, icon: "arepa", image: "/brand/food/arepa-mechada.jpg" },
    { id: "pelua", name: "Pelúa", desc: "Carne mechada con queso amarillo rallado.", priceCents: 420, icon: "arepa", soldOut: true, image: "/brand/food/arepa-pelua.jpg" },
    { id: "perico", name: "Perico", desc: "Huevos revueltos con tomate y cebolla.", priceCents: 290, icon: "arepa", image: "/brand/food/arepa-perico.jpg" },
  ] },
  { id: "empanadas", title: "Empanadas", items: [
    { id: "emp-queso", name: "Empanada de queso", desc: "Masa de maíz frita, rellena de queso blanco.", priceCents: 150, icon: "empanada", image: "/brand/food/empanada-queso.jpg" },
    { id: "emp-cazon", name: "Empanada de cazón", desc: "Al estilo oriental, con su toque de ají dulce.", priceCents: 220, icon: "empanada", low: 6, image: "/brand/food/empanada-cazon.jpg" },
  ] },
  { id: "bebidas", title: "Bebidas", items: [
    { id: "guayoyo", name: "Guayoyo", desc: "Café negro colado, suave y largo.", priceCents: 100, icon: "cafe", image: "/brand/food/cafe-guayoyo.jpg" },
    { id: "papelon", name: "Papelón con limón", desc: "Bien frío, 16 oz.", priceCents: 150, icon: "papelon", image: "/brand/food/papelon-vaso.jpg" },
    { id: "chicha", name: "Chicha", desc: "De arroz, con canela por encima.", priceCents: 180, icon: "chicha", image: "/brand/food/chicha-vaso.jpg" },
  ] },
];

const PUERTO_MENU: MenuSection[] = [
  { id: "empanadas", title: "Empanadas", items: [
    { id: "carne-mechada", name: "Carne mechada", desc: "Masa de maíz crujiente con carne mechada guisada.", priceCents: 200, icon: "empanada", image: "/brand/food/arepa-mechada.jpg" },
    { id: "pollo", name: "Pollo desmechado", desc: "Pollo guisado con pimentón y cebollín.", priceCents: 190, icon: "empanada", image: "/brand/food/empanada.jpg" },
    { id: "queso", name: "Queso blanco", desc: "Queso blanco semiduro que se estira al partirla.", priceCents: 150, icon: "empanada", image: "/brand/food/empanada-queso.jpg" },
    { id: "cazon", name: "Cazón", desc: "Cazón guisado con ají dulce, al estilo oriental.", priceCents: 240, icon: "empanada", low: 5, image: "/brand/food/empanada-cazon.jpg" },
    { id: "pabellon", name: "Pabellón", desc: "Carne, caraotas, plátano y queso rallado.", priceCents: 260, icon: "empanada", soldOut: true, image: "/brand/food/pabellon.jpg" },
  ] },
  { id: "frituras", title: "Frituras", items: [
    { id: "tequenos", name: "Tequeños (6 unidades)", desc: "Queso blanco envuelto en masa crujiente, con salsa de ajo.", priceCents: 450, icon: "tequeno", image: "/brand/food/tequeno.jpg" },
    { id: "tostones", name: "Tostones", desc: "Plátano verde frito con salsa rosada.", priceCents: 300, icon: "platano", image: "/brand/food/patacon.jpg" },
  ] },
  { id: "bebidas", title: "Bebidas", items: [
    { id: "malta", name: "Malta", desc: "Botella de 355 ml, bien fría.", priceCents: 120, icon: "malta", image: "/brand/products/malta-6.jpg" },
    { id: "papelon", name: "Papelón con limón", desc: "Bien frío, 16 oz.", priceCents: 150, icon: "papelon", image: "/brand/food/papelon-vaso.jpg" },
    { id: "guayoyo", name: "Guayoyo", desc: "Café negro colado.", priceCents: 100, icon: "cafe", image: "/brand/food/cafe-guayoyo.jpg" },
  ] },
];
const REINA_MENU: MenuSection[] = [
  { id: "panes", title: "Panes", items: [
    { id: "pan-jamon", name: "Pan de jamón", desc: "Relleno de jamón, tocineta, aceitunas y pasas. Porción de 1/4.", priceCents: 450, icon: "pan-de-jamon", image: "/brand/food/pan-de-jamon.jpg" },
    { id: "pan-jamon-entero", name: "Pan de jamón entero", desc: "Para compartir, recién horneado.", priceCents: 1600, icon: "pan-de-jamon", low: 3, image: "/brand/food/pan-de-jamon.jpg" },
    { id: "pan-canilla", name: "Pan canilla (4 unidades)", desc: "Corteza crujiente, miga suave.", priceCents: 200, icon: "pan-de-jamon", image: "/brand/food/pan-campesino.jpg" },
    { id: "pan-dulce", name: "Pan dulce", desc: "Con papelón y anís. Se acaba temprano.", priceCents: 280, icon: "pan-de-jamon", soldOut: true, image: "/brand/food/pan-sobao.jpg" },
  ] },
  { id: "dulces", title: "Dulces", items: [
    { id: "golfeado", name: "Golfeado", desc: "Pan dulce con papelón y queso de mano rallado.", priceCents: 250, icon: "golfeado", image: "/brand/food/golfeado.jpg" },
    { id: "catalina", name: "Catalina", desc: "Galleta de harina con cobertura de papelón.", priceCents: 180, icon: "catalina", image: "/brand/food/catalinas.jpg" },
    { id: "cuatro-leches", name: "Torta de cuatro leches", desc: "Porción individual.", priceCents: 380, icon: "cuatro", low: 4, image: "/brand/food/tres-leches.jpg" },
  ] },
  { id: "bebidas", title: "Bebidas", items: [
    { id: "cafe-con-leche", name: "Café con leche", desc: "Café recién colado con leche caliente.", priceCents: 140, icon: "cafe", image: "/brand/food/cafe-con-leche.jpg" },
    { id: "guayoyo", name: "Guayoyo", desc: "Café negro colado, suave y largo.", priceCents: 100, icon: "cafe", image: "/brand/food/cafe-guayoyo.jpg" },
    { id: "chicha", name: "Chicha", desc: "De arroz, con canela por encima.", priceCents: 180, icon: "chicha", image: "/brand/food/chicha-vaso.jpg" },
  ] },
];
const TIO_MENU: MenuSection[] = [
  { id: "cachapas", title: "Cachapas", items: [
    { id: "cachapa-queso", name: "Cachapa con queso de mano", desc: "Maíz tierno a la plancha con queso de mano fundido.", priceCents: 550, icon: "cachapa", image: "/brand/food/cachapa-queso.jpg" },
    { id: "cachapa-cochino", name: "Cachapa con cochino frito", desc: "Con chicharrón y queso de mano.", priceCents: 750, icon: "cachapa", low: 4, image: "/brand/food/cachapa-cochino.jpg" },
    { id: "cachapa-jamon", name: "Cachapa con jamón y queso", desc: "Jamón ahumado y queso amarillo.", priceCents: 600, icon: "cachapa", image: "/brand/food/cachapa-jamon.jpg" },
    { id: "cachapa-sola", name: "Cachapa sola", desc: "Con mantequilla, para acompañar.", priceCents: 350, icon: "cachapa", image: "/brand/food/cachapa-sola.jpg" },
    { id: "cachapa-pollo", name: "Cachapa con pollo", desc: "Pollo desmechado y queso blanco.", priceCents: 650, icon: "cachapa", soldOut: true, image: "/brand/food/cachapa-pollo.jpg" },
  ] },
  { id: "arepas", title: "Arepas", items: [
    { id: "arepa-queso", name: "Arepa con queso de mano", desc: "Asada y rellena de queso de mano.", priceCents: 300, icon: "arepa", image: "/brand/food/arepa-queso.jpg" },
    { id: "arepa-reina", name: "Reina pepiada", desc: "Pollo desmechado con aguacate y mayonesa.", priceCents: 360, icon: "arepa", image: "/brand/food/reina-pepiada.jpg" },
  ] },
  { id: "bebidas", title: "Bebidas", items: [
    { id: "papelon", name: "Papelón con limón", desc: "Bien frío, 16 oz.", priceCents: 150, icon: "papelon", image: "/brand/food/papelon-vaso.jpg" },
    { id: "chicha", name: "Chicha", desc: "De arroz, con canela por encima.", priceCents: 180, icon: "chicha", image: "/brand/food/chicha-vaso.jpg" },
    { id: "malta", name: "Malta", desc: "Botella de 355 ml, bien fría.", priceCents: 120, icon: "malta", image: "/brand/products/malta-6.jpg" },
  ] },
];
export const STORES: Record<string, StoreDetail> = {
  "arepera-dona-chela": {
    slug: "arepera-dona-chela", name: "Arepera Doña Chela", initials: "DC", color: "brand-orange", heroImage: "arepa",
    kind: "Arepas · Desayunos · Criollo · Chacao", rating: "4,8", reviews: "1,2 mil", time: "20–30 min", feeCents: 120,
    openUntil: "Hasta las 3:00 p. m.", opensAt: "Abre mañana a las 6:00 a. m.", minOrderCents: 500, open: true, menu: CHELA_MENU,
  },
  "empanadas-el-puerto": {
    slug: "empanadas-el-puerto", name: "Empanadas El Puerto", initials: "EP", color: "primary", heroImage: "empanada",
    kind: "Empanadas · Frituras · Oriental · Chacao", rating: "4,6", reviews: "640", time: "15–25 min", feeCents: 90,
    openUntil: "Hasta las 8:00 p. m.", opensAt: "Abre mañana a las 8:00 a. m.", minOrderCents: 400, open: true, menu: PUERTO_MENU,
  },
  "panaderia-la-reina": {
    slug: "panaderia-la-reina", name: "Panadería La Reina", initials: "LR", color: "primary", heroImage: "golfeado",
    kind: "Panadería · Pastelería · Café · Altamira", rating: "4,7", reviews: "930", time: "25–35 min", feeCents: 100,
    openUntil: "Hasta las 9:00 p. m.", opensAt: "Abre mañana a las 6:30 a. m.", minOrderCents: 600, open: true, menu: REINA_MENU,
  },
  "cachapas-el-tio": {
    slug: "cachapas-el-tio", name: "Cachapas El Tío", initials: "ET", color: "brand-orange", heroImage: "cachapa",
    kind: "Cachapas · Arepas · Criollo · La Castellana", rating: "4,8", reviews: "1,1 mil", time: "20–30 min", feeCents: 110,
    openUntil: "Hasta las 10:00 p. m.", opensAt: "Abre mañana a las 9:00 a. m.", minOrderCents: 700, open: true, menu: TIO_MENU,
  },
};
export function getStore(slug: string): StoreDetail | undefined {
  return STORES[slug];
}
for (const st of MORE_STORES) STORES[st.slug] = st;

/** Sugerencias del carrito ("¿Te provoca algo más?"): bebidas y fritos del propio menú de cada tienda. */
export type CartExtra = { id: string; name: string; priceCents: number; icon: IconName; image?: string };
export const EXTRAS_BY_STORE: Record<string, CartExtra[]> = Object.fromEntries(
  Object.values(STORES).map((st) => [
    st.slug,
    st.menu
      .filter((sec) => sec.id === "bebidas" || sec.id === "frituras")
      .flatMap((sec) => sec.items)
      .filter((it) => !it.soldOut)
      .slice(0, 3)
      .map((it) => ({ id: it.id, name: it.name, priceCents: it.priceCents, icon: it.icon, image: it.image })),
  ]),
);
/* ---------- Carrito de ejemplo ---------- */

export type CartLine = { id: string; name: string; qty: number; unitCents: number; icon: IconName; note?: string; image?: string };
export const DEMO_CART_STORE = "arepera-dona-chela";
export const DEMO_CART: CartLine[] = [
  { id: "reina", name: "Arepa reina pepiada", qty: 2, unitCents: 350, icon: "arepa", note: "Masa blanca · Asada en budare", image: "/brand/food/reina-pepiada.jpg" },
  { id: "guayoyo", name: "Guayoyo", qty: 1, unitCents: 100, icon: "cafe", note: "Taza grande", image: "/brand/food/cafe-guayoyo.jpg" },
];
export const DEMO_ADDRESS = {
  line: "Av. Luis Roche, Edif. Los Samanes, apto. 4B, Altamira",
  reference: "Punto de referencia: frente a la panadería La Reina",
  eta: "Llega entre 8:14 y 8:20 a. m.",
};
