-- Búsqueda sin tildes (searchCatalog: unaccent + ILIKE).
CREATE EXTENSION IF NOT EXISTS unaccent;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "old_price_cents" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stock" integer;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "reviews" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "eta_min" integer;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "eta_max" integer;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "plus_free" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "area" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "tags" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "verticals" integer[] DEFAULT '{}'::integer[] NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;