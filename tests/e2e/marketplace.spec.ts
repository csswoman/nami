import { expect, test } from "@playwright/test";

const STORE = "arepera-dona-chela";
// Abrir el panel de una tienda la pone en modo manual: se usa una que ningún otro e2e usa (ver a11y.spec.ts).
const PANEL_STORE = "empanadas-el-puerto";

test("panel: «Simular pedido entrante» crea un pedido que aparece en la bandeja", async ({ page }) => {
  await page.goto(`/tienda-admin/${PANEL_STORE}`);
  const before = await page.getByTestId("panel-stop").count();
  await page.getByTestId("simulate-order").click();
  await expect(page.getByText(/Llegó el pedido de prueba ÑM-\d+/)).toBeVisible({ timeout: 15_000 });
  await expect.poll(() => page.getByTestId("panel-stop").count(), { timeout: 15_000 }).toBeGreaterThan(before);
});

test("panel: la pestaña Ventas muestra la liquidación con la comisión de Ñami", async ({ page }) => {
  await page.goto(`/tienda-admin/${PANEL_STORE}#ventas`);
  const metrics = page.getByTestId("metrics");
  await expect(metrics).toBeVisible({ timeout: 15_000 });
  await expect(metrics.getByText("Neto a cobrar")).toBeVisible();
  await expect(metrics.getByText(/Comisión de Ñami \(18 %\)/)).toBeVisible();
});

test("la app del repartidor carga conectada", async ({ page }) => {
  await page.goto("/repartidor");
  await expect(page.getByRole("heading", { name: "Tus entregas" })).toBeVisible();
  await expect(page.getByText("Conectado", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Esperando repartidor/ })).toBeVisible();
});

test("«Bajo el capó» registra las llamadas a la API", async ({ page }) => {
  // ?capo=1 lo activa y lo abre de una vez.
  await page.goto(`/tienda-admin/${PANEL_STORE}?capo=1`);
  const panel = page.getByTestId("inspector");
  await expect(panel).toBeVisible();
  // Se puede minimizar y volver a abrir.
  await panel.getByRole("button", { name: "Minimizar" }).click();
  await page.getByTestId("inspector-toggle").click();
  await expect(panel).toBeVisible();
  // La bandeja consulta cada 4 s: aparece la llamada con su explicación.
  await expect(panel.getByText(/GET \/api\/tienda-admin\/empanadas-el-puerto\/orders/)).toBeVisible({ timeout: 15_000 });
  await panel.getByRole("button", { name: "Desactivar" }).click();
  await expect(page.getByTestId("inspector-toggle")).toHaveCount(0);
});

test("el recorrido guiado empieza desde /acerca y avanza a la tienda", async ({ page }) => {
  await page.goto("/acerca");
  await page.getByTestId("start-tour").first().click();
  const tour = page.getByTestId("tour");
  await expect(tour).toContainText("Paso 1 de 6");
  await tour.getByRole("button", { name: "Siguiente" }).click();
  await expect(page).toHaveURL(new RegExp(`/tienda/${STORE}`));
  await expect(page.getByTestId("tour")).toContainText("Paso 2 de 6");
  await page.getByTestId("tour").getByRole("button", { name: "Salir" }).click();
  await expect(page.getByTestId("tour")).toHaveCount(0);
});

test("la tienda tiene su propia imagen para compartir", async ({ request }) => {
  const res = await request.get(`/tienda/${STORE}/opengraph-image`);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("image/png");
});
