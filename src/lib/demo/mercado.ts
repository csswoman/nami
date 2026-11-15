import type { BrandColor } from "@/lib/demo/home";

/** Mercados (súper y farmacia) de ejemplo. Montos en centavos de USD. */
export type MarketProduct = {
  id: string; name: string; unit: string; priceCents: number; oldPriceCents?: number;
  image?: string; stock?: number; inCart?: number; soldOut?: string;
};
export type MarketSection = { id: string; title: string; products: MarketProduct[] };
export type Market = {
  /** Pestaña del listado: 1 Súper · 2 Farmacia · 3 Bodegones · 5 Tiendas. */
  vertical: 1 | 2 | 3 | 5;
  slug: string; name: string; initials: string; color: BrandColor; kind: string; area: string;
  hours: string; time: string; feeCents: number; minOrderCents: number; back: { href: string; label: string };
  categories: string[]; sections: MarketSection[];
};

const SOLD = "Agotado · Vuelve mañana a las 7:00 a. m.";

export const MARKETS: Record<string, Market> = {
  "abasto-el-saman": {
    vertical: 1, slug: "abasto-el-saman", name: "Abasto El Samán", initials: "AS", color: "leaf", kind: "Abasto", area: "Los Palos Grandes",
    hours: "Abierto todo el día", time: "25–35 min", feeCents: 100, minOrderCents: 500, back: { href: "/listado?v=1", label: "Súper" },
    categories: ["Víveres", "Charcutería y lácteos", "Frutas y verduras", "Panadería", "Bebidas", "Limpieza"],
    sections: [
      { id: "viveres", title: "Víveres", products: [
        { id: "harina", name: "Harina de maíz precocida 1 kg", unit: "1 kg", priceCents: 115, oldPriceCents: 135, stock: 12, inCart: 2, image: "/brand/products/harina-pan.jpg" },
        { id: "arroz", name: "Arroz blanco tipo I 1 kg", unit: "1 kg", priceCents: 130, image: "/brand/products/arroz.jpg" },
        { id: "caraotas", name: "Caraotas negras 500 g", unit: "500 g", priceCents: 110, soldOut: SOLD, image: "/brand/products/caraotas.jpg" },
        { id: "pasta", name: "Pasta larga 1 kg", unit: "1 kg", priceCents: 160, image: "/brand/products/pasta.jpg" },
        { id: "aceite", name: "Aceite vegetal 1 l", unit: "1 l", priceCents: 320, oldPriceCents: 360, stock: 3, image: "/brand/products/aceite.jpg" },
        { id: "azucar", name: "Azúcar refinada 1 kg", unit: "1 kg", priceCents: 125, image: "/brand/products/azucar.jpg" },
      ] },
      { id: "lacteos", title: "Charcutería y lácteos", products: [
        { id: "queso", name: "Queso blanco llanero 500 g", unit: "500 g", priceCents: 390, inCart: 1, image: "/brand/products/queso.jpg" },
        { id: "mantequilla", name: "Mantequilla con sal 250 g", unit: "250 g", priceCents: 240, stock: 8, image: "/brand/products/mantequilla.jpg" },
        { id: "jamon", name: "Jamón de pierna 250 g", unit: "250 g", priceCents: 310, soldOut: SOLD, image: "/brand/products/jamon.jpg" },
        { id: "leche", name: "Leche completa 1 l", unit: "1 l", priceCents: 190, image: "/brand/products/leche.jpg" },
      ] },
    ],
  },
  "farmacia-san-onofre": {
    vertical: 2, slug: "farmacia-san-onofre", name: "Farmacia San Onofre", initials: "FS", color: "plus", kind: "Farmacia", area: "Chacao",
    hours: "Abierto 24 horas", time: "20–30 min", feeCents: 90, minOrderCents: 300, back: { href: "/listado?v=2", label: "Farmacia" },
    categories: ["Medicinas", "Cuidado personal", "Bebé"],
    sections: [
      { id: "medicinas", title: "Medicinas", products: [
        { id: "aceta", name: "Acetaminofén 500 mg x20", unit: "20 tabletas", priceCents: 180, oldPriceCents: 220 },
        { id: "ibu", name: "Ibuprofeno 400 mg x10", unit: "10 tabletas", priceCents: 210, image: "/brand/products/ibu.jpg" },
        { id: "suero", name: "Suero oral sabor limón", unit: "500 ml", priceCents: 250, stock: 5, image: "/brand/products/suero.jpg" },
      ] },
      { id: "cuidado", title: "Cuidado personal", products: [
        { id: "solar", name: "Protector solar FPS 50", unit: "120 ml", priceCents: 890, oldPriceCents: 1100 },
        { id: "jabon", name: "Jabón de tocador x3", unit: "3 unidades", priceCents: 195, image: "/brand/products/jabon.jpg" },
      ] },
    ],
  },
  "nami-market": {
    vertical: 1, slug: "nami-market", name: "Ñami Market", initials: "Ñ", color: "primary", kind: "Supermercado", area: "Chacao",
    hours: "Abierto todo el día", time: "20–30 min", feeCents: 90, minOrderCents: 600, back: { href: "/listado?v=1", label: "Súper" },
    categories: ["Despensa", "Carnes y pollo", "Snacks y dulces", "Bebidas"],
    sections: [
      { id: "despensa", title: "Despensa", products: [
        { id: "harina-pan", name: "Harina de maíz blanco 1 kg", unit: "1 kg", priceCents: 120, stock: 20, image: "/brand/products/harina-pan.jpg" },
        { id: "lentejas", name: "Lentejas 500 g", unit: "500 g", priceCents: 140, image: "/brand/products/lentejas.jpg" },
        { id: "atun", name: "Atún en aceite 140 g", unit: "140 g", priceCents: 210, oldPriceCents: 250, image: "/brand/products/atun.jpg" },
        { id: "salsa", name: "Salsa de tomate 397 g", unit: "397 g", priceCents: 175, soldOut: SOLD, image: "/brand/products/salsa.jpg" },
      ] },
      { id: "carnes", title: "Carnes y pollo", products: [
        { id: "pollo-entero", name: "Pollo entero fresco", unit: "~1,8 kg", priceCents: 780, stock: 6, image: "/brand/products/pollo-entero.jpg" },
        { id: "molida", name: "Carne molida de res 500 g", unit: "500 g", priceCents: 540, image: "/brand/products/molida.jpg" },
        { id: "chuleta", name: "Chuleta de cerdo 500 g", unit: "500 g", priceCents: 490, oldPriceCents: 560, image: "/brand/products/chuleta.jpg" },
      ] },
      { id: "snacks", title: "Snacks y dulces", products: [
        { id: "platanitos", name: "Platanitos fritos 100 g", unit: "100 g", priceCents: 150 },
        { id: "galletas", name: "Galletas de coco 6 paquetes", unit: "6 paquetes", priceCents: 230, image: "/brand/products/galletas.jpg" },
        { id: "chocolate", name: "Chocolate con leche 100 g", unit: "100 g", priceCents: 190, stock: 4, image: "/brand/products/chocolate.jpg" },
      ] },
      { id: "bebidas", title: "Bebidas", products: [
        { id: "agua", name: "Agua mineral 5 l", unit: "5 l", priceCents: 160 },
        { id: "jugo", name: "Jugo de naranja 1 l", unit: "1 l", priceCents: 210, image: "/brand/products/jugo.jpg" },
        { id: "malta-6", name: "Malta x6", unit: "6 botellas", priceCents: 520, oldPriceCents: 600, image: "/brand/products/malta-6.jpg" },
      ] },
    ],
  },
  "automercado-avila": {
    vertical: 1, slug: "automercado-avila", name: "Automercado Ávila", initials: "AA", color: "primary-pressed", kind: "Supermercado", area: "Altamira",
    hours: "Hasta las 9:00 p. m.", time: "30–40 min", feeCents: 140, minOrderCents: 1000, back: { href: "/listado?v=1", label: "Súper" },
    categories: ["Frutas y verduras", "Charcutería", "Congelados", "Hogar"],
    sections: [
      { id: "frutas", title: "Frutas y verduras", products: [
        { id: "cambur", name: "Cambur maduro 1 kg", unit: "1 kg", priceCents: 150 },
        { id: "tomate", name: "Tomate perita 1 kg", unit: "1 kg", priceCents: 210, stock: 9, image: "/brand/products/tomate.jpg" },
        { id: "aguacate", name: "Aguacate 2 unidades", unit: "2 unidades", priceCents: 280, oldPriceCents: 330, image: "/brand/products/aguacate.jpg" },
        { id: "papa", name: "Papa 1 kg", unit: "1 kg", priceCents: 170, soldOut: SOLD, image: "/brand/products/papa.jpg" },
      ] },
      { id: "charcuteria", title: "Charcutería", products: [
        { id: "jamon-ahumado", name: "Jamón ahumado 200 g", unit: "200 g", priceCents: 360 },
        { id: "queso-amarillo", name: "Queso amarillo en lonjas 200 g", unit: "200 g", priceCents: 330, image: "/brand/products/queso-amarillo.jpg" },
        { id: "salchicha", name: "Salchichas de pollo x10", unit: "10 unidades", priceCents: 290, image: "/brand/products/salchicha.jpg" },
      ] },
      { id: "congelados", title: "Congelados", products: [
        { id: "hamburguesas", name: "Hamburguesas de res x4", unit: "4 unidades", priceCents: 640, oldPriceCents: 720 },
        { id: "helado", name: "Helado de vainilla 1 l", unit: "1 l", priceCents: 450, stock: 5, image: "/brand/products/helado.jpg" },
      ] },
      { id: "hogar", title: "Hogar", products: [
        { id: "papel", name: "Papel higiénico x4", unit: "4 rollos", priceCents: 320 },
        { id: "detergente", name: "Detergente líquido 1 l", unit: "1 l", priceCents: 480, image: "/brand/products/detergente.jpg" },
      ] },
    ],
  },
  "bodegon-la-candelaria": {
    vertical: 3, slug: "bodegon-la-candelaria", name: "Bodegón La Candelaria", initials: "BC", color: "ink", kind: "Bodegón", area: "La Candelaria",
    hours: "Abierto todo el día", time: "20–30 min", feeCents: 120, minOrderCents: 400, back: { href: "/listado?v=3", label: "Bodegones" },
    categories: ["Licores y vinos", "Delicatessen", "Café y desayuno"],
    sections: [
      { id: "licores", title: "Licores y vinos", products: [
        { id: "ron", name: "Ron añejo 750 ml", unit: "750 ml", priceCents: 1450, stock: 6 },
        { id: "vino", name: "Vino tinto 750 ml", unit: "750 ml", priceCents: 1190, oldPriceCents: 1350, image: "/brand/products/vino.jpg" },
        { id: "cerveza", name: "Cerveza lager x6", unit: "6 botellas", priceCents: 780, image: "/brand/products/cerveza.jpg" },
      ] },
      { id: "deli", title: "Delicatessen", products: [
        { id: "aceitunas", name: "Aceitunas rellenas 240 g", unit: "240 g", priceCents: 420 },
        { id: "queso-crema", name: "Queso crema 250 g", unit: "250 g", priceCents: 310, soldOut: SOLD, image: "/brand/products/queso-crema.jpg" },
        { id: "pate", name: "Paté de jamón 150 g", unit: "150 g", priceCents: 260, image: "/brand/products/pate.jpg" },
      ] },
      { id: "cafe", title: "Café y desayuno", products: [
        { id: "cafe-molido", name: "Café molido tostado 250 g", unit: "250 g", priceCents: 480 },
        { id: "miel", name: "Miel de abeja 350 g", unit: "350 g", priceCents: 550, oldPriceCents: 620, image: "/brand/products/miel.jpg" },
        { id: "avena", name: "Avena en hojuelas 400 g", unit: "400 g", priceCents: 210, stock: 7, image: "/brand/products/avena.jpg" },
      ] },
    ],
  },
  "farmacia-los-proceres": {
    vertical: 2, slug: "farmacia-los-proceres", name: "Farmacia Los Próceres", initials: "FP", color: "leaf", kind: "Farmacia", area: "Los Próceres",
    hours: "Abierto todo el día", time: "25–35 min", feeCents: 100, minOrderCents: 300, back: { href: "/listado?v=2", label: "Farmacia" },
    categories: ["Medicinas", "Vitaminas", "Higiene"],
    sections: [
      { id: "medicinas", title: "Medicinas", products: [
        { id: "loratadina", name: "Loratadina 10 mg x10", unit: "10 tabletas", priceCents: 230 },
        { id: "omeprazol", name: "Omeprazol 20 mg x14", unit: "14 cápsulas", priceCents: 320, stock: 6, image: "/brand/products/omeprazol.jpg" },
        { id: "diclofenac", name: "Diclofenac gel 50 g", unit: "50 g", priceCents: 380, oldPriceCents: 430, image: "/brand/products/diclofenac.jpg" },
      ] },
      { id: "vitaminas", title: "Vitaminas", products: [
        { id: "vitc", name: "Vitamina C 500 mg x30", unit: "30 tabletas", priceCents: 560 },
        { id: "multi", name: "Multivitamínico x60", unit: "60 tabletas", priceCents: 1190, oldPriceCents: 1400, image: "/brand/products/multi.jpg" },
      ] },
      { id: "higiene", title: "Higiene", products: [
        { id: "alcohol", name: "Alcohol antiséptico 250 ml", unit: "250 ml", priceCents: 190 },
        { id: "crema-dental", name: "Crema dental 100 ml", unit: "100 ml", priceCents: 240, soldOut: SOLD, image: "/brand/products/crema-dental.jpg" },
        { id: "mascarillas", name: "Mascarillas desechables x20", unit: "20 unidades", priceCents: 350, image: "/brand/products/mascarillas.jpg" },
      ] },
    ],
  },
  "farmacia-el-avila": {
    vertical: 2, slug: "farmacia-el-avila", name: "Farmacia El Ávila", initials: "FA", color: "ink", kind: "Farmacia", area: "Altamira",
    hours: "Hasta las 10:00 p. m.", time: "30–40 min", feeCents: 120, minOrderCents: 400, back: { href: "/listado?v=2", label: "Farmacia" },
    categories: ["Primeros auxilios", "Bebé", "Cuidado de la piel"],
    sections: [
      { id: "auxilios", title: "Primeros auxilios", products: [
        { id: "curitas", name: "Curitas surtidas x30", unit: "30 unidades", priceCents: 210 },
        { id: "gasa", name: "Gasa estéril x10", unit: "10 sobres", priceCents: 260, image: "/brand/products/gasa.jpg" },
        { id: "termometro", name: "Termómetro digital", unit: "1 unidad", priceCents: 690, stock: 4, image: "/brand/products/termometro.jpg" },
      ] },
      { id: "bebe", title: "Bebé", products: [
        { id: "panales", name: "Pañales talla M x30", unit: "30 unidades", priceCents: 1250, oldPriceCents: 1450 },
        { id: "toallitas", name: "Toallitas húmedas x80", unit: "80 unidades", priceCents: 430, image: "/brand/products/toallitas.jpg" },
        { id: "formula", name: "Fórmula infantil 400 g", unit: "400 g", priceCents: 1650, soldOut: SOLD, image: "/brand/products/formula.jpg" },
      ] },
      { id: "piel", title: "Cuidado de la piel", products: [
        { id: "hidratante", name: "Crema hidratante 200 ml", unit: "200 ml", priceCents: 520 },
        { id: "labial", name: "Protector labial FPS 15", unit: "1 unidad", priceCents: 180, stock: 8, image: "/brand/products/labial.jpg" },
      ] },
    ],
  },
  "bodegon-los-chaguaramos": {
    vertical: 3, slug: "bodegon-los-chaguaramos", name: "Bodegón Los Chaguaramos", initials: "BL", color: "leaf", kind: "Bodegón", area: "Los Chaguaramos",
    hours: "Hasta las 11:00 p. m.", time: "25–35 min", feeCents: 110, minOrderCents: 500, back: { href: "/listado?v=3", label: "Bodegones" },
    categories: ["Picoteo", "Bebidas", "Despensa"],
    sections: [
      { id: "picoteo", title: "Picoteo", products: [
        { id: "mani", name: "Maní salado 200 g", unit: "200 g", priceCents: 190 },
        { id: "chicharron", name: "Chicharrón de cerdo 150 g", unit: "150 g", priceCents: 320, stock: 6, image: "/brand/products/chicharron.jpg" },
        { id: "queso-ahumado", name: "Queso ahumado 250 g", unit: "250 g", priceCents: 440, oldPriceCents: 500, image: "/brand/products/queso-ahumado.jpg" },
        { id: "tostones-bolsa", name: "Tostones congelados 500 g", unit: "500 g", priceCents: 360, soldOut: SOLD, image: "/brand/products/tostones-bolsa.jpg" },
      ] },
      { id: "bebidas", title: "Bebidas", products: [
        { id: "cerveza-lata", name: "Cerveza lata x12", unit: "12 latas", priceCents: 1380 },
        { id: "refresco", name: "Refresco de cola 2 l", unit: "2 l", priceCents: 230, image: "/brand/products/refresco.jpg" },
        { id: "ron-reserva", name: "Ron reserva 750 ml", unit: "750 ml", priceCents: 1890, oldPriceCents: 2100, stock: 3, image: "/brand/products/ron-reserva.jpg" },
      ] },
      { id: "despensa", title: "Despensa", products: [
        { id: "arroz-b", name: "Arroz blanco 1 kg", unit: "1 kg", priceCents: 135, image: "/brand/products/arroz.jpg" },
        { id: "pasta-b", name: "Pasta corta 500 g", unit: "500 g", priceCents: 95, image: "/brand/products/pasta-b.jpg" },
        { id: "salsa-ajo", name: "Salsa de ajo 250 ml", unit: "250 ml", priceCents: 180, image: "/brand/products/salsa-ajo.jpg" },
      ] },
    ],
  },
  "todo-hogar-chacao": {
    vertical: 5, slug: "todo-hogar-chacao", name: "Todo Hogar Chacao", initials: "TH", color: "ink", kind: "Tienda", area: "Chacao",
    hours: "Hasta las 7:00 p. m.", time: "30–40 min", feeCents: 130, minOrderCents: 800, back: { href: "/listado?v=5", label: "Tiendas" },
    categories: ["Cocina", "Limpieza", "Electrónica básica"],
    sections: [
      { id: "cocina", title: "Cocina", products: [
        { id: "budare", name: "Budare de hierro 30 cm", unit: "1 unidad", priceCents: 1450, stock: 4 },
        { id: "olla", name: "Olla de aluminio 4 l", unit: "1 unidad", priceCents: 1800, oldPriceCents: 2100, image: "/brand/products/olla.jpg" },
        { id: "cuchillos", name: "Juego de cuchillos x3", unit: "3 piezas", priceCents: 990, image: "/brand/products/cuchillos.jpg" },
        { id: "colador", name: "Colador de café de tela", unit: "1 unidad", priceCents: 350, soldOut: SOLD, image: "/brand/products/colador.jpg" },
      ] },
      { id: "limpieza", title: "Limpieza", products: [
        { id: "escoba", name: "Escoba con mango", unit: "1 unidad", priceCents: 520 },
        { id: "cloro", name: "Cloro 1 l", unit: "1 l", priceCents: 160, image: "/brand/products/cloro.jpg" },
        { id: "esponjas", name: "Esponjas x4", unit: "4 unidades", priceCents: 190, image: "/brand/products/esponjas.jpg" },
      ] },
      { id: "electro", title: "Electrónica básica", products: [
        { id: "bombillo", name: "Bombillo LED 12 W", unit: "1 unidad", priceCents: 290 },
        { id: "regleta", name: "Regleta de 6 tomas", unit: "1 unidad", priceCents: 950, oldPriceCents: 1100, image: "/brand/products/regleta.jpg" },
        { id: "pilas", name: "Pilas AA x4", unit: "4 unidades", priceCents: 430, stock: 7, image: "/brand/products/pilas.jpg" },
      ] },
    ],
  },
  "papeleria-el-estudiante": {
    vertical: 5, slug: "papeleria-el-estudiante", name: "Papelería El Estudiante", initials: "PE", color: "primary", kind: "Tienda", area: "Los Palos Grandes",
    hours: "Hasta las 6:00 p. m.", time: "25–35 min", feeCents: 100, minOrderCents: 300, back: { href: "/listado?v=5", label: "Tiendas" },
    categories: ["Escolar", "Oficina", "Manualidades"],
    sections: [
      { id: "escolar", title: "Escolar", products: [
        { id: "cuaderno", name: "Cuaderno universitario 100 hojas", unit: "1 unidad", priceCents: 240 },
        { id: "lapices", name: "Lápices de grafito x12", unit: "12 unidades", priceCents: 280, oldPriceCents: 330 },
        { id: "mochila", name: "Mochila escolar", unit: "1 unidad", priceCents: 1650, stock: 5 },
      ] },
      { id: "oficina", title: "Oficina", products: [
        { id: "resma", name: "Resma de papel carta 500 hojas", unit: "500 hojas", priceCents: 690 },
        { id: "boligrafos", name: "Bolígrafos azules x10", unit: "10 unidades", priceCents: 310 },
        { id: "carpeta", name: "Carpeta con gancho x5", unit: "5 unidades", priceCents: 420, soldOut: SOLD },
      ] },
      { id: "manualidades", title: "Manualidades", products: [
        { id: "colores", name: "Colores de madera x24", unit: "24 unidades", priceCents: 520 },
        { id: "pega", name: "Pega blanca 250 ml", unit: "250 ml", priceCents: 180 },
        { id: "cartulina", name: "Cartulinas surtidas x10", unit: "10 unidades", priceCents: 260, stock: 9 },
      ] },
    ],
  },
  "tuti": {
    vertical: 1, slug: "tuti", name: "Tuti", initials: "T", color: "brand-orange", kind: "Abasto", area: "Chacao",
    hours: "Hasta las 10:00 p. m.", time: "15–25 min", feeCents: 80, minOrderCents: 300, back: { href: "/listado?v=1", label: "Súper" },
    categories: ["Víveres", "Chucherías", "Dulces criollos", "Bebidas"],
    sections: [
      { id: "viveres", title: "Víveres", products: [
        { id: "harina-pan", name: "Harina de maíz precocida 1 kg", unit: "1 kg", priceCents: 118, oldPriceCents: 135, stock: 24, image: "/brand/products/harina-pan.jpg" },
        { id: "arroz", name: "Arroz blanco 1 kg", unit: "1 kg", priceCents: 128, image: "/brand/products/arroz.jpg" },
        { id: "caraotas", name: "Caraotas negras 500 g", unit: "500 g", priceCents: 105, image: "/brand/products/caraotas.jpg" },
        { id: "pasta", name: "Pasta larga 500 g", unit: "500 g", priceCents: 90, image: "/brand/products/pasta.jpg" },
        { id: "aceite", name: "Aceite vegetal 900 ml", unit: "900 ml", priceCents: 290, oldPriceCents: 330, image: "/brand/products/aceite.jpg" },
        { id: "queso-blanco", name: "Queso blanco duro 500 g", unit: "500 g", priceCents: 380, soldOut: SOLD, image: "/brand/products/queso.jpg" },
      ] },
      { id: "chucherias", title: "Chucherías", products: [
        { id: "cocosette", name: "Cocosette (paquete)", unit: "1 paquete", priceCents: 120, stock: 15 },
        { id: "pirulin", name: "Pirulín (tubo)", unit: "1 unidad", priceCents: 90, image: "/brand/products/pirulin.jpg" },
        { id: "susy", name: "Susy de chocolate x6", unit: "6 unidades", priceCents: 240, oldPriceCents: 280, image: "/brand/products/susy.jpg" },
        { id: "cheese-tris", name: "Cheese Tris 150 g", unit: "150 g", priceCents: 160, image: "/brand/products/cheese-tris.jpg" },
        { id: "platanitos", name: "Platanitos fritos 100 g", unit: "100 g", priceCents: 140, image: "/brand/products/platanitos.jpg" },
        { id: "pepitos-snack", name: "Pepitos (snack) 90 g", unit: "90 g", priceCents: 130, stock: 8, image: "/brand/products/pepitos-snack.jpg" },
        { id: "chicle", name: "Chicles surtidos x10", unit: "10 unidades", priceCents: 100, image: "/brand/products/chicle.jpg" },
      ] },
      { id: "dulces", title: "Dulces criollos", products: [
        { id: "papelon", name: "Papelón en panela 500 g", unit: "500 g", priceCents: 170 },
        { id: "bocadillo", name: "Bocadillo de guayaba", unit: "1 unidad", priceCents: 150, image: "/brand/products/bocadillo.jpg" },
        { id: "dulce-leche", name: "Dulce de leche cortada 250 g", unit: "250 g", priceCents: 280, stock: 5, image: "/brand/products/dulce-leche.jpg" },
        { id: "conserva-coco", name: "Conserva de coco 200 g", unit: "200 g", priceCents: 260, oldPriceCents: 300, image: "/brand/products/conserva-coco.jpg" },
        { id: "quesillo", name: "Quesillo individual", unit: "1 porción", priceCents: 250, soldOut: SOLD, image: "/brand/products/quesillo.jpg" },
      ] },
      { id: "bebidas", title: "Bebidas", products: [
        { id: "maltin", name: "Maltín 355 ml", unit: "1 botella", priceCents: 110 },
        { id: "toddy", name: "Chocolate en polvo 400 g", unit: "400 g", priceCents: 420, oldPriceCents: 480, image: "/brand/products/toddy.jpg" },
        { id: "chicha-lista", name: "Chicha lista para beber 1 l", unit: "1 l", priceCents: 240, image: "/brand/products/chicha-lista.jpg" },
        { id: "jugo-guanabana", name: "Jugo de guanábana 1 l", unit: "1 l", priceCents: 230, image: "/brand/products/jugo-guanabana.jpg" },
      ] },
    ],
  },
};

/** Promociones de un mercado: primero lo rebajado, luego lo que queda poco y después el resto (sin agotados). */
export function promosOf(slug: string, max = 5): MarketProduct[] {
  const m = MARKETS[slug];
  if (!m) return [];
  const all = m.sections.flatMap((sec) => sec.products).filter((p) => !p.soldOut);
  const rank = (p: MarketProduct) => (p.oldPriceCents ? 0 : p.stock ? 1 : 2);
  return [...all].sort((a, b) => rank(a) - rank(b)).slice(0, max);
}
