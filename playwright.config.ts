import { defineConfig, devices } from "@playwright/test";

// E2E_PORT=3000 reutiliza el `next dev` que ya tengas corriendo (Next no deja abrir dos en la misma carpeta).
const port = Number(process.env.E2E_PORT ?? 3100);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: "list",
  use: { baseURL: `http://localhost:${port}`, trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next dev -p ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    // Las pruebas hacen muchos pedidos seguidos desde la misma IP: sin esto chocarían con el límite de la demo.
    env: { RATE_LIMIT: "off" },
    timeout: 120_000,
  },
});
