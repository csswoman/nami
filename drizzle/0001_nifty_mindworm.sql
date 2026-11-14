ALTER TABLE "exchange_rates" ADD COLUMN "source" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "total_bs_cents" integer NOT NULL;