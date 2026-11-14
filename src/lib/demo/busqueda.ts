import type { IconName } from "@/components/nami";
import type { BrandColor } from "@/lib/demo/home";

/** Índice de búsqueda de ejemplo. La lógica real consultará la BD. Montos en centavos de USD. */
export type SearchStore = {
  slug: string; name: string; initials: string; color: BrandColor; meta: string;
  open: boolean; status: string; keywords: string[];
};
export type SearchProduct = {
  id: string; name: string; store: string; storeSlug: string; icon: IconName; priceCents: number;
  soldOut?: string; keywords: string[];
};

export const RECENT_SEARCHES = ["Arepa", "Tequeños", "Harina de maíz", "Perro con todo"];
export const SUGGESTIONS = ["Arepa", "Tequeños", "Cachapa"];

export const SEARCH_STORES: SearchStore[] = [
  { slug: "arepera-dona-chela", name: "Arepera Doña Chela", initials: "DC", color: "brand-orange", meta: "Arepas · Desayunos · 20–30 min", open: true, status: "Abierto · Hasta las 3:00 p. m.", keywords: ["arepa", "arepera", "desayuno", "cafe", "guayoyo"] },
  { slug: "arepera-la-pelota", name: "Arepera La Pelota", initials: "LP", color: "primary", meta: "Arepas · Chacaíto · 25–35 min", open: false, status: "Cerrado · Abre a las 6:00 p. m.", keywords: ["arepa", "arepera"] },
  { slug: "empanadas-el-puerto", name: "Empanadas El Puerto", initials: "EP", color: "primary", meta: "Empanadas · 15–25 min", open: true, status: "Abierto · Hasta las 9:00 p. m.", keywords: ["empanada", "cazon"] },
  { slug: "cachapas-el-tio", name: "Cachapas El Tío", initials: "ET", color: "brand-orange", meta: "Cachapas · Arepas · 20–30 min", open: true, status: "Abierto · Hasta las 8:00 p. m.", keywords: ["cachapa", "queso de mano"] },
  { slug: "tequenos-la-esquina", name: "Tequeños La Esquina", initials: "TE", color: "primary", meta: "Tequeños · 15–25 min", open: true, status: "Abierto · Hasta las 10:00 p. m.", keywords: ["tequeno", "tequeños", "golfeado"] },
  { slug: "abasto-el-saman", name: "Abasto El Samán", initials: "AS", color: "leaf", meta: "Abasto · 25–35 min", open: true, status: "Abierto todo el día", keywords: ["harina", "abasto", "mercado", "arroz", "aceite"] },
  { slug: "farmacia-san-onofre", name: "Farmacia San Onofre", initials: "FS", color: "plus", meta: "Farmacia · 20–30 min", open: true, status: "Abierto 24 horas", keywords: ["farmacia", "acetaminofen", "medicina"] },
];

export const SEARCH_PRODUCTS: SearchProduct[] = [
  { id: "reina", name: "Arepa reina pepiada", store: "Arepera Doña Chela", storeSlug: "arepera-dona-chela", icon: "arepa", priceCents: 350, keywords: ["arepa", "reina", "pollo"] },
  { id: "domino", name: "Arepa dominó", store: "Arepera Doña Chela", storeSlug: "arepera-dona-chela", icon: "arepa", priceCents: 280, keywords: ["arepa", "domino", "caraotas"] },
  { id: "pelua", name: "Arepa pelúa", store: "Arepera Doña Chela", storeSlug: "arepera-dona-chela", icon: "arepa", priceCents: 420, soldOut: "Agotado · Vuelve mañana a las 7:00 a. m.", keywords: ["arepa", "pelua", "carne"] },
  { id: "tequenos", name: "Tequeños x12", store: "Tequeños La Esquina", storeSlug: "tequenos-la-esquina", icon: "tequeno", priceCents: 480, keywords: ["tequeno", "tequeños", "queso"] },
  { id: "cachapa", name: "Cachapa con queso de mano", store: "Cachapas El Tío", storeSlug: "cachapas-el-tio", icon: "cachapa", priceCents: 520, keywords: ["cachapa", "queso"] },
  { id: "empanada", name: "Empanada de queso", store: "Empanadas El Puerto", storeSlug: "empanadas-el-puerto", icon: "empanada", priceCents: 150, keywords: ["empanada", "queso"] },
  { id: "harina", name: "Harina de maíz precocida 1 kg", store: "Abasto El Samán", storeSlug: "abasto-el-saman", icon: "basket" as IconName, priceCents: 115, keywords: ["harina", "maiz"] },
];

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Búsqueda ingenua por nombre y palabras clave (sin tildes, sin mayúsculas). */
export function search(q: string) {
  const n = norm(q);
  if (!n) return { stores: [] as SearchStore[], products: [] as SearchProduct[] };
  const hit = (name: string, kw: string[]) => norm(name).includes(n) || kw.some((k) => norm(k).includes(n));
  return {
    stores: SEARCH_STORES.filter((s) => hit(s.name, s.keywords)),
    products: SEARCH_PRODUCTS.filter((p) => hit(p.name, p.keywords)),
  };
}
