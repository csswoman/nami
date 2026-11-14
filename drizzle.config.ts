import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// En desarrollo carga .env.development.local (Docker); MIGRATE_DATABASE_URL lo pisa para Neon.
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

// Migraciones: usa la conexión directa (sin pooler) si existe (Neon).
const url = process.env.MIGRATE_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("Falta DATABASE_URL");

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url },
});
