CREATE TABLE "coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"percent" integer,
	"amount_cents" integer,
	"free_shipping" boolean DEFAULT false NOT NULL,
	"bogo_section" text,
	"min_subtotal_cents" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"store_id" uuid,
	"first_order_only" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code"),
	CONSTRAINT "coupons_percent_ck" CHECK ("coupons"."percent" is null or "coupons"."percent" between 1 and 100),
	CONSTRAINT "coupons_amount_ck" CHECK ("coupons"."amount_cents" is null or "coupons"."amount_cents" > 0)
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "coupon_code" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "discount_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;