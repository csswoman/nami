import {
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
} from "drizzle-orm/pg-core";

// Dinero siempre en centavos (integer). Los precios base están en USD (centavos);
// los montos en bolívares (céntimos) se calculan con la tasa Bs./$ y cada pedido guarda ambos.

export const storeCategory = pgEnum("store_category", [
  "comida",
  "mercado",
  "farmacia",
  "tienda",
]);

export const orderStatus = pgEnum("order_status", [
  "preparando",
  "en_camino",
  "entregado",
]);

export const stores = pgTable("stores", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  category: storeCategory("category").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  deliveryFeeCents: integer("delivery_fee_cents").notNull().default(0),
  isOpen: boolean("is_open").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    priceCents: integer("price_cents").notNull(),
    imageUrl: text("image_url"),
    isAvailable: boolean("is_available").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("products_store_idx").on(t.storeId)],
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

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Token anónimo (cookie) del invitado: sin login de cliente. Da acceso al pedido.
    guestToken: text("guest_token").notNull(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id),
    status: orderStatus("status").notNull().default("preparando"),
    subtotalCents: integer("subtotal_cents").notNull(),
    deliveryFeeCents: integer("delivery_fee_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    // Total en bolívares (céntimos) = totalCents × exchangeRate, fijado al crear el pedido.
    totalBsCents: integer("total_bs_cents").notNull(),
    // Tasa Bs./$ usada al crear el pedido.
    exchangeRate: numeric("exchange_rate", { precision: 18, scale: 4 }).notNull(),
    deliveryAddress: text("delivery_address").notNull(),
    // Ruta precalculada + inicio: el cliente calcula la posición del repartidor.
    route: jsonb("route").$type<RoutePoint[]>(),
    deliveryStartedAt: timestamp("delivery_started_at", { withTimezone: true }),
    deliveryDurationSeconds: integer("delivery_duration_seconds"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("orders_guest_idx").on(t.guestToken),
    index("orders_created_idx").on(t.createdAt),
    index("orders_store_idx").on(t.storeId),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    // Copia del nombre y precio al momento de la compra.
    productName: text("product_name").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

