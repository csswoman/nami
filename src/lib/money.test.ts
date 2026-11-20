import { describe, expect, it } from "vitest";
import { parsePriceCents, priceInputValue } from "./money";

describe("parsePriceCents", () => {
  it("acepta coma o punto decimal", () => {
    expect(parsePriceCents("3,50")).toBe(350);
    expect(parsePriceCents("3.5")).toBe(350);
    expect(parsePriceCents(" 12 ")).toBe(1200);
    expect(parsePriceCents("0,07")).toBe(7);
  });
  it("rechaza lo que no es un precio", () => {
    for (const bad of ["", "abc", "-1", "3,505", "1.000,50", "3,5,0"]) expect(parsePriceCents(bad)).toBeNaN();
  });
  it("ida y vuelta con priceInputValue", () => {
    expect(priceInputValue(350)).toBe("3,50");
    expect(parsePriceCents(priceInputValue(1999))).toBe(1999);
  });
});
