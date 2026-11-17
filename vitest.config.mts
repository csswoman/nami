import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const alias = { "@": fileURLToPath(new URL("./src", import.meta.url)) };

export default defineConfig({
  resolve: { alias },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      // La lógica de dominio pura (precios, cupones, franjas, máquina de estados…). Lo que toca la BD lo cubren tests/db.
      include: ["src/lib/**/*.ts"],
      exclude: ["src/lib/**/*.test.ts", "src/lib/demo/**", "src/lib/**/types.ts"],
      reporter: ["text-summary", "json-summary", "html"],
      // Un poco por debajo de lo actual: la CI falla si la cobertura baja, y se suben a medida que crece.
      thresholds: { statements: 42, lines: 40, branches: 38, functions: 33 },
    },
  },
});
