CREATE TABLE "store_hours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"day" integer NOT NULL,
	"opens_at" integer NOT NULL,
	"closes_at" integer NOT NULL,
	CONSTRAINT "store_hours_day_ck" CHECK ("store_hours"."day" between 0 and 6),
	CONSTRAINT "store_hours_span_ck" CHECK ("store_hours"."opens_at" >= 0 and "store_hours"."closes_at" > "store_hours"."opens_at" and "store_hours"."closes_at" <= 2880)
);
--> statement-breakpoint
ALTER TABLE "store_hours" ADD CONSTRAINT "store_hours_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "store_hours_store_idx" ON "store_hours" USING btree ("store_id");
--> statement-breakpoint
INSERT INTO "store_hours" ("store_id", "day", "opens_at", "closes_at")
SELECT s."id", d."day", COALESCE(s."opens_at", 0), COALESCE(s."closes_at", 1440)
FROM "stores" s CROSS JOIN generate_series(0, 6) AS d("day");
