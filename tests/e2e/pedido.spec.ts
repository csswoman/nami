import { expect, test } from "@playwright/test";

/**
 * Recorre todo: entrar, agregar, pagar, seguir y recibir.
 * Los montos los calcula el servidor; la prueba comprueba que lo que se ve es lo que la BD cobró.
 */
test("pedir, seguir el recorrido y confirmar la entrega", async ({ page }) => {
  // Entrar
  expect((await page.goto("/"))?.ok()).toBe(true);
  await page.goto("/tienda/arepera-dona-chela");
  await expect(page.getByRole("heading", { name: "Arepera Doña Chela", level: 1 })).toBeVisible();

  // Agregar: dos Reina pepiada (masa blanca, budare y el aguacate extra que viene marcado)
  await page.getByRole("link", { name: "Elegir opciones de Reina pepiada" }).click();
  await page.getByRole("button", { name: "Agregar una unidad" }).click();
  await page.getByRole("button", { name: /^Agregar ·/ }).click();
  await page.waitForURL("**/tienda/arepera-dona-chela");

  // Pagar: carrito → confirmar pedido en efectivo (así se salta el pago móvil simulado)
  await page.goto("/carrito");
  await expect(page.getByText("Reina pepiada").first()).toBeVisible();
  await page.getByRole("link", { name: /^Ir a pagar/ }).first().click();
  await page.waitForURL("**/checkout");
  await page.getByRole("radio", { name: /Efectivo en divisas/ }).click();
  await page.getByRole("button", { name: /^Hacer pedido/ }).first().click();

  // Seguir: la URL lleva el id del pedido guardado en el servidor
  await page.waitForURL(/\/seguimiento\?id=[0-9a-f-]{36}/);
  const id = new URL(page.url()).searchParams.get("id")!;
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Recibimos tu pedido|Preparando tu pedido|Buscando motorizado|Tu pedido va en camino/);

  // El servidor cobró con sus precios: 2 × ($ 3,50 + $ 0,70) + envío $ 1,20 + propina $ 1,00
  const res = await page.request.get(`/api/orders/${id}`);
  expect(res.status()).toBe(200);
  const { order } = await res.json();
  expect(order.subtotalCents).toBe(840);
  expect(order.totalCents).toBe(840 + 120 + 100);
  expect(order.totalBsCents).toBe(Math.round(order.totalCents * order.rate));
  await expect(page.getByText("$ 10,60").first()).toBeVisible();

  // Otro navegador (sin la cookie del invitado) no puede ver el pedido
  const other = await page.context().browser()!.newContext();
  expect((await other.request.get(new URL(`/api/orders/${id}`, page.url()).toString())).status()).toBe(404);
  await other.close();

  // Modo demo: saltar etapas hasta que llegue
  const advance = page.getByRole("button", { name: /^Saltar a/ });
  for (let i = 0; i < 5 && (await advance.isVisible()); i++) {
    await advance.click();
    await page.waitForTimeout(400);
  }
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("¡Llegó tu pedido!");

  // Recibir
  await page.getByRole("button", { name: "Confirmar que lo recibí" }).click();
  await page.waitForURL("**/entregado?id=*");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("¡Buen provecho!");
  const done = await (await page.request.get(`/api/orders/${id}`)).json();
  expect(done.order.status).toBe("delivered");
});
