import { describe, expect, it } from "vitest";
import { planFor } from "@/lib/orders/progress";
import { EXTRA_STOP_CENTS, cartTotals, type PricedGroup } from "./index";

const group = (feeCents: number, ...lines: [qty: number, unitCents: number][]): PricedGroup => ({
  store: { feeCents },
  lines: lines.map(([qty, unitCents]) => ({ qty, unitCents })),
});

describe("cartTotals", () => {
  it("carrito vacío: todo en cero", () => {
    expect(cartTotals([], "combined")).toEqual({ itemCount: 0, subtotalCents: 0, shippingCents: 0, tipCents: 0, totalCents: 0 });
  });

  it("una tienda: subtotal + envío + propina", () => {
    const t = cartTotals([group(300, [2, 500], [1, 250])], "combined", 100);
    expect(t).toEqual({ itemCount: 3, subtotalCents: 1250, shippingCents: 300, tipCents: 100, totalCents: 1650 });
  });

  it("envíos separados: suma el envío de cada tienda", () => {
    const t = cartTotals([group(300, [1, 1000]), group(500, [1, 1000])], "separate");
    expect(t.shippingCents).toBe(800);
    expect(t.totalCents).toBe(2800);
  });

  it("envío combinado: el más caro + recargo por parada extra", () => {
    const t = cartTotals([group(300, [1, 1000]), group(500, [1, 1000]), group(200, [1, 1000])], "combined");
    expect(t.shippingCents).toBe(500 + 2 * EXTRA_STOP_CENTS);
  });

  it("combinado con una sola tienda no cobra recargo", () => {
    expect(cartTotals([group(300, [1, 1000])], "combined").shippingCents).toBe(300);
  });
});

describe("planFor", () => {
  const rest = { kind: "restaurante" as const, name: "A" };
  const market = { kind: "mercado" as const, name: "B" };

  it("una tienda: cinco etapas crecientes que empiezan en 0", () => {
    const plan = planFor([rest], "combined");
    expect(plan).toHaveLength(5);
    expect(plan[0]).toBe(0);
    expect([...plan].sort((a, b) => a - b)).toEqual(plan);
  });

  it("combinado con varias tiendas tarda más que con una", () => {
    const one = planFor([rest], "combined");
    const two = planFor([rest, market], "combined");
    expect(two[4]).toBeGreaterThan(one[4]);
  });

  it("separado no suma paradas, aunque haya varias tiendas", () => {
    expect(planFor([rest, market], "separate")).toEqual(planFor([rest], "separate"));
  });
});
