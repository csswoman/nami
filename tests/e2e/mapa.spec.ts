import { expect, test } from "@playwright/test";

test.describe("dirección en el mapa", () => {
  test("muestra el mapa con el pin y la zona detectada", async ({ page }) => {
    await page.goto("/direccion");
    await expect(page.locator(".maplibregl-canvas").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("coverage-summary")).toContainText("Zona: Altamira");
    await expect(page.getByTestId("coverage-summary")).toContainText(/\d+ de \d+ tiendas llegan/);
  });
  test("elegir una zona lejana deja sin tiendas y la portada lo dice", async ({ page }) => {
    await page.goto("/direccion");
    await page.getByRole("button", { name: /Caricuao/ }).first().click();
    await expect(page.getByTestId("coverage-summary")).toContainText("Zona: Caricuao");
    await expect(page.getByTestId("coverage-summary")).toContainText("0 de");
    await page.getByRole("button", { name: "Confirmar dirección" }).first().click();
    await page.goto("/");
    await expect(page.getByTestId("delivery-bar")).toContainText("Entregando en Caricuao", { timeout: 20_000 });
  });
  test("cambiar de zona cambia el envío que ve el cliente", async ({ page }) => {
    const fee = async () => {
      await page.goto("/tienda/arepera-dona-chela");
      return (await page.locator("text=/\\$\\s?\\d+,\\d{2} · Bs/").first().textContent()) ?? "";
    };
    const before = await fee();
    await page.goto("/direccion");
    await page.getByRole("button", { name: /Las Mercedes/ }).first().click();
    await page.getByRole("button", { name: "Confirmar dirección" }).first().click();
    const after = await fee();
    expect(after).not.toBe("");
    expect(after).not.toBe(before);
    await page.goto("/tienda/arepera-dona-chela");
    await expect(page.getByTestId("not-covered")).toHaveCount(0);
  });
  test("una tienda que no llega lo avisa en su página", async ({ page }) => {
    await page.goto("/direccion");
    await page.getByRole("button", { name: /Caricuao/ }).first().click();
    await page.getByRole("button", { name: "Confirmar dirección" }).first().click();
    await page.goto("/tienda/arepera-dona-chela");
    await expect(page.getByTestId("not-covered")).toContainText("no llega a Caricuao");
  });
});

test.describe("sin tiendas que lleguen", () => {
  for (const [label, loc] of [["lejos (Caricuao)", "10.43150:-66.97450"], ["fuera del mapa", "40.40000:-3.70000"]] as const) {
    test(`las páginas no se rompen: ${label}`, async ({ page, context, baseURL }) => {
      await context.addCookies([{ name: "nami_loc", value: loc, url: baseURL! }]);
      for (const path of ["/", "/listado", "/listado?v=1", "/ofertas", "/busqueda?q=arepa", "/mercado/abasto-el-saman", "/tienda/arepera-dona-chela"]) {
        const res = await page.goto(path);
        expect(res?.ok(), path).toBe(true);
        await expect(page.getByText("Se nos fue la señal"), path).toHaveCount(0);
        await expect(page.locator("body"), path).toBeVisible();
      }
    });
  }
});
