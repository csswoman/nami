CREATE TABLE "store_routes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"zone" text NOT NULL,
	"distance_m" integer NOT NULL,
	"duration_s" integer NOT NULL,
	"geometry" jsonb NOT NULL,
	"source" text DEFAULT 'osrm' NOT NULL,
	CONSTRAINT "store_routes_store_zone_uq" UNIQUE("store_id","zone")
);
--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "lat" double precision;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "lng" double precision;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "max_delivery_m" integer DEFAULT 7000 NOT NULL;--> statement-breakpoint
ALTER TABLE "store_routes" ADD CONSTRAINT "store_routes_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "store_routes_zone_idx" ON "store_routes" USING btree ("zone");