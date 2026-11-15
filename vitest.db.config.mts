import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Pruebas contra Postgres real (servicio db-test). Se lanzan con `npm run test:db`.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // "server-only" lanza fuera de Next: en las pruebas se sustituye por un módulo vacío.
      "server-only": fileURLToPath(new URL("./tests/db/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/db/**/*.test.ts"],
    testTimeout: 15_000,
    fileParallelism: false,
  },
});
