import { describe, expect, it } from "vitest";
import type { StoreSummary } from "@/lib/catalog";
import { NO_FILTERS, applyListing, filterParams, parseFilters, priceLevel } from "./listing";
const ALL_DAY = [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, opensAt: 0, closesAt: 1440 }));
function store(over: Partial<StoreSummary>): StoreSummary {
  return {
    id: "1", slug: "s", name: "S", kind: "restaurante", category: "comida", description: "", area: null, imageUrl: null, initials: "S", color: "primary",
    rating: "4,5", reviews: null, time: "20–30 min", etaMaxMin: 30, avgPriceCents: 400, feeCents: 100, minOrderCents: 0, plusFree: false, isOpen: true,
    schedule: ALL_DAY, tags: [], verticals: [0], ...over,
  };
}
describe("priceLevel", () => {
  it("separa en tres niveles", () => {
    expect(priceLevel(null)).toBeNull();
    expect([250, 300, 301, 450, 451].map(priceLevel)).toEqual([1, 1, 2, 2, 3]);
  });
});
describe("parseFilters", () => {
  it("lee los parámetros y descarta valores raros", () => {
    const q: Record<string, string> = { open: "1", price: "2", sort: "top", fast: "x", free: "1" };
    expect(parseFilters((k) => q[k])).toEqual({ open: true, free: true, fast: false, price: 2, sort: "top" });
    expect(parseFilters((k) => ({ price: "9", sort: "zzz" } as Record<string, string>)[k])).toEqual(NO_FILTERS);
  });
  it("filterParams es la inversa", () => {
    const f = { open: true, free: false, fast: true, price: 3 as const, sort: "rapido" as const };
    const p = filterParams(f);
    expect(parseFilters((k) => p[k])).toEqual(f);
  });
});
describe("applyListing", () => {
  const a = store({ slug: "a", etaMaxMin: 45, rating: "4,9", plusFree: true, avgPriceCents: 200 });
  const b = store({ slug: "b", etaMaxMin: 25, rating: "4,1", feeCents: 0, avgPriceCents: 500 });
  const c = store({ slug: "c", etaMaxMin: 35, rating: null, isOpen: false, schedule: [] });
  const list = [a, b, c];
  const slugs = (r: StoreSummary[]) => r.map((s) => s.slug);
  it("sin filtros conserva el orden", () => expect(slugs(applyListing(list, NO_FILTERS, 600))).toEqual(["a", "b", "c"]));
  it("filtra por envío gratis, rapidez, precio y abierto", () => {
    expect(slugs(applyListing(list, { ...NO_FILTERS, free: true }, 600))).toEqual(["a", "b"]);
    expect(slugs(applyListing(list, { ...NO_FILTERS, fast: true }, 600))).toEqual(["b"]);
    expect(slugs(applyListing(list, { ...NO_FILTERS, price: 3 }, 600))).toEqual(["b"]);
    expect(slugs(applyListing(list, { ...NO_FILTERS, open: true }, 600))).toEqual(["a", "b"]);
  });
  it("ordena por rapidez y por calificación (sin calificación al final)", () => {
    expect(slugs(applyListing(list, { ...NO_FILTERS, sort: "rapido" }, 600))).toEqual(["b", "c", "a"]);
    expect(slugs(applyListing(list, { ...NO_FILTERS, sort: "top" }, 600))).toEqual(["a", "b", "c"]);
  });
});
