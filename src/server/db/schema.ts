import { sql } from "drizzle-orm";
import type { Resolution, Substitution } from "@/lib/orders/substitution";
import {
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  doublePrecision,
  unique,
} from "drizzle-orm/pg-core";

// Dinero siempre en centavos (integer). Los precios base están en USD (centavos);
// los montos en bolívares (céntimos) se calculan con la tasa Bs./$ y cada pedido guarda ambos.

export const storeCategory = pgEnum("store_category", [
  "comida",
  "mercado",
  "farmacia",
  "tienda",
]);

// Restaurante (menú con platos) o mercado (súper, farmacia, tienda: catálogo con unidades).
export const storeKind = pgEnum("store_kind", ["restaurante", "mercado"]);
export const orderStatus = pgEnum("order_status", [
  "recibido",
  // Solo en paradas: la tienda aceptó el pedido / lo dejó listo para retirar.
  "aceptado",
  "listo",
  "preparando",
  "buscando_motorizado",
  "en_camino",
  "entregado",
  "cancelado",
]);
// Un motorizado por tienda (separate) o uno solo que pasa por todas (combined).
export const deliveryMode = pgEnum("delivery_mode", ["separate", "combined"]);
export const paymentMethod = pgEnum("payment_method", ["movil", "zelle", "efectivo"]);
export const optionGroupKind = pgEnum("option_group_kind", ["one", "many"]);

export const stores = pgTable("stores", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  category: storeCategory("category").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  deliveryFeeCents: integer("delivery_fee_cents").notNull().default(0),
  isOpen: boolean("is_open").notNull().default(true),
  kind: storeKind("kind").notNull().default("restaurante"),
  minOrderCents: integer("min_order_cents").notNull().default(0),
  // Iniciales y color de marca para el avatar cuando no hay imagen.
  initials: text("initials").notNull().default(""),
  color: text("color").notNull().default("primary"),
  // Horario en minutos desde la medianoche (hora de Caracas). closesAt puede pasar de 1440
  // (cierra después de medianoche). opensAt null = desde que empieza el día; ambos null = todo el día.
  opensAt: integer("opens_at"),
  closesAt: integer("closes_at"),
  rating: numeric("rating", { precision: 2, scale: 1 }),
  // Cantidad de reseñas como texto de presentación ("1,2 mil").
  reviews: text("reviews"),
  // Tiempo de entrega estimado, en minutos.
  etaMin: integer("eta_min"),
  etaMax: integer("eta_max"),
  // Envío gratis con Ñami+.
  plusFree: boolean("plus_free").notNull().default(false),
  // Zona ("Altamira") y palabras clave de comida para filtrar y buscar.
  area: text("area"),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  // Pestañas del listado donde aparece: 0 restaurantes, 1 súper, 2 farmacia, 3 bodegones, 4 panaderías, 5 tiendas.
  verticals: integer("verticals").array().notNull().default(sql`'{}'::integer[]`),
  sortOrder: integer("sort_order").notNull().default(0),
  // Ubicación de la tienda y hasta dónde reparte (metros por calle).
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  maxDeliveryM: integer("max_delivery_m").notNull().default(7000),
  // Última vez que alguien tuvo abierto el panel de la tienda: si es reciente, los pedidos los atiende la tienda.
  panelSeenAt: timestamp("panel_seen_at", { withTimezone: true }),
  // Primera vez que un visitante cambió el catálogo desde el panel (precios, stock, horario, abierta/cerrada).
  // La demo es compartida: pasado un rato la tienda vuelve sola al seed (src/server/demo-restore.ts).
  catalogChangedAt: timestamp("catalog_changed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Ruta por calle de una tienda al centro de cada zona de entrega, calculada una vez en el seed (OSRM).
export const storeRoutes = pgTable(
  "store_routes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    // Slug de la zona (lib/geo ZONES).
    zone: text("zone").notNull(),
    distanceM: integer("distance_m").notNull(),
    durationS: integer("duration_s").notNull(),
    // Polilínea [lng, lat] de la tienda a la zona.
    geometry: jsonb("geometry").$type<[number, number][]>().notNull(),
    // "osrm" = ruta real; "estimate" = línea recta × 1,4 cuando no hubo red.
    source: text("source").notNull().default("osrm"),
  },
  (t) => [unique("store_routes_store_zone_uq").on(t.storeId, t.zone), index("store_routes_zone_idx").on(t.zone)],
);
// Horario semanal de una tienda: un turno por fila (day 0 = lunes … 6 = domingo, hora de Caracas).
// closesAt puede pasar de 1440 (cierra después de medianoche). Un día sin filas está cerrado.
export const storeHours = pgTable(
  "store_hours",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    day: integer("day").notNull(),
    opensAt: integer("opens_at").notNull(),
    closesAt: integer("closes_at").notNull(),
  },
  (t) => [
    index("store_hours_store_idx").on(t.storeId),
    check("store_hours_day_ck", sql`${t.day} between 0 and 6`),
    check("store_hours_span_ck", sql`${t.opensAt} >= 0 and ${t.closesAt} > ${t.opensAt} and ${t.closesAt} <= 2880`),
  ],
);
// Cupones de descuento. Los aplica el servidor al crear el pedido (ver lib/pricing/coupons).
export const coupons = pgTable(
  "coupons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Siempre en mayúsculas y sin espacios.
    code: text("code").notNull().unique(),
    description: text("description").notNull().default(""),
    percent: integer("percent"),
    amountCents: integer("amount_cents"),
    freeShipping: boolean("free_shipping").notNull().default(false),
    // "2x1" en esta sección de la tienda del cupón.
    bogoSection: text("bogo_section"),
    minSubtotalCents: integer("min_subtotal_cents").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    // Solo vale en esta tienda; null = en cualquiera.
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }),
    firstOrderOnly: boolean("first_order_only").notNull().default(false),
    // Cupón de compensación de un solo invitado (pedido cancelado por la tienda): solo vale con ese token y una vez.
    guestToken: text("guest_token"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("coupons_percent_ck", sql`${t.percent} is null or ${t.percent} between 1 and 100`),
    check("coupons_amount_ck", sql`${t.amountCents} is null or ${t.amountCents} > 0`),
  ],
);
export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    // Id estable dentro de la tienda (el de los datos de demo): la interfaz no depende del uuid.
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    priceCents: integer("price_cents").notNull(),
    imageUrl: text("image_url"),
    // Nombre del icono de la interfaz (platos).
    icon: text("icon"),
    // Sección del menú: id estable, título y posición para ordenar.
    section: text("section").notNull().default(""),
    sectionTitle: text("section_title").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    // Presentación ("1 kg", "20 tabletas") en mercados.
    unit: text("unit"),
    // Precio anterior (rebaja) y unidades que quedan (aviso "Quedan N").
    oldPriceCents: integer("old_price_cents"),
    stock: integer("stock"),
    isAvailable: boolean("is_available").notNull().default(true),
    // Agotado hasta esa fecha; null = sin fecha de regreso.
    soldOutUntil: timestamp("sold_out_until", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("products_store_idx").on(t.storeId),
    unique("products_store_slug_uq").on(t.storeId, t.slug),
  ],
);
// Grupos de opciones de un producto ("Masa", "Extras") y sus opciones.
export const productOptionGroups = pgTable(
  "product_option_groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    hint: text("hint").notNull().default(""),
    kind: optionGroupKind("kind").notNull(),
    required: boolean("required").notNull().default(false),
    // Máximo de opciones elegibles (kind = many); null = sin tope.
    maxSelect: integer("max_select"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    index("product_option_groups_product_idx").on(t.productId),
    unique("product_option_groups_slug_uq").on(t.productId, t.slug),
  ],
);
export const productOptions = pgTable(
  "product_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => productOptionGroups.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    label: text("label").notNull(),
    priceCents: integer("price_cents").notNull().default(0),
    isDefault: boolean("is_default").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    index("product_options_group_idx").on(t.groupId),
    unique("product_options_slug_uq").on(t.groupId, t.slug),
  ],
);

// Historial de tasas Bs./$; el pedido guarda la que usó.
export const exchangeRates = pgTable("exchange_rates", {
  id: uuid("id").primaryKey().defaultRandom(),
  bsPerUsd: numeric("bs_per_usd", { precision: 18, scale: 4 }).notNull(),
  // Origen de la tasa (p. ej. "BCV", "manual").
  source: text("source").notNull().default("manual"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type RoutePoint = { lat: number; lng: number };
export type OrderCourier = { name: string; initials: string; vehicle: string; plate: string; rating: string };
// Opción elegida, copiada al comprar (no cambia si luego cambia el menú).
export type ChosenOption = { groupId: string; optionId: string; group: string; label: string; priceCents: number };

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Token anónimo (cookie) del invitado: sin login de cliente. Da acceso al pedido.
    guestToken: text("guest_token").notNull(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id),
    status: orderStatus("status").notNull().default("recibido"),
    subtotalCents: integer("subtotal_cents").notNull(),
    deliveryFeeCents: integer("delivery_fee_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    // Total en bolívares (céntimos) = totalCents × exchangeRate, fijado al crear el pedido.
    totalBsCents: integer("total_bs_cents").notNull(),
    // Tasa Bs./$ usada al crear el pedido.
    exchangeRate: numeric("exchange_rate", { precision: 18, scale: 4 }).notNull(),
    deliveryAddress: text("delivery_address").notNull(),
    // Nombre corto ("Altamira") y punto de referencia de la dirección.
    deliveryName: text("delivery_name"),
    deliveryReference: text("delivery_reference"),
    // Número visible del pedido (ÑM-2101…); el id (uuid) es el que viaja en URLs y API.
    number: integer("number").notNull().unique().generatedAlwaysAsIdentity({ startWith: 2101 }),
    // Inicio virtual del plan; "Avanzar" de la demo lo adelanta para saltar de etapa.
    startAt: timestamp("start_at", { withTimezone: true }).notNull().defaultNow(),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    deliveryMode: deliveryMode("delivery_mode").notNull().default("combined"),
    tipCents: integer("tip_cents").notNull().default(0),
    // Cupón aplicado y cuánto descontó en total (productos + envío). totalCents ya lo trae restado.
    // Motivo que dio el cliente al cancelar el pedido.
    cancelReason: text("cancel_reason"),
    couponCode: text("coupon_code"),
    discountCents: integer("discount_cents").notNull().default(0),
    paymentMethod: paymentMethod("payment_method").notNull().default("movil"),
    // Hora de inicio de un pedido programado (tienda cerrada al pedir); null = se prepara ya.
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
    courier: jsonb("courier").$type<OrderCourier>(),
    // Minutos desde el inicio en que se espera cada etapa (5 valores).
    plan: jsonb("plan").$type<number[]>(),
    // Hora real (ms epoch) en que se alcanzó cada etapa; null = todavía no.
    stageAt: jsonb("stage_at").$type<(number | null)[]>(),
    // Ruta precalculada + inicio: el cliente calcula la posición del repartidor.
    route: jsonb("route").$type<RoutePoint[]>(),
    deliveryStartedAt: timestamp("delivery_started_at", { withTimezone: true }),
    deliveryDurationSeconds: integer("delivery_duration_seconds"),
    // Etapa máxima mientras alguien atiende el pedido a mano: 0–1 una tienda desde su panel, 2–3 un repartidor
    // desde /repartidor. null = avanza solo por tiempo.
    holdStage: integer("hold_stage"),
    // Repartidor de la demo que tomó el pedido (su token de invitado) y cuándo.
    riderToken: text("rider_token"),
    riderTakenAt: timestamp("rider_taken_at", { withTimezone: true }),
    // Recargo por demanda (lluvia, hora pico): ya va sumado en totalCents.
    surchargeCents: integer("surcharge_cents").notNull().default(0),
    surchargeReason: text("surcharge_reason"),
    // Cupón que se le dio al cliente cuando la tienda canceló su pedido (rechazo o sin respuesta a tiempo).
    compensationCode: text("compensation_code"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("orders_guest_idx").on(t.guestToken),
    index("orders_created_idx").on(t.createdAt),
    index("orders_store_idx").on(t.storeId),
  ],
);

// Una fila por tienda del pedido, con su subtotal y su propio estado.
export const orderStops = pgTable(
  "order_stops",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id),
    // Orden en que se recogen las tiendas.
    position: integer("position").notNull().default(0),
    subtotalCents: integer("subtotal_cents").notNull(),
    // Envío de esta tienda hasta el cliente, tal como se cobró (para recalcular si la tienda rechaza su parte).
    feeCents: integer("fee_cents").notNull().default(0),
    status: orderStatus("status").notNull().default("recibido"),
    // Motivo que escribió la tienda al rechazar.
    rejectReason: text("reject_reason"),
  },
  (t) => [
    index("order_stops_order_idx").on(t.orderId),
    index("order_stops_store_idx").on(t.storeId),
    unique("order_stops_order_store_uq").on(t.orderId, t.storeId),
  ],
);
// Reseña de un pedido entregado: una por tienda del pedido (la calificación del cliente aplica a cada tienda).
export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    // Etiquetas elegidas ("Llegó rápido", "Bien empacado"…).
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("reviews_order_store_uq").on(t.orderId, t.storeId),
    index("reviews_store_idx").on(t.storeId),
    check("reviews_rating_ck", sql`${t.rating} between 1 and 5`),
  ],
);
export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stopId: uuid("stop_id")
      .notNull()
      .references(() => orderStops.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    // Copia del nombre y precio al momento de la compra.
    productName: text("product_name").notNull(),
    productSlug: text("product_slug").notNull().default(""),
    icon: text("icon"),
    unitPriceCents: integer("unit_price_cents").notNull(),
    quantity: integer("quantity").notNull(),
    note: text("note"),
    // Opciones elegidas, tal como eran al comprar.
    options: jsonb("options").$type<ChosenOption[]>(),
    // Mercados: qué hacer si no hay el producto (lo elige el cliente) y qué pasó (lo resuelve la tienda).
    substitution: jsonb("substitution").$type<Substitution>(),
    resolution: jsonb("resolution").$type<Resolution>(),
  },
  (t) => [index("order_items_stop_idx").on(t.stopId)],
);

// Repartidores de la demo con /repartidor abierto: mientras haya uno reciente, los pedidos listos lo esperan.
export const riderSessions = pgTable("rider_sessions", {
  token: text("token").primaryKey(),
  seenAt: timestamp("seen_at", { withTimezone: true }).notNull(),
});

// Límite de peticiones por ventana fija: una fila por clave ("orders:<ip>"). Ver src/server/rate-limit.ts.
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  count: integer("count").notNull(),
});
