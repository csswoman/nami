import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Accesibilidad automática (axe-core, reglas WCAG 2.1 A y AA) en las pantallas principales, en claro y en oscuro.
 * No reemplaza probar con lector de pantalla y teclado, pero evita regresiones de contraste, nombres y roles.
 */
const PAGES = [
  { name: "inicio", path: "/" },
  { name: "listado", path: "/listado" },
  { name: "búsqueda", path: "/busqueda?q=arepa" },
  { name: "tienda", path: "/tienda/arepera-dona-chela" },
  { name: "carrito vacío", path: "/carrito" },
  { name: "dirección", path: "/direccion" },
  // Una tienda que ningún otro e2e usa: abrir su panel la pone en modo manual y frenaría los pedidos de otras pruebas.
  { name: "panel de tienda", path: "/tienda-admin/perros-el-gocho" },
  { name: "acerca", path: "/acerca" },
];

for (const scheme of ["light", "dark"] as const) {
  test.describe(`accesibilidad (${scheme === "light" ? "claro" : "oscuro"})`, () => {
    test.use({ colorScheme: scheme });
    for (const { name, path } of PAGES) {
      test(name, async ({ page }) => {
        expect((await page.goto(path))?.ok()).toBe(true);
        await page.waitForLoadState("networkidle");
        const { violations } = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          // El lienzo del mapa (MapLibre) lo dibuja la librería; sus controles sí se revisan.
          .exclude(".maplibregl-canvas")
          .analyze();
        const summary = violations.map((v) => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join("\n  ")}`);
        expect(summary, summary.join("\n")).toEqual([]);
      });
    }
  });
}
