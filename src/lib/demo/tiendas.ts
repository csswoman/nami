/** Más tiendas de ejemplo (restaurantes de las franjas del inicio y panaderías). Montos en centavos de USD. */
import type { IconName } from "@/components/nami";
import type { MenuItem, MenuSection, StoreDetail } from "./catalog";
import type { BrandColor, FoodImage } from "./home";

type Extra = Pick<MenuItem, "low" | "soldOut" | "image">;

const DISH_IMAGE_MAP: Record<string, string> = {
  "asado-negro": "/brand/food/asado-negro.jpg",
  "pabellon": "/brand/food/pabellon.jpg",
  "pollo-guisado": "/brand/food/pollo-guisado.jpg",
  "pescado-frito": "/brand/food/pescado-frito.jpg",
  "tajadas": "/brand/food/tajadas.jpg",
  "hallaca": "/brand/food/hallaca.jpg",
  "empanada-mama": "/brand/food/empanada.jpg",
  "empanada-queso": "/brand/food/empanada-queso.jpg",
  "empanada-llanos": "/brand/food/empanada-queso.jpg",
  "chicha": "/brand/food/chicha-vaso.jpg",
  "chicha-clara": "/brand/food/chicha-vaso.jpg",
  "pollo-entero": "/brand/food/pollo-en-brasa.jpg",
  "medio-pollo": "/brand/food/pollo-en-brasa.jpg",
  "cuarto": "/brand/food/pollo-en-brasa.jpg",
  "yuca": "/brand/food/yuca-frita.jpg",
  "arepa-sola": "/brand/food/arepa.jpg",
  "tequenos-6": "/brand/food/tequeno.jpg",
  "tequenos-12": "/brand/food/tequeno.jpg",
  "tequenos-gocho": "/brand/food/tequeno.jpg",
  "tequenos-choco": "/brand/food/tequenos-chocolate.jpg",
  "tostones": "/brand/food/patacon.jpg",
  "mandocas": "/brand/food/mandocas.jpg",
  "churrasco": "/brand/food/churrasco.jpg",
  "parrilla-mixta": "/brand/food/parrilla-mixta.jpg",
  "chorizo": "/brand/food/parrilla-mixta.jpg",
  "patacones": "/brand/food/patacon.jpg",
  "patacon": "/brand/food/patacon.jpg",
  "cachapa-llanos": "/brand/food/cachapa-queso.jpg",
  "cachapa": "/brand/food/cachapa-queso.jpg",
  "perro-todo": "/brand/food/perro-caliente.jpg",
  "perro-queso": "/brand/food/perro.jpg",
  "perro-doble": "/brand/food/perro-caliente.jpg",
  "papitas": "/brand/food/papas-fritas.jpg",
  "papas": "/brand/food/papas-fritas.jpg",
  "papas-curva": "/brand/food/papas-fritas.jpg",
  "pepito-carne": "/brand/food/pepito.jpg",
  "pepito-pollo": "/brand/food/pepito-mixto.jpg",
  "pepito-mixto": "/brand/food/pepito-mixto.jpg",
  "clasica": "/brand/food/hamburguesa.jpg",
  "doble": "/brand/food/hamburguesa-criolla.jpg",
  "criolla": "/brand/food/hamburguesa-criolla.jpg",
  "aros": "/brand/food/aros-cebolla.jpg",
  "pelota-reina": "/brand/food/reina-pepiada.jpg",
  "pelota-pernil": "/brand/food/pernil-queso.jpg",
  "pelota-domino": "/brand/food/arepa-domino.jpg",
  "campesino": "/brand/food/pan-campesino.jpg",
  "sobao": "/brand/food/pan-sobao.jpg",
  "pan-ajo": "/brand/food/pan-ajo.jpg",
  "combo-jamon": "/brand/food/sandwich-jamon.jpg",
  "tostada": "/brand/food/arepa.jpg",
  "cafe-leche": "/brand/food/cafe-con-leche.jpg",
  "guayoyo": "/brand/food/cafe-guayoyo.jpg",
  "tres-leches": "/brand/food/tres-leches.jpg",
  "chocolate": "/brand/food/torta-chocolate.jpg",
  "torta-entera": "/brand/food/torta-chocolate.jpg",
  "alfajores": "/brand/food/alfajores.jpg",
  "catalinas": "/brand/food/catalinas.jpg",
  "golfeado-clara": "/brand/food/golfeado.jpg",
  "papelon": "/brand/food/papelon-vaso.jpg",
  "malta": "/brand/products/malta-6.jpg",
  "pizza-margarita": "/brand/food/pizza-margarita.jpg",
  "pizza-jamon-queso": "/brand/food/pizza-jamon-queso.jpg",
  "pizza-pepperoni": "/brand/food/pizza-pepperoni.jpg",
  "ceviche": "/brand/food/ceviche.jpg",
  "arroz-marisco": "/brand/food/arroz-marisco.jpg",
  "pastelito": "/brand/food/pastelito.jpg",
  "sancocho": "/brand/food/sancocho.jpg",
  "hervido-res": "/brand/food/hervido-res.jpg",
  "pan-de-queso": "/brand/food/pan-de-queso.jpg",
  "croissant": "/brand/food/croissant.jpg",
  "brazo-gitano": "/brand/food/brazo-gitano.jpg",
  "pastelito-carne": "/brand/food/pastelito.jpg",
  "pastelito-queso": "/brand/food/pastelito.jpg",
  "cachito-jamon": "/brand/food/cachito.jpg",
  "cachito-queso": "/brand/food/cachito.jpg",
  "empanada-cazon": "/brand/food/empanada-cazon.jpg",
  "refresco": "/brand/products/refresco.jpg",
  "quesillo": "/brand/products/quesillo.jpg",
  "pan-jamon": "/brand/food/pan-de-jamon.jpg"
};

const it = (id: string, name: string, desc: string, priceCents: number, icon: IconName, extra: Extra = {}): MenuItem => ({
  id,
  name,
  desc,
  priceCents,
  icon,
  image: extra.image ?? DISH_IMAGE_MAP[id],
  ...extra,
});
const sec = (id: string, title: string, items: MenuItem[]): MenuSection => ({ id, title, items });
const BEBIDAS = (...items: MenuItem[]) => sec("bebidas", "Bebidas", items);
const PAPELON = it("papelon", "Papelón con limón", "Bien frío, 16 oz.", 150, "papelon");
const MALTA = it("malta", "Malta", "Botella de 355 ml, bien fría.", 120, "malta");
const CAFE = it("guayoyo", "Guayoyo", "Café negro colado.", 100, "cafe");

type Base = {
  slug: string; name: string; initials: string; color: BrandColor; heroImage: FoodImage; kind: string;
  rating: string; reviews: string; time: string; feeCents: number; openUntil: string; opensAt: string;
  minOrderCents: number; open?: boolean; menu: MenuSection[];
};
const mk = (b: Base): StoreDetail => ({ ...b, open: b.open ?? true });

export const MORE_STORES: StoreDetail[] = [
  mk({
    slug: "cocina-de-mama-rosa", name: "Cocina de Mamá Rosa", initials: "MR", color: "leaf", heroImage: "pabellon", kind: "Criolla · Menú del día · Los Palos Grandes",
    rating: "4,9", reviews: "2,1 mil", time: "30–40 min", feeCents: 140, openUntil: "Hasta las 4:00 p. m.", opensAt: "Abre mañana a las 11:30 a. m.", minOrderCents: 800,
    menu: [
      sec("almuerzos", "Almuerzos", [
        it("pabellon", "Pabellón criollo", "Carne mechada, caraotas, arroz blanco y tajadas.", 650, "pabellon"),
        it("asado-negro", "Asado negro", "Con arroz, ensalada y plátano maduro.", 780, "pabellon", { low: 5 }),
        it("pollo-guisado", "Pollo guisado", "Con puré de papa y arroz.", 590, "pabellon"),
        it("pescado-frito", "Pescado frito", "Con tostones y ensalada.", 720, "pabellon", { soldOut: true }),
      ]),
      sec("acompanantes", "Acompañantes", [
        it("tajadas", "Tajadas", "Plátano maduro frito.", 200, "platano"),
        it("hallaca", "Hallaca", "Envuelta en hoja de plátano, como en diciembre.", 450, "hallaca", { low: 6 }),
        it("empanada-mama", "Empanada de carne", "Frita al momento.", 190, "empanada"),
      ]),
      BEBIDAS(PAPELON, it("chicha", "Chicha", "De arroz, con canela por encima.", 180, "chicha"), CAFE),
    ],
  }),
  mk({
    slug: "pollos-en-brasa-el-rey", name: "Pollos en Brasa El Rey", initials: "ER", color: "brand-orange", heroImage: "pollo-en-brasa", kind: "Pollo en brasa · Almuerzos · Chacao",
    rating: "4,7", reviews: "1,4 mil", time: "25–35 min", feeCents: 120, openUntil: "Hasta las 9:00 p. m.", opensAt: "Abre mañana a las 11:30 a. m.", minOrderCents: 900,
    menu: [
      sec("pollos", "Pollos", [
        it("pollo-entero", "Pollo entero en brasa", "Con papas fritas y ensalada.", 1450, "pabellon"),
        it("medio-pollo", "Medio pollo", "Con papas fritas.", 800, "pabellon", { low: 6 }),
        it("cuarto", "Cuarto de pollo", "Pierna o pechuga, con tajadas.", 480, "pabellon"),
      ]),
      sec("acompanantes", "Acompañantes", [
        it("tajadas", "Tajadas", "Plátano maduro frito.", 200, "platano"),
        it("yuca", "Yuca frita", "Con salsa de ajo.", 240, "platano"),
        it("arepa-sola", "Arepa asada", "Para acompañar.", 120, "arepa", { soldOut: true }),
      ]),
      BEBIDAS(PAPELON, MALTA),
    ],
  }),
  mk({
    slug: "tequenos-la-esquina", name: "Tequeños La Esquina", initials: "TE", color: "primary", heroImage: "tequeno", kind: "Tequeños · Frituras · Chacaíto",
    rating: "4,6", reviews: "720", time: "15–25 min", feeCents: 90, openUntil: "Hasta las 10:00 p. m.", opensAt: "Abre mañana a las 10:00 a. m.", minOrderCents: 400,
    menu: [
      sec("tequenos", "Tequeños", [
        it("tequenos-6", "Tequeños x6", "Queso blanco en masa hojaldrada, con salsa de ajo.", 400, "tequeno"),
        it("tequenos-12", "Tequeños x12", "Para compartir.", 750, "tequeno", { low: 5 }),
        it("tequenos-choco", "Tequeños de chocolate x6", "Dulces, con relleno de chocolate.", 450, "tequeno"),
      ]),
      sec("frituras", "Frituras", [
        it("empanada-queso", "Empanada de queso", "Frita al momento.", 150, "empanada"),
        it("tostones", "Tostones", "Con salsa rosada.", 300, "platano"),
        it("mandocas", "Mandocas", "Con queso rallado.", 280, "arepa", { soldOut: true }),
      ]),
      BEBIDAS(MALTA, PAPELON),
    ],
  }),
  mk({
    slug: "parrilla-los-llanos", name: "Parrilla Los Llanos", initials: "LL", color: "leaf", heroImage: "parrilla-mixta", kind: "Parrillas · Cenas · Las Mercedes",
    rating: "4,8", reviews: "980", time: "35–45 min", feeCents: 160, openUntil: "Hasta las 11:00 p. m.", opensAt: "Abre a las 6:00 p. m.", minOrderCents: 1200,
    menu: [
      sec("parrilla", "Parrilla", [
        it("churrasco", "Churrasco", "300 g con yuca, ensalada y guasacaca.", 1350, "pabellon"),
        it("parrilla-mixta", "Parrilla mixta para 2", "Res, cerdo, pollo, chorizo y morcilla.", 2800, "pabellon", { low: 3 }),
        it("chorizo", "Chorizo criollo", "Con arepa y guasacaca.", 520, "pabellon"),
      ]),
      sec("acompanantes", "Acompañantes", [
        it("patacones", "Patacones", "Plátano verde aplastado y frito.", 300, "platano"),
        it("cachapa-llanos", "Cachapa con queso de mano", "Maíz tierno a la plancha.", 550, "cachapa"),
        it("empanada-llanos", "Empanada de queso", "Frita al momento.", 150, "empanada"),
      ]),
      BEBIDAS(MALTA, PAPELON),
    ],
  }),
  mk({
    slug: "perros-el-gocho", name: "Perros El Gocho", initials: "EG", color: "ink", heroImage: "perro", kind: "Perros calientes · Callejera · Chacao",
    rating: "4,7", reviews: "1,6 mil", time: "15–25 min", feeCents: 80, openUntil: "Hasta la 1:00 a. m.", opensAt: "Abre a las 6:00 p. m.", minOrderCents: 300,
    menu: [
      sec("perros", "Perros", [
        it("perro-todo", "Perro con todo", "Salchicha, repollo, cebolla, salsas y papitas.", 320, "perro-caliente"),
        it("perro-queso", "Perro con queso", "Con queso rallado y tocineta.", 380, "perro-caliente", { low: 8 }),
        it("perro-doble", "Perro doble", "Dos salchichas, todo adentro.", 480, "perro-caliente"),
      ]),
      sec("extras", "Extras", [
        it("papitas", "Papas fritas", "Porción mediana.", 200, "platano"),
        it("tequenos-gocho", "Tequeños x3", "Con salsa de ajo.", 220, "tequeno", { soldOut: true }),
      ]),
      BEBIDAS(MALTA, PAPELON),
    ],
  }),
  mk({
    slug: "pepitos-la-castellana", name: "Pepitos La Castellana", initials: "PC", color: "plus", heroImage: "pepito", kind: "Pepitos · Callejera · La Castellana",
    rating: "4,6", reviews: "540", time: "20–30 min", feeCents: 100, openUntil: "Hasta las 12:00 a. m.", opensAt: "Abre a las 6:00 p. m.", minOrderCents: 500,
    menu: [
      sec("pepitos", "Pepitos", [
        it("pepito-carne", "Pepito de carne", "Carne en tiras, queso, lechuga y salsas.", 650, "pepito"),
        it("pepito-pollo", "Pepito de pollo", "Pollo desmechado con todo.", 580, "pepito"),
        it("pepito-mixto", "Pepito mixto", "Carne y pollo, doble queso.", 780, "pepito", { low: 4 }),
      ]),
      sec("extras", "Extras", [
        it("papas", "Papas fritas", "Porción grande.", 250, "platano"),
        it("patacon", "Patacón", "Con queso y salsa.", 350, "platano", { soldOut: true }),
      ]),
      BEBIDAS(MALTA, PAPELON),
    ],
  }),
  mk({
    slug: "hamburguesas-la-curva", name: "Hamburguesas La Curva", initials: "LC", color: "primary", heroImage: "hamburguesa", kind: "Hamburguesas · Callejera · Los Chaguaramos",
    rating: "4,5", reviews: "610", time: "25–35 min", feeCents: 120, openUntil: "Hasta las 12:00 a. m.", opensAt: "Abre a las 5:00 p. m.", minOrderCents: 700,
    menu: [
      sec("hamburguesas", "Hamburguesas", [
        it("clasica", "Clásica", "Carne de res, queso, lechuga y tomate.", 580, "hamburguesa"),
        it("doble", "Doble queso", "Dos carnes, doble queso cheddar.", 820, "hamburguesa", { low: 5 }),
        it("criolla", "Criolla", "Con tocineta, huevo y papitas.", 760, "hamburguesa"),
      ]),
      sec("extras", "Extras", [
        it("papas-curva", "Papas fritas", "Con salsa de la casa.", 260, "platano"),
        it("aros", "Aros de cebolla", "Crujientes.", 300, "platano", { soldOut: true }),
      ]),
      BEBIDAS(MALTA, PAPELON),
    ],
  }),
  mk({
    slug: "arepera-la-pelota", name: "Arepera La Pelota", initials: "LP", color: "primary", heroImage: "arepa", kind: "Arepas · Criollo · Chacaíto",
    rating: "4,5", reviews: "430", time: "25–35 min", feeCents: 110, openUntil: "Hasta las 11:00 p. m.", opensAt: "Abre a las 6:00 p. m.", minOrderCents: 500, open: false,
    menu: [
      sec("arepas", "Arepas", [
        it("pelota-reina", "Reina pepiada", "Pollo desmechado con aguacate.", 360, "arepa"),
        it("pelota-pernil", "Pernil con queso", "Pernil horneado y queso amarillo.", 420, "arepa"),
        it("pelota-domino", "Dominó", "Caraotas y queso blanco.", 290, "arepa"),
      ]),
      BEBIDAS(PAPELON, CAFE),
    ],
  }),
  // Panaderías (no aparecen entre los restaurantes)
  mk({
    slug: "panaderia-santa-rosa", name: "Panadería Santa Rosa", initials: "SR", color: "brand-orange", heroImage: "golfeado", kind: "Panadería · Desayunos · Los Palos Grandes",
    rating: "4,6", reviews: "510", time: "20–30 min", feeCents: 90, openUntil: "Hasta las 8:00 p. m.", opensAt: "Abre mañana a las 6:00 a. m.", minOrderCents: 500,
    menu: [
      sec("panes", "Panes", [
        it("campesino", "Pan campesino", "Masa madre, corteza gruesa.", 350, "pan-de-jamon"),
        it("sobao", "Pan sobao (6 unidades)", "Suave, ideal para sándwiches.", 240, "pan-de-jamon"),
        it("pan-ajo", "Pan de ajo", "Con mantequilla y perejil.", 280, "pan-de-jamon", { low: 5 }),
      ]),
      sec("desayunos", "Desayunos", [
        it("combo-jamon", "Sándwich de jamón y queso", "En pan sobao, con café.", 450, "pan-de-jamon"),
        it("tostada", "Tostada con mantequilla", "Con guayoyo.", 300, "cafe"),
      ]),
      BEBIDAS(CAFE, it("cafe-leche", "Café con leche", "Recién colado.", 140, "cafe")),
    ],
  }),
  mk({
    slug: "pasteleria-dona-clara", name: "Pastelería Doña Clara", initials: "DL", color: "primary", heroImage: "golfeado", kind: "Pastelería · Tortas · Altamira",
    rating: "4,9", reviews: "820", time: "30–40 min", feeCents: 130, openUntil: "Hasta las 7:00 p. m.", opensAt: "Abre mañana a las 8:00 a. m.", minOrderCents: 700,
    menu: [
      sec("tortas", "Tortas", [
        it("tres-leches", "Torta tres leches", "Porción individual.", 400, "cuatro"),
        it("chocolate", "Torta de chocolate", "Con ganache, porción individual.", 420, "cuatro", { low: 4 }),
        it("torta-entera", "Torta de cumpleaños (12 porciones)", "Sabor a elegir, encargo del día.", 3200, "cuatro", { soldOut: true }),
      ]),
      sec("galletas", "Galletas y bocados", [
        it("alfajores", "Alfajores x6", "Rellenos de dulce de leche.", 450, "catalina"),
        it("catalinas", "Catalinas x4", "Galleta con cobertura de papelón.", 380, "catalina"),
        it("golfeado-clara", "Golfeado", "Con queso de mano.", 260, "golfeado"),
      ]),
      BEBIDAS(CAFE, it("chicha-clara", "Chicha", "De arroz, con canela.", 180, "chicha")),
    ],
  }),
  // Más restaurantes
  mk({
    slug: "pizzeria-la-nona", name: "Pizzería La Nona", initials: "LN", color: "brand-orange", heroImage: "pizza-margarita", kind: "Pizzas · Pastas · Las Mercedes",
    rating: "4,7", reviews: "870", time: "30–40 min", feeCents: 150, openUntil: "Hasta las 11:00 p. m.", opensAt: "Abre mañana a las 12:00 p. m.", minOrderCents: 1000,
    menu: [
      sec("pizzas", "Pizzas", [
        it("pizza-margarita", "Pizza margarita", "Salsa de tomate, mozzarella y albahaca. 8 porciones.", 900, "pan-de-jamon"),
        it("pizza-jamon-queso", "Pizza de jamón y queso", "Jamón de pierna y mozzarella. 8 porciones.", 1050, "pan-de-jamon"),
        it("pizza-pepperoni", "Pizza de pepperoni", "Doble pepperoni y mozzarella. 8 porciones.", 1150, "pan-de-jamon", { low: 4 }),
      ]),
      sec("entradas", "Entradas", [
        it("pan-ajo", "Pan de ajo", "Con mantequilla y perejil.", 280, "pan-de-jamon"),
        it("papas", "Papas fritas", "Porción mediana.", 220, "platano", { soldOut: true }),
      ]),
      BEBIDAS(it("refresco", "Refresco de cola", "Botella de 1 l.", 200, "malta"), MALTA),
    ],
  }),
  mk({
    slug: "mariscos-el-faro", name: "Mariscos El Faro", initials: "EF", color: "primary", heroImage: "ceviche", kind: "Pescados · Mariscos · Chacaíto",
    rating: "4,6", reviews: "560", time: "30–40 min", feeCents: 140, openUntil: "Hasta las 8:00 p. m.", opensAt: "Abre mañana a las 11:00 a. m.", minOrderCents: 900,
    menu: [
      sec("platos", "Platos", [
        it("pescado-frito", "Pescado frito entero", "Con tostones y ensalada.", 850, "pabellon"),
        it("ceviche", "Ceviche de pescado", "Limón, cebolla morada y cilantro.", 780, "pabellon"),
        it("arroz-marisco", "Arroz con mariscos", "Camarones, calamares y mejillones.", 950, "pabellon", { low: 3 }),
      ]),
      sec("frituras", "Frituras", [
        it("empanada-cazon", "Empanada de cazón", "Al estilo oriental.", 220, "empanada"),
        it("tostones", "Tostones", "Con salsa rosada.", 300, "platano"),
        it("yuca", "Yuca frita", "Con salsa de ajo.", 240, "platano", { soldOut: true }),
      ]),
      BEBIDAS(PAPELON, MALTA),
    ],
  }),
  mk({
    slug: "cachitos-don-pepe", name: "Cachitos Don Pepe", initials: "DP", color: "brand-orange", heroImage: "cachito", kind: "Cachitos · Pastelitos · La Candelaria",
    rating: "4,6", reviews: "390", time: "15–25 min", feeCents: 90, openUntil: "Hasta las 6:00 p. m.", opensAt: "Abre mañana a las 6:00 a. m.", minOrderCents: 400,
    menu: [
      sec("cachitos", "Cachitos", [
        it("cachito-jamon", "Cachito de jamón", "Pan relleno de jamón, recién horneado.", 220, "pan-de-jamon"),
        it("cachito-queso", "Cachito de queso", "Relleno de queso blanco.", 200, "pan-de-jamon", { low: 6 }),
      ]),
      sec("frituras", "Frituras", [
        it("pastelito-carne", "Pastelito de carne", "Frito al momento.", 180, "empanada"),
        it("pastelito-queso", "Pastelito de queso", "Frito al momento.", 160, "empanada"),
        it("mandocas", "Mandocas", "Con queso rallado.", 280, "arepa", { soldOut: true }),
      ]),
      BEBIDAS(CAFE, it("cafe-leche", "Café con leche", "Recién colado.", 140, "cafe")),
    ],
  }),
  mk({
    slug: "hervidos-la-abuela", name: "Hervidos La Abuela", initials: "HA", color: "leaf", heroImage: "sancocho", kind: "Sopas · Hervidos · Criolla · El Cafetal",
    rating: "4,8", reviews: "710", time: "30–40 min", feeCents: 150, openUntil: "Hasta las 3:00 p. m.", opensAt: "Abre mañana a las 10:00 a. m.", minOrderCents: 700,
    menu: [
      sec("sopas", "Sopas", [
        it("sancocho", "Sancocho de gallina", "Con yuca, ñame, ocumo y mazorca.", 650, "pabellon", { low: 5 }),
        it("hervido-res", "Hervido de res", "Con verduras y arepa.", 700, "pabellon"),
      ]),
      sec("segundos", "Segundos", [
        it("pollo-guisado", "Pollo guisado", "Con puré de papa y arroz.", 590, "pabellon"),
        it("hallaca", "Hallaca", "Envuelta en hoja de plátano.", 450, "hallaca", { soldOut: true }),
      ]),
      BEBIDAS(PAPELON, it("chicha", "Chicha", "De arroz, con canela por encima.", 180, "chicha"), CAFE),
    ],
  }),
  // Más panaderías y pastelerías
  mk({
    slug: "panaderia-el-trigal", name: "Panadería El Trigal", initials: "TR", color: "leaf", heroImage: "croissant", kind: "Panadería · Desayunos · Sabana Grande",
    rating: "4,5", reviews: "420", time: "20–30 min", feeCents: 90, openUntil: "Hasta las 8:00 p. m.", opensAt: "Abre mañana a las 5:30 a. m.", minOrderCents: 400,
    menu: [
      sec("panes", "Panes", [
        it("pan-jamon", "Pan de jamón", "Relleno de jamón, tocineta, aceitunas y pasas. Porción de 1/4.", 450, "pan-de-jamon"),
        it("pan-de-queso", "Pan de queso", "Suave, con queso blanco por dentro.", 200, "pan-de-jamon"),
        it("campesino", "Pan campesino", "Masa madre, corteza gruesa.", 350, "pan-de-jamon", { low: 5 }),
        it("croissant", "Croissant de mantequilla", "Hojaldrado, recién horneado.", 220, "pan-de-jamon"),
      ]),
      sec("desayunos", "Desayunos", [
        it("cachito-jamon", "Cachito de jamón", "Con guayoyo.", 220, "pan-de-jamon"),
        it("combo-jamon", "Sándwich de jamón y queso", "En pan sobao, con café.", 450, "pan-de-jamon", { soldOut: true }),
      ]),
      BEBIDAS(CAFE, it("cafe-leche", "Café con leche", "Recién colado.", 140, "cafe")),
    ],
  }),
  mk({
    slug: "pasteleria-dulce-caracas", name: "Pastelería Dulce Caracas", initials: "DU", color: "plus", heroImage: "brazo-gitano", kind: "Pastelería · Postres · Los Chaguaramos",
    rating: "4,8", reviews: "640", time: "30–40 min", feeCents: 120, openUntil: "Hasta las 7:00 p. m.", opensAt: "Abre mañana a las 9:00 a. m.", minOrderCents: 600,
    menu: [
      sec("postres", "Postres", [
        it("tres-leches", "Torta tres leches", "Porción individual.", 400, "cuatro"),
        it("chocolate", "Torta de chocolate", "Con ganache, porción individual.", 420, "cuatro"),
        it("brazo-gitano", "Brazo gitano", "Relleno de dulce de leche, porción individual.", 380, "cuatro", { low: 4 }),
        it("quesillo", "Quesillo", "Con caramelo, porción individual.", 300, "cuatro", { soldOut: true }),
      ]),
      sec("galletas", "Galletas y bocados", [
        it("alfajores", "Alfajores x6", "Rellenos de dulce de leche.", 450, "catalina"),
        it("catalinas", "Catalinas x4", "Galleta con cobertura de papelón.", 380, "catalina"),
      ]),
      BEBIDAS(CAFE, it("cafe-leche", "Café con leche", "Recién colado.", 140, "cafe")),
    ],
  }),
];

export const BAKERY_SLUGS = ["panaderia-la-reina", "panaderia-santa-rosa", "pasteleria-dona-clara", "panaderia-el-trigal", "pasteleria-dulce-caracas"];
