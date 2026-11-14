/**
 * Datos de ejemplo del Inicio. Es solo contenido de UI: cuando la lógica/BD esté lista,
 * esta forma es la que debe devolver el servicio que alimente la página.
 */
import type { FoodIconName } from "@/components/nami";
import type { Franja } from "./franja";

export type FoodImage = "arepa" | "empanada" | "golfeado" | "pabellon" | "cachapa" | "tequeno" | "perro" | "pepito" | "hamburguesa";
export type BrandColor = "primary" | "primary-pressed" | "leaf" | "ink" | "plus" | "brand-orange";

export type OpenStore = { slug: string; name: string; image: FoodImage; initials: string; rating: string; time: string; feeCents: number; plusFree: boolean };
export type ClosedStore = { name: string; kind: string; initials: string; color: BrandColor; opens: string };

export type FranjaContent = {
  label: string;
  hora: string;
  eyebrow: string;
  title: string;
  sectionTitle: string;
  chips: { icon: FoodIconName; label: string }[];
  open: OpenStore[];
  closed: ClosedStore[];
};

export const FRANJA_CONTENT: Record<Franja, FranjaContent> = {
  desayuno: {
    label: "Desayuno", hora: "7:40 a. m.", eyebrow: "Hasta las 11:00 a. m.", title: "Desayunos criollos con envío gratis", sectionTitle: "Para desayunar cerca de ti",
    chips: [{ icon: "arepa", label: "Arepas" }, { icon: "empanada", label: "Empanadas" }, { icon: "pan-de-jamon", label: "Panadería" }, { icon: "cafe", label: "Guayoyo" }, { icon: "cachapa", label: "Cachapas" }, { icon: "tequeno", label: "Tequeños" }],
    open: [
      { slug: "arepera-dona-chela", name: "Arepera Doña Chela", image: "arepa", initials: "DC", rating: "4,8", time: "20–30 min", feeCents: 120, plusFree: true },
      { slug: "empanadas-el-puerto", name: "Empanadas El Puerto", image: "empanada", initials: "EP", rating: "4,6", time: "15–25 min", feeCents: 90, plusFree: false },
      { slug: "panaderia-la-reina", name: "Panadería La Reina", image: "golfeado", initials: "LR", rating: "4,7", time: "25–35 min", feeCents: 100, plusFree: true },
    ],
    closed: [
      { name: "Pollos en Brasa El Rey", kind: "Pollo en brasa · Almuerzos", initials: "ER", color: "brand-orange", opens: "Abre a las 11:30 a. m." },
      { name: "Perros El Gocho", kind: "Perros calientes · Callejera", initials: "EG", color: "ink", opens: "Abre a las 6:00 p. m." },
    ],
  },
  almuerzo: {
    label: "Almuerzo", hora: "12:45 p. m.", eyebrow: "De 11:30 a. m. a 3:00 p. m.", title: "Menú del día desde $ 4,50", sectionTitle: "Para almorzar",
    chips: [{ icon: "pabellon", label: "Criolla" }, { icon: "platano", label: "Tajadas" }, { icon: "empanada", label: "Empanadas" }, { icon: "hallaca", label: "Hallacas" }, { icon: "papelon", label: "Papelón" }, { icon: "arepa", label: "Arepas" }],
    open: [
      { slug: "cocina-de-mama-rosa", name: "Cocina de Mamá Rosa", image: "pabellon", initials: "MR", rating: "4,9", time: "30–40 min", feeCents: 140, plusFree: true },
      { slug: "pollos-en-brasa-el-rey", name: "Pollos en Brasa El Rey", image: "pabellon", initials: "ER", rating: "4,7", time: "25–35 min", feeCents: 120, plusFree: false },
      { slug: "arepera-dona-chela", name: "Arepera Doña Chela", image: "arepa", initials: "DC", rating: "4,8", time: "20–30 min", feeCents: 120, plusFree: true },
    ],
    closed: [
      { name: "Cachapas El Tío", kind: "Cachapas · Meriendas", initials: "ET", color: "brand-orange", opens: "Abre a las 3:00 p. m." },
      { name: "Perros El Gocho", kind: "Perros calientes · Callejera", initials: "EG", color: "ink", opens: "Abre a las 6:00 p. m." },
    ],
  },
  merienda: {
    label: "Merienda", hora: "4:20 p. m.", eyebrow: "De 3:00 a 6:00 p. m.", title: "Tequeños y golfeados 2x1", sectionTitle: "Para merendar",
    chips: [{ icon: "golfeado", label: "Golfeados" }, { icon: "tequeno", label: "Tequeños" }, { icon: "cachapa", label: "Cachapas" }, { icon: "catalina", label: "Catalinas" }, { icon: "chicha", label: "Chicha" }, { icon: "cafe", label: "Café" }],
    open: [
      { slug: "cachapas-el-tio", name: "Cachapas El Tío", image: "cachapa", initials: "ET", rating: "4,8", time: "20–30 min", feeCents: 110, plusFree: true },
      { slug: "tequenos-la-esquina", name: "Tequeños La Esquina", image: "tequeno", initials: "TE", rating: "4,6", time: "15–25 min", feeCents: 90, plusFree: false },
      { slug: "panaderia-la-reina", name: "Panadería La Reina", image: "golfeado", initials: "LR", rating: "4,7", time: "25–35 min", feeCents: 100, plusFree: true },
    ],
    closed: [
      { name: "Parrilla Los Llanos", kind: "Parrillas · Cenas", initials: "LL", color: "leaf", opens: "Abre a las 6:00 p. m." },
      { name: "Perros El Gocho", kind: "Perros calientes · Callejera", initials: "EG", color: "ink", opens: "Abre a las 6:00 p. m." },
    ],
  },
  cena: {
    label: "Cena", hora: "7:30 p. m.", eyebrow: "Después de las 6:00 p. m.", title: "Parrillas para compartir", sectionTitle: "Para cenar",
    chips: [{ icon: "pabellon", label: "Parrilla" }, { icon: "arepa", label: "Arepas" }, { icon: "cachapa", label: "Cachapas" }, { icon: "empanada", label: "Empanadas" }, { icon: "platano", label: "Patacones" }, { icon: "malta", label: "Malta" }],
    open: [
      { slug: "parrilla-los-llanos", name: "Parrilla Los Llanos", image: "pabellon", initials: "LL", rating: "4,8", time: "35–45 min", feeCents: 160, plusFree: false },
      { slug: "cachapas-el-tio", name: "Cachapas El Tío", image: "cachapa", initials: "ET", rating: "4,8", time: "20–30 min", feeCents: 110, plusFree: true },
      { slug: "perros-el-gocho", name: "Perros El Gocho", image: "perro", initials: "EG", rating: "4,7", time: "15–25 min", feeCents: 80, plusFree: true },
    ],
    closed: [
      { name: "Arepera Doña Chela", kind: "Arepas · Desayunos", initials: "DC", color: "brand-orange", opens: "Abre a las 6:00 a. m." },
      { name: "Cocina de Mamá Rosa", kind: "Criolla · Menú del día", initials: "MR", color: "leaf", opens: "Abre a las 11:30 a. m." },
    ],
  },
  noche: {
    label: "Noche", hora: "10:30 p. m.", eyebrow: "Carritos abiertos hasta la 1:00 a. m.", title: "Perros con todo, a tu puerta", sectionTitle: "Comida callejera",
    chips: [{ icon: "perro-caliente", label: "Perros" }, { icon: "hamburguesa", label: "Hamburguesas" }, { icon: "pepito", label: "Pepitos" }, { icon: "platano", label: "Patacones" }, { icon: "tequeno", label: "Tequeños" }, { icon: "arepa", label: "Arepas" }],
    open: [
      { slug: "perros-el-gocho", name: "Perros El Gocho", image: "perro", initials: "EG", rating: "4,7", time: "15–25 min", feeCents: 80, plusFree: true },
      { slug: "pepitos-la-castellana", name: "Pepitos La Castellana", image: "pepito", initials: "PC", rating: "4,6", time: "20–30 min", feeCents: 100, plusFree: false },
      { slug: "hamburguesas-la-curva", name: "Hamburguesas La Curva", image: "hamburguesa", initials: "LC", rating: "4,5", time: "25–35 min", feeCents: 120, plusFree: true },
    ],
    closed: [
      { name: "Arepera Doña Chela", kind: "Arepas · Desayunos", initials: "DC", color: "brand-orange", opens: "Abre a las 6:00 a. m." },
      { name: "Cocina de Mamá Rosa", kind: "Criolla · Menú del día", initials: "MR", color: "leaf", opens: "Abre a las 11:30 a. m." },
    ],
  },
};

export const VERTICALS = [
  { title: "Restaurantes", icon: "utensils", tone: "red" },
  { title: "Súper", icon: "basket", tone: "green" },
  { title: "Farmacias", icon: "pill", tone: "blue" },
  { title: "Bodegones", icon: "malta", tone: "ink" },
  { title: "Panaderías", icon: "pan-de-jamon", tone: "red" },
  { title: "Tiendas", icon: "bag", tone: "ink" },
] as const satisfies readonly { title: string; icon: FoodIconName | "utensils" | "basket" | "pill" | "bag"; tone: string }[];

export const TRUSTED_MARKETS: { slug: string; name: string; initials: string; color?: BrandColor; featured?: boolean }[] = [
  { slug: "nami-market", name: "Ñami Market", initials: "Ñ", featured: true },
  { slug: "abasto-el-saman", name: "Abasto El Samán", initials: "AS", color: "leaf" },
  { slug: "bodegon-la-candelaria", name: "Bodegón La Candelaria", initials: "BC", color: "ink" },
  { slug: "farmacia-san-onofre", name: "Farmacia San Onofre", initials: "FS", color: "plus" },
  { slug: "automercado-avila", name: "Automercado Ávila", initials: "AA", color: "primary-pressed" },
  { slug: "farmacia-los-proceres", name: "Farmacia Los Próceres", initials: "FP", color: "leaf" },
  { slug: "tuti", name: "Tuti", initials: "T", color: "brand-orange" },
];
/** Bs. por dólar de demostración (manual). */
export const DEMO_RATE = 36.6;
