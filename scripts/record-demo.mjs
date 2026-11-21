/**
 * Graba el recorrido completo de /demo (cliente → tienda → repartidor) y lo deja como GIF para el README.
 * Uso, con la app corriendo (npm run dev):
 *   BASE_URL=http://localhost:3000 node scripts/record-demo.mjs
 * Necesita ffmpeg en el PATH para el GIF; si no está, deja solo el video .webm.
 * Usa Ñami Market porque abre las 24 horas: la grabación no depende de la hora en Caracas.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, renameSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const STORE = process.env.STORE ?? "nami-market";
const OUT_DIR = "docs/screenshots";
const TMP = join(OUT_DIR, ".video");
const pause = (page, ms = 1400) => page.waitForTimeout(ms);

mkdirSync(TMP, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 860 }, recordVideo: { dir: TMP, size: { width: 1440, height: 860 } } });
// En desarrollo, Next pinta su botón de avisos en cada iframe: no va en la grabación.
await context.addInitScript(() => {
  const hide = () => {
    const style = document.createElement("style");
    style.textContent = "nextjs-portal{display:none!important}";
    document.documentElement.appendChild(style);
  };
  if (document.documentElement) hide();
  else document.addEventListener("DOMContentLoaded", hide);
});
const page = await context.newPage();
try {
  await page.goto(`${BASE}/demo?tienda=${STORE}`);
  const frameOf = async (pattern) => {
    for (let i = 0; i < 50; i++) {
      const f = page.frames().find((x) => pattern.test(x.url()));
      if (f) return f;
      await page.waitForTimeout(200);
    }
    throw new Error(`No apareció el iframe ${pattern}`);
  };
  const client = await frameOf(/\/mercado\//);
  const panel = await frameOf(/\/tienda-admin\//);
  const rider = await frameOf(/\/repartidor/);
  await client.waitForLoadState("networkidle");
  await pause(page, 2000);

  // 1. Cliente: agrega productos hasta pasar el pedido mínimo y paga en efectivo.
  const add = client.getByRole("button", { name: /^Agregar (?!otra)/ });
  // Cada producto agregado cambia su botón por un contador: el primero de la lista siempre es uno nuevo.
  for (let i = 0; i < 6; i++) {
    await add.nth(0).click();
    await pause(page, 500);
  }
  await pause(page);
  await client.goto(`${BASE}/checkout`);
  await client.getByText("Efectivo en divisas", { exact: true }).first().click();
  await pause(page);
  await client.locator("[data-tour=pedir]:visible").click();
  await client.waitForURL(/\/seguimiento/);
  await pause(page, 2500);

  // 2. Tienda: acepta, prepara y deja listo.
  for (const name of ["Aceptar", "Empezar a preparar", "Listo para retirar"]) {
    const b = panel.getByRole("button", { name, exact: true }).first();
    await b.waitFor({ timeout: 20_000 });
    await b.scrollIntoViewIfNeeded();
    await pause(page, 600);
    await b.click();
    await pause(page, 1800);
  }

  // 3. Repartidor: lo toma, lo recoge y llega.
  for (const name of ["Tomar pedido", "Ya lo recogí", "Llegué a la puerta"]) {
    const b = rider.getByRole("button", { name }).first();
    await b.waitFor({ timeout: 20_000 });
    await pause(page, 800);
    await b.click();
    await pause(page, name === "Ya lo recogí" ? 6000 : 2500);
  }
  // El seguimiento consulta cada 4 s: se espera a que el cliente vea «Llegó».
  await client.getByText(/Llegó/).first().waitFor({ timeout: 15_000 }).catch(() => {});
  await pause(page, 4000);
} finally {
  await context.close();
  await browser.close();
}

const [video] = readdirSync(TMP).filter((f) => f.endsWith(".webm")).map((f) => join(TMP, f)).sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
const webm = join(OUT_DIR, "demo.webm");
renameSync(video, webm);
rmSync(TMP, { recursive: true, force: true });
const gif = join(OUT_DIR, "demo.gif");
const ff = spawnSync("ffmpeg", ["-y", "-i", webm, "-vf", "fps=8,scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer:bayer_scale=4", gif], { stdio: "inherit" });
if (ff.status === 0) {
  rmSync(webm);
  console.log(`Listo: ${gif} (${Math.round(statSync(gif).size / 1024)} KB)`);
} else {
  console.log(`Sin ffmpeg: queda el video en ${webm}`);
}
