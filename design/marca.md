Ñami es una app venezolana de delivery: comida, mercado, farmacia y tiendas en un solo lugar. La marca es cálida, rápida y criolla; su cara es una guacamaya repartidora con gorra roja. La interfaz toma la estructura probada de las grandes apps de delivery (header rojo con buscador, tiles de verticales, carruseles de tiendas y ofertas, barra inferior) y la viste con los colores de la guacamaya.

## Voz y contenido

- Tutea siempre: “Tu pedido va en camino”, “Repite tu último pedido”.
- Español venezolano natural, sin exagerar la jerga: “cambur”, “harina de maíz”, “arepera” sí; chistes forzados no.
- Frases cortas y en positivo. Signos de apertura siempre: “¡Suscríbete ahora!”.
- Mayúscula solo al inicio (“Mercados de confianza”, no “Mercados De Confianza”); los badges de descuento pueden usar “DSCTO”, “OFF”, “3x2”.
- Precios en dólares con coma decimal y espacio: “$ 3,50”. Equivalente en bolívares, si hace falta, en la línea de unidad: “Bs. 128,10”.
- Sin emoji en la interfaz; la personalidad la pone la guacamaya.
- El nombre siempre “Ñami”, con Ñ. La suscripción es “Ñami+”.

## Color

- La interfaz es blanca (`surface`) con tiles gris cálido sutil (`surface-tile`, `#F7F3EE` en claro).
- Las tarjetas de categorías en el Home usan `surface-category` (`#F5EEDE` en claro / `#1C1C20` en oscuro), unificado exactamente con el fondo de las ilustraciones 3D de categorías (Restaurantes, Súper, Farmacias, Bodegones, Panaderías, Tiendas).
- Las imágenes y packshots de productos usan el token `surface-product` (`#F2EBD9` en claro / `#1C1C20` en oscuro), reservado exclusivamente para el fondo de las fotos de productos. El rojo se concentra en el header, el botón primario y los estados activos.
- `brand` (#FF2D3B) es el rojo de identidad: campañas, ilustración y texto grande. Para cualquier fondo con texto pequeño usa `primary` (#E8182E) con `on-primary`; el blanco sobre `brand` solo cumple a 24px o más.
- Rojo sobre blanco (precio en oferta, “Ver todo”): `primary-text`, nunca `brand`.
- Badges: variantes semánticas con contraste garantizado:
  - `promo`: fondo `promo` (#FFD23F) con texto `on-promo` (#1F1A1C) para descuentos y avisos comerciales.
  - `brand`: fondo suave `brand-tint` (#FFEAEB en claro / #3A1218 en oscuro) con texto `primary-text` y borde sutil.
  - `surface`: fondo blanco translúcido (`rgba(255,255,255,0.92)` con backdrop blur y sombra ligera) para contrastar limpiamente sobre fondos oscuros o de color de banners (`PromoBanner`).
  - `success`: fondo `success-tint` con texto `success` para confirmaciones y horarios abiertos.
  - `plus`: fondo `plus` con texto `on-primary` para la membresía Ñami+.
  - `neutral`: fondo `surface-tile` con texto `ink-muted`.
- Amarillo = descuento: `promo` con `on-promo`. Azul = Ñami+: `plus`. Verde = confirmación: `success` para texto, `success-tint` para chips, `leaf` para fondos sólidos con blanco.
- `brand-orange`, `brand-blue`, `brand-green` y `brand-cream` son colores de ilustración y campaña, no de texto.
- Errores con `danger` (distinto del rojo de marca) y siempre con palabra o icono.
- Tema oscuro: mismos nombres de token; el header y los botones mantienen el rojo `primary`. Las superficies son grafitos neutros (sin tinte rojizo) con elevación por luminosidad: `surface` → `surface-warm` → `surface-tile` → `surface-raised`. Las ilustraciones con fondo crema horneado se muestran como una placa redondeada (`radius-md`) dentro de la tarjeta.
- Mapas ilustrados (seguimiento, dirección, recorrido): nunca hex sueltos; usan los tokens `map-*` (`map-ground`, `map-block`, `map-road`, `map-park`, `map-park-deep`, `map-park-label`, `map-water`, `map-water-label`, `map-label`) con `fill-*`/`stroke-*`, para que sigan el tema. La ruta y el destino van en `primary`; las etiquetas oscuras del mapa ("Tu casa", Metro) usan `ink` con texto `surface`, así se invierten en oscuro.

## Tipografía

- Títulos en `display` (Nunito 800–900): redondeada como el logo. Úsala para títulos de sección (`title-lg`), tiles grandes (`title-md`), banners (`display`, `display-desktop`) y el nombre “Ñami” escrito.
- Todo lo demás en `sans` (Figtree): `body` para nombres de producto, `body-strong` para direcciones y labels, `price` para precios, `button`, `caption` para metadatos, `badge` y `nav`.
- Nunca Nunito en texto corrido ni en precios; nunca más de dos pesos por pantalla en una misma familia.
- Las dos familias son de Google Fonts (`Nunito` 700/800/900, `Figtree` 400/500/600/700); `components/bundle.css` ya las importa.
- Hay cuatro alternativas en la tarjeta “Opciones tipográficas”: Open Sans SemiBold + Inter, Plus Jakarta Sans + Inter, Baloo 2 + DM Sans y solo Montserrat (una familia; la jerarquía sale del tamaño y el peso: 800 display y precios, 700 títulos y botones, 600 labels, 500 texto y metadatos). Cambiar de opción solo toca `type.families` (y los pesos, en el caso de Montserrat) en los tokens.

## Espacio, forma y profundidad

- Rejilla de 4px: `space-4` (16px) de margen lateral en móvil, `space-8` en escritorio; `space-8`/`space-12` entre secciones.
- Todo es redondeado: `radius-pill` para buscador, botones y badges; `radius-lg` para tiles y banners; `radius-md` para logos e imágenes de producto; `radius-xl` solo para las esquinas inferiores del header y hojas inferiores.
- Móvil plano: sin sombras en tarjetas. Sombras solo en el header fijo (`shadow-header`), el buscador y el hover de tarjetas en escritorio (`shadow-card`).
- Elevación al pasar el cursor en escritorio: `shadow-hover` (tiles, logos, imágenes de producto); popovers y menús flotantes (carrito, reloj): `shadow-popover`. En oscuro las sombras son más densas y el popover suma un filo claro, porque el negro sobre `surface` casi no se ve.
- Foco de teclado: anillo sólido de 2px en `focus-ring` con 2px de separación.

## Móvil y escritorio

- Mobile-first. Por debajo de `bp-desktop` (1024px): `AppHeader` rojo arriba, contenido en carruseles horizontales que dejan asomar la siguiente tarjeta, `BottomNav` con cinco destinos.
- Desde `bp-desktop`: `TopBar` de 76px (logo, dirección, buscador ancho, “Mis pedidos”, carrito), contenedor de máx. 1200px, carruseles convertidos en grids (verticales 6 columnas, productos 5, restaurantes 3–4) y sin `BottomNav`.
- Orden del inicio: header → banner de campaña → verticales (2 grandes + fila de pequeñas) → mercados de confianza → promociones del día → descubre / más pedidos (restaurantes).

## Imágenes e ilustración

- Productos: packshots sin fondo sobre `surface-tile`. Restaurantes: foto del plato a sangre, 2:1.
- Verticales: foto recortada o ilustración 3D sin fondo; mientras no existan, icono en círculo de color (rojo comida, `leaf` súper, `plus` farmacia, `ink` envíos).
- La guacamaya (`assets/Mascota`) aparece en banners, estados vacíos, confirmaciones y seguimiento; una por pantalla.
- Evita fotos de stock con personas genéricas; la mascota es la cara de la marca.

## Iconografía

- Iconos propios de Ñami, dibujados para este sistema (no son de una librería): trazo redondeado 24×24, trazo 2px, `currentColor`, en la línea de Lucide. Estrella de calificación rellena.
- Dos sets con el mismo trazo: interfaz (`Nami.icons`: inicio, carrito, buscar…) y comida y cultura venezolana (`Nami.foodIcons`: arepa, cachapa, tequeño, empanada, hallaca, pabellón, perro caliente, hamburguesa, pepito, catalina, golfeado, pan de jamón, chicha, malta, guayoyo, papelón con limón, plátano, cuatro).
- Los iconos de comida van en `CuisineChip` (“¿Qué se te antoja?”), filtros de restaurantes y estados vacíos; siempre con etiqueta de texto.
- Si más adelante se ilustran versiones a color o 3D para las verticales, mantén los mismos nombres.
