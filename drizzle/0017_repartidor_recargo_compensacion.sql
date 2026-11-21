CREATE TABLE "rider_sessions" (
	"token" text PRIMARY KEY NOT NULL,
	"seen_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "guest_token" text;--> statement-breakpoint
ALTER TABLE "order_stops" ADD COLUMN "fee_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "rider_token" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "rider_taken_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "surcharge_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "surcharge_reason" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "compensation_code" text;