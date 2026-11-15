import { describe, expect, it } from "vitest";
import { describeChange, replacementUnitCents, substitutionSchema, totalsAfterChange } from "./substitution";

describe("substitutionSchema", () => {
  it("acepta las tres políticas", () => {
    expect(substitutionSchema.safeParse({ kind: "remove" }).success).toBe(true);
    expect(substitutionSchema.safeParse({ kind: "similar" }).success).toBe(true);
    expect(substitutionSchema.safeParse({ kind: "product", product: "harina-juana" }).success).toBe(true);
  });
  it("elegir un producto exige decir cuál", () => {
    expect(substitutionSchema.safeParse({ kind: "product" }).success).toBe(false);
    expect(substitutionSchema.safeParse({ kind: "otra" }).success).toBe(false);
  });
});
describe("replacementUnitCents", () => {
  it("cobra lo más barato entre lo pedido y el reemplazo", () => {
    expect(replacementUnitCents(500, 650)).toBe(500);
    expect(replacementUnitCents(500, 420)).toBe(420);
  });
});
describe("describeChange", () => {
  it("cuenta lo que pasó, o nada si no hubo cambio", () => {
    expect(describeChange({ productName: "Harina PAN", resolution: null })).toBeNull();
    expect(describeChange({ productName: "Harina PAN", resolution: { kind: "removed" } })).toBe("Sin stock: Harina PAN, lo quitamos del pedido.");
    expect(describeChange({ productName: "Harina Juana", resolution: { kind: "replaced", fromName: "Harina PAN", fromSlug: "pan", fromUnitCents: 250 } })).toBe("Sin stock: Harina PAN. Lo cambiamos por Harina Juana.");
  });
});
describe("totalsAfterChange", () => {
  it("suma productos, envío y propina menos el descuento", () => {
    expect(totalsAfterChange({ subtotalCents: 1000, shippingCents: 120, tipCents: 100, discountCents: 100 })).toEqual({ discountCents: 100, totalCents: 1120 });
  });
  it("el descuento no pasa de lo que se paga", () => {
    expect(totalsAfterChange({ subtotalCents: 0, shippingCents: 120, tipCents: 0, discountCents: 500 })).toEqual({ discountCents: 120, totalCents: 0 });
  });
});
