import { afterAll, expect, it } from "vitest";
import { getProduct, getPromos, getStore, getStores, searchCatalog } from "@/server/catalog";
import { db } from "@/server/db";

afterAll(async () => {
  // Cierra el pool para que vitest termine.
  await (db.$client as { end(): Promise<void> }).end();
});

it("getStores filtra por pestaña y respeta el orden del listado", async () => {
  const restaurants = await getStores({ vertical: 0 });
  expect(restaurants).toHaveLength(11);
  expect(restaurants[0].slug).toBe("arepera-dona-chela");
  const markets = await getStores({ vertical: 1 });
  expect(markets.every((s) => s.kind === "mercado")).toBe(true);
});

it("getStore agrupa el catálogo por sección y marca los productos con opciones", async () => {
  const store = await getStore("arepera-dona-chela");
  expect(store?.sections.map((s) => s.id)).toEqual(["arepas", "empanadas", "bebidas"]);
  const arepas = store!.sections[0].products;
  expect(arepas.find((p) => p.id === "reina")?.hasOptions).toBe(true);
  expect(arepas.find((p) => p.id === "pelua")?.soldOut).toBe(true);
  expect(await getStore("no-existe")).toBeNull();
});

it("getProduct devuelve los grupos de opciones con sus valores por defecto", async () => {
  const found = await getProduct("arepera-dona-chela", "reina");
  expect(found?.groups.map((g) => g.id)).toEqual(["masa", "coccion", "extras"]);
  expect(found?.groups[0].defaults).toEqual(["blanca"]);
  expect(found?.groups[2].max).toBe(3);
  expect(await getProduct("arepera-dona-chela", "no-existe")).toBeNull();
});

it("getPromos pone primero lo rebajado y omite los agotados", async () => {
  const promos = await getPromos("abasto-el-saman", 5);
  expect(promos[0].oldPriceCents).not.toBeNull();
  expect(promos.every((p) => !p.soldOut)).toBe(true);
});

it("searchCatalog ignora tildes y mayúsculas, y trata % y _ como texto", async () => {
  const a = await searchCatalog("TEQUENOS");
  expect(a.stores.map((s) => s.slug)).toContain("tequenos-la-esquina");
  expect(a.products.length).toBeGreaterThan(0);
  expect((await searchCatalog("%")).products).toHaveLength(0);
  expect(await searchCatalog("   ")).toEqual({ stores: [], products: [] });
});
