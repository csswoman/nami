ALTER TABLE "order_items" ADD COLUMN "product_slug" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "icon" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_name" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_reference" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "number" integer NOT NULL GENERATED ALWAYS AS IDENTITY (sequence name "orders_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 2101 CACHE 1);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "start_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivered_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_number_unique" UNIQUE("number");