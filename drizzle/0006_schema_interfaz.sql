CREATE TYPE "public"."delivery_mode" AS ENUM('separate', 'combined');--> statement-breakpoint
CREATE TYPE "public"."option_group_kind" AS ENUM('one', 'many');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('movil', 'zelle', 'efectivo');--> statement-breakpoint
CREATE TYPE "public"."store_kind" AS ENUM('restaurante', 'mercado');--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TYPE "public"."order_status" RENAME TO "order_status_old";--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('recibido', 'preparando', 'buscando_motorizado', 'en_camino', 'entregado', 'cancelado');--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "public"."order_status" USING "status"::text::"public"."order_status";--> statement-breakpoint
DROP TYPE "public"."order_status_old";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'recibido';--> statement-breakpoint
CREATE TABLE "order_stops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"subtotal_cents" integer NOT NULL,
	"status" "order_status" DEFAULT 'recibido' NOT NULL,
	CONSTRAINT "order_stops_order_store_uq" UNIQUE("order_id","store_id")
);
--> statement-breakpoint
CREATE TABLE "product_option_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"hint" text DEFAULT '' NOT NULL,
	"kind" "option_group_kind" NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"max_select" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "product_option_groups_slug_uq" UNIQUE("product_id","slug")
);
--> statement-breakpoint
CREATE TABLE "product_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "product_options_slug_uq" UNIQUE("group_id","slug")
);
--> statement-breakpoint
DROP INDEX "order_items_order_idx";--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "stop_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "options" jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_mode" "delivery_mode" DEFAULT 'combined' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tip_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_method" "payment_method" DEFAULT 'movil' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "scheduled_for" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "courier" jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "plan" jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "stage_at" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "slug" text;--> statement-breakpoint
UPDATE "products" SET "slug" = "id"::text;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "icon" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "section" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "section_title" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "unit" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sold_out_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "kind" "store_kind" DEFAULT 'restaurante' NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "min_order_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "initials" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "color" text DEFAULT 'primary' NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "opens_at" integer;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "closes_at" integer;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "rating" numeric(2, 1);--> statement-breakpoint
ALTER TABLE "order_stops" ADD CONSTRAINT "order_stops_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_stops" ADD CONSTRAINT "order_stops_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_option_groups" ADD CONSTRAINT "product_option_groups_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_options" ADD CONSTRAINT "product_options_group_id_product_option_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."product_option_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_stops_order_idx" ON "order_stops" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_stops_store_idx" ON "order_stops" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "product_option_groups_product_idx" ON "product_option_groups" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_options_group_idx" ON "product_options" USING btree ("group_id");--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_stop_id_order_stops_id_fk" FOREIGN KEY ("stop_id") REFERENCES "public"."order_stops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_items_stop_idx" ON "order_items" USING btree ("stop_id");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_store_slug_uq" UNIQUE("store_id","slug");--> statement-breakpoint
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_order_id_orders_id_fk";
--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN "order_id";
