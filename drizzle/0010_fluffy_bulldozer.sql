ALTER TYPE "public"."order_status" ADD VALUE 'aceptado' BEFORE 'preparando';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'listo' BEFORE 'preparando';--> statement-breakpoint
ALTER TABLE "order_stops" ADD COLUMN "reject_reason" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "hold_stage" integer;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "panel_seen_at" timestamp with time zone;