ALTER TABLE "orders" ADD COLUMN "guest_token" text NOT NULL;--> statement-breakpoint
CREATE INDEX "orders_guest_idx" ON "orders" USING btree ("guest_token");--> statement-breakpoint
CREATE INDEX "orders_created_idx" ON "orders" USING btree ("created_at");