import { expect, test } from "@playwright/test";

test("la portada carga", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.ok()).toBe(true);
  await expect(page.locator("body")).toBeVisible();
});
