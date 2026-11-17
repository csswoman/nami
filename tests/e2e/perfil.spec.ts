import { expect, test } from "@playwright/test";
test.describe("perfil y favoritos", () => {
  test("una tienda favorita aparece en /perfil y se puede quitar", async ({ page }) => {
    await page.goto("/tienda/arepera-dona-chela");
    await page.getByRole("button", { name: /Guardar Arepera Doña Chela en favoritos/ }).click();
    await expect(page.getByRole("button", { name: /Quitar Arepera Doña Chela de favoritos/ })).toHaveAttribute("aria-pressed", "true");
    await page.goto("/perfil");
    await expect(page.getByRole("heading", { name: "Mi perfil" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Arepera Doña Chela/ }).first()).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /Quitar Arepera Doña Chela de favoritos/ }).click();
    await expect(page.getByText("Todavía no tienes favoritos.")).toBeVisible();
  });
  test("guarda una dirección desde el mapa y la usa desde el perfil", async ({ page }) => {
    await page.goto("/direccion");
    await page.getByRole("button", { name: /Las Mercedes/ }).first().click();
    await page.getByLabel("Guardar esta dirección en mi perfil").check();
    await page.getByRole("button", { name: "Confirmar dirección" }).first().click();
    await page.goto("/perfil");
    await expect(page.getByText("Las Mercedes").first()).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "Usar" }).first().click();
    await expect(page.getByText("Ahora entregamos aquí.")).toBeVisible();
  });
  test("borrar mis datos de demo vacía lo guardado en el navegador", async ({ page }) => {
    await page.goto("/tienda/arepera-dona-chela");
    await page.getByRole("button", { name: /Guardar Arepera Doña Chela en favoritos/ }).click();
    await page.goto("/perfil");
    await page.getByRole("button", { name: "Borrar mis datos de demo" }).click();
    await page.getByRole("button", { name: "Sí, borrar todo" }).click();
    await expect(page.getByText(/Listo: borramos/)).toBeVisible();
    await page.waitForURL("**/", { timeout: 10_000 });
    expect(await page.evaluate(() => localStorage.getItem("nami-profile"))).toBeNull();
  });
});
test("el listado aplica filtros de la URL", async ({ page }) => {
  await page.goto("/listado?fast=1&price=1");
  // El estado activo va en el nombre accesible (aria-pressed no es válido en un enlace).
  await expect(page.getByRole("link", { name: /^Hasta 30 min\s*, activado$/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Precio \$\s*, activado$/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Precio $$", exact: true })).toBeVisible();
});
test("la búsqueda encuentra con errores de tipeo", async ({ page }) => {
  await page.goto("/busqueda?q=teqe%C3%B1os");
  await expect(page.getByText("Tequeños La Esquina").first()).toBeVisible();
});
