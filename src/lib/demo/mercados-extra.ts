/** Más mercados de ejemplo (súper, bodegón, farmacia, tiendas y frutería). Se suman a MARKETS. Montos en centavos de USD. */
import type { Market } from "./mercado";
const SOLD = "Agotado · Vuelve mañana a las 7:00 a. m.";
const P = (id: string) => `/brand/products/${id}.jpg`;
export const MORE_MARKETS: Record<string, Market> = {
  "supermercado-la-granja": {
    vertical: 1, slug: "supermercado-la-granja", name: "Supermercado La Granja", initials: "LG", color: "leaf", kind: "Supermercado", area: "Los Chaguaramos",
    hours: "Hasta las 9:00 p. m.", time: "25–35 min", feeCents: 95, minOrderCents: 500, back: { href: "/listado?v=1", label: "Súper" },
    categories: ["Despensa", "Frescos", "Lácteos", "Bebidas"],
    sections: [
      { id: "despensa", title: "Despensa", products: [
        { id: "harina-pan", name: "Harina de maíz precocida 1 kg", unit: "1 kg", priceCents: 122, oldPriceCents: 140, stock: 18, image: P("harina-pan") },
        { id: "arroz", name: "Arroz blanco 1 kg", unit: "1 kg", priceCents: 132, image: P("arroz") },
        { id: "pasta", name: "Pasta corta 500 g", unit: "500 g", priceCents: 95, image: P("pasta-b") },
        { id: "lentejas", name: "Lentejas 500 g", unit: "500 g", priceCents: 138, image: P("lentejas") },
        { id: "atun", name: "Atún en aceite 140 g", unit: "140 g", priceCents: 205, soldOut: SOLD, image: P("atun") },
      ] },
      { id: "frescos", title: "Frescos", products: [
        { id: "huevos", name: "Huevos de gallina, cartón x30", unit: "30 unidades", priceCents: 780, stock: 9, image: P("huevos") },
        { id: "cebolla", name: "Cebolla 1 kg", unit: "1 kg", priceCents: 150, image: P("cebolla") },
        { id: "tomate", name: "Tomate 1 kg", unit: "1 kg", priceCents: 180, image: P("tomate") },
        { id: "papa", name: "Papa 1 kg", unit: "1 kg", priceCents: 160, oldPriceCents: 190, image: P("papa") },
      ] },
      { id: "lacteos", title: "Lácteos", products: [
        { id: "leche", name: "Leche completa 1 l", unit: "1 l", priceCents: 185, image: P("leche") },
        { id: "yogurt", name: "Yogurt natural 1 l", unit: "1 l", priceCents: 260, stock: 6, image: P("yogurt") },
        { id: "mantequilla", name: "Mantequilla con sal 250 g", unit: "250 g", priceCents: 235, image: P("mantequilla") },
      ] },
      { id: "bebidas", title: "Bebidas", products: [
        { id: "agua", name: "Agua mineral 5 l", unit: "5 l", priceCents: 155, image: P("agua") },
        { id: "refresco", name: "Refresco de cola 2 l", unit: "2 l", priceCents: 230, image: P("refresco") },
        { id: "cerveza-lata", name: "Cerveza en lata x6", unit: "6 latas", priceCents: 640, image: P("cerveza-lata") },
      ] },
    ],
  },
  "bodegon-las-mercedes": {
    vertical: 3, slug: "bodegon-las-mercedes", name: "Bodegón Las Mercedes", initials: "BM", color: "plus", kind: "Bodegón", area: "Las Mercedes",
    hours: "Hasta las 11:00 p. m.", time: "30–40 min", feeCents: 150, minOrderCents: 800, back: { href: "/listado?v=3", label: "Bodegones" },
    categories: ["Licores y vinos", "Delicatessen", "Café y dulces"],
    sections: [
      { id: "licores", title: "Licores y vinos", products: [
        { id: "ron-reserva", name: "Ron reserva 750 ml", unit: "750 ml", priceCents: 2400, stock: 5, image: P("ron-reserva") },
        { id: "vino", name: "Vino tinto 750 ml", unit: "750 ml", priceCents: 1250, oldPriceCents: 1450, image: P("vino") },
        { id: "cerveza-lata", name: "Cerveza en lata x6", unit: "6 latas", priceCents: 720, image: P("cerveza-lata") },
      ] },
      { id: "deli", title: "Delicatessen", products: [
        { id: "queso-ahumado", name: "Queso ahumado 250 g", unit: "250 g", priceCents: 520, image: P("queso-ahumado") },
        { id: "jamon-ahumado", name: "Jamón ahumado 200 g", unit: "200 g", priceCents: 480, stock: 7, image: P("jamon-ahumado") },
        { id: "queso-brie", name: "Queso brie 200 g", unit: "200 g", priceCents: 690, soldOut: SOLD, image: P("queso-brie") },
        { id: "aceitunas", name: "Aceitunas rellenas 240 g", unit: "240 g", priceCents: 430, image: P("aceitunas") },
      ] },
      { id: "cafe", title: "Café y dulces", products: [
        { id: "cafe-molido", name: "Café molido tostado 250 g", unit: "250 g", priceCents: 490, image: P("cafe-molido") },
        { id: "chocolate", name: "Chocolate con leche 100 g", unit: "100 g", priceCents: 210, image: P("chocolate") },
        { id: "miel", name: "Miel de abeja 350 g", unit: "350 g", priceCents: 560, oldPriceCents: 640, image: P("miel") },
      ] },
    ],
  },
  "farmacia-la-salud": {
    vertical: 2, slug: "farmacia-la-salud", name: "Farmacia La Salud", initials: "FL", color: "primary", kind: "Farmacia", area: "Chacaíto",
    hours: "Abierto 24 horas", time: "20–30 min", feeCents: 90, minOrderCents: 300, back: { href: "/listado?v=2", label: "Farmacia" },
    categories: ["Medicinas", "Primeros auxilios", "Bebé", "Vitaminas"],
    sections: [
      { id: "medicinas", title: "Medicinas", products: [
        { id: "diclofenac", name: "Diclofenac 50 mg x10", unit: "10 tabletas", priceCents: 240, image: P("diclofenac") },
        { id: "loratadina", name: "Loratadina 10 mg x10", unit: "10 tabletas", priceCents: 200, image: P("loratadina") },
        { id: "omeprazol", name: "Omeprazol 20 mg x14", unit: "14 cápsulas", priceCents: 310, stock: 6, image: P("omeprazol") },
        { id: "jarabe-tos", name: "Jarabe para la tos 120 ml", unit: "120 ml", priceCents: 420, image: P("jarabe-tos") },
        { id: "antigripal", name: "Antigripal x12", unit: "12 tabletas", priceCents: 350, soldOut: SOLD, image: P("antigripal") },
      ] },
      { id: "auxilios", title: "Primeros auxilios", products: [
        { id: "curitas", name: "Curitas x20", unit: "20 unidades", priceCents: 150, image: P("curitas") },
        { id: "gasa", name: "Gasa estéril x10", unit: "10 unidades", priceCents: 180, image: P("gasa") },
        { id: "alcohol", name: "Alcohol isopropílico 250 ml", unit: "250 ml", priceCents: 210, image: P("alcohol") },
        { id: "termometro", name: "Termómetro digital", unit: "1 unidad", priceCents: 690, oldPriceCents: 800, image: P("termometro") },
      ] },
      { id: "bebe", title: "Bebé", products: [
        { id: "panales", name: "Pañales talla M x30", unit: "30 unidades", priceCents: 1450, image: P("panales") },
        { id: "formula", name: "Fórmula infantil 400 g", unit: "400 g", priceCents: 1850, stock: 4, image: P("formula") },
        { id: "toallitas", name: "Toallitas húmedas x80", unit: "80 unidades", priceCents: 320, image: P("toallitas") },
      ] },
      { id: "vitaminas", title: "Vitaminas", products: [
        { id: "vitc", name: "Vitamina C 500 mg x30", unit: "30 tabletas", priceCents: 450, image: P("vitc") },
        { id: "multi", name: "Multivitamínico x30", unit: "30 tabletas", priceCents: 780, oldPriceCents: 900, image: P("multi") },
      ] },
    ],
  },
  "ferreteria-el-tornillo": {
    vertical: 5, slug: "ferreteria-el-tornillo", name: "Ferretería El Tornillo", initials: "FT", color: "ink", kind: "Tienda", area: "Sabana Grande",
    hours: "Hasta las 6:00 p. m.", time: "35–45 min", feeCents: 130, minOrderCents: 800, back: { href: "/listado?v=5", label: "Tiendas" },
    categories: ["Herramientas", "Electricidad", "Pegamentos"],
    sections: [
      { id: "herramientas", title: "Herramientas", products: [
        { id: "martillo", name: "Martillo de uña 16 oz", unit: "1 unidad", priceCents: 850, image: P("martillo") },
        { id: "destornilladores", name: "Juego de destornilladores x6", unit: "6 piezas", priceCents: 720, oldPriceCents: 860, image: P("destornilladores") },
        { id: "cinta-metrica", name: "Cinta métrica 5 m", unit: "1 unidad", priceCents: 380, stock: 8, image: P("cinta-metrica") },
      ] },
      { id: "electricidad", title: "Electricidad", products: [
        { id: "bombillo", name: "Bombillo LED 12 W", unit: "1 unidad", priceCents: 290, image: P("bombillo") },
        { id: "pilas", name: "Pilas AA x4", unit: "4 unidades", priceCents: 430, image: P("pilas") },
        { id: "regleta", name: "Regleta de 6 tomas", unit: "1 unidad", priceCents: 950, soldOut: SOLD, image: P("regleta") },
        { id: "cinta-aislante", name: "Cinta aislante negra", unit: "1 rollo", priceCents: 180, image: P("cinta-aislante") },
      ] },
      { id: "pegamentos", title: "Pegamentos", products: [
        { id: "pega", name: "Pegamento instantáneo 3 g", unit: "1 unidad", priceCents: 150, image: P("pega") },
      ] },
    ],
  },
  "patitas-pet-shop": {
    vertical: 5, slug: "patitas-pet-shop", name: "Patitas Pet Shop", initials: "PP", color: "brand-orange", kind: "Tienda", area: "La Castellana",
    hours: "Hasta las 7:00 p. m.", time: "30–40 min", feeCents: 110, minOrderCents: 600, back: { href: "/listado?v=5", label: "Tiendas" },
    categories: ["Perros", "Gatos", "Accesorios"],
    sections: [
      { id: "perros", title: "Perros", products: [
        { id: "alimento-perro", name: "Alimento para perro adulto 2 kg", unit: "2 kg", priceCents: 1250, oldPriceCents: 1400, image: P("alimento-perro") },
        { id: "snack-perro", name: "Snacks dentales para perro x7", unit: "7 unidades", priceCents: 480, stock: 6, image: P("snack-perro") },
      ] },
      { id: "gatos", title: "Gatos", products: [
        { id: "alimento-gato", name: "Alimento para gato adulto 1,5 kg", unit: "1,5 kg", priceCents: 1150, image: P("alimento-gato") },
        { id: "arena-gato", name: "Arena sanitaria para gato 4 kg", unit: "4 kg", priceCents: 690, soldOut: SOLD, image: P("arena-gato") },
      ] },
      { id: "accesorios", title: "Accesorios", products: [
        { id: "correa-perro", name: "Correa para perro 1,2 m", unit: "1 unidad", priceCents: 520, image: P("correa-perro") },
        { id: "juguete-perro", name: "Pelota de goma para perro", unit: "1 unidad", priceCents: 280, image: P("juguete-perro") },
      ] },
    ],
  },
  "fruteria-el-mango": {
    vertical: 1, slug: "fruteria-el-mango", name: "Frutería El Mango", initials: "EM", color: "leaf", kind: "Frutería", area: "Altamira",
    hours: "Hasta las 6:00 p. m.", time: "20–30 min", feeCents: 80, minOrderCents: 300, back: { href: "/listado?v=1", label: "Súper" },
    categories: ["Frutas", "Verduras", "Jugos"],
    sections: [
      { id: "frutas", title: "Frutas", products: [
        { id: "cambur", name: "Cambur 1 kg", unit: "1 kg", priceCents: 140, image: P("cambur") },
        { id: "aguacate", name: "Aguacate 1 kg", unit: "1 kg", priceCents: 320, stock: 8, image: P("aguacate") },
        { id: "mango", name: "Mango de hilacha 1 kg", unit: "1 kg", priceCents: 260, oldPriceCents: 300, image: P("mango") },
        { id: "parchita", name: "Parchita 500 g", unit: "500 g", priceCents: 290, image: P("parchita") },
        { id: "naranja", name: "Naranja 1 kg", unit: "1 kg", priceCents: 150, soldOut: SOLD, image: P("naranja") },
      ] },
      { id: "verduras", title: "Verduras", products: [
        { id: "tomate", name: "Tomate 1 kg", unit: "1 kg", priceCents: 175, image: P("tomate") },
        { id: "cebolla", name: "Cebolla 1 kg", unit: "1 kg", priceCents: 145, image: P("cebolla") },
        { id: "papa", name: "Papa 1 kg", unit: "1 kg", priceCents: 155, image: P("papa") },
        { id: "lechuga", name: "Lechuga fresca", unit: "1 unidad", priceCents: 120, image: P("lechuga") },
        { id: "zanahoria", name: "Zanahoria 1 kg", unit: "1 kg", priceCents: 130, image: P("zanahoria") },
      ] },
      { id: "jugos", title: "Jugos", products: [
        { id: "jugo-guanabana", name: "Jugo de guanábana 1 l", unit: "1 l", priceCents: 230, image: P("jugo-guanabana") },
        { id: "jugo", name: "Jugo de naranja 1 l", unit: "1 l", priceCents: 210, image: P("jugo") },
      ] },
    ],
  },
};
