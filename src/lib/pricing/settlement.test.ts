import { describe, expect, it } from "vitest";
import { commissionOf, discountShare, settleStop, sumSettlements, type SettlementStop } from "./settlement";

const stop = (over: Partial<SettlementStop> = {}): SettlementStop => ({
  kind: "restaurante", subtotalCents: 1000, orderSubtotalCents: 1000, productDiscountCents: 0, couponFundedByStore: false, cancelled: false, ...over,
});

describe("liquidación de una parada", () => {
  it("sin cupón: comisión según el tipo de tienda", () => {
    expect(settleStop(stop())).toEqual({ grossCents: 1000, commissionCents: 180, storeDiscountCents: 0, netCents: 820 });
    expect(settleStop(stop({ kind: "mercado" }))).toEqual({ grossCents: 1000, commissionCents: 120, storeDiscountCents: 0, netCents: 880 });
  });

  it("cupón de Ñami: la tienda cobra como si no hubiera descuento", () => {
    expect(settleStop(stop({ productDiscountCents: 300 }))).toEqual({ grossCents: 1000, commissionCents: 180, storeDiscountCents: 0, netCents: 820 });
  });

  it("cupón de la tienda: lo paga ella y la comisión va sobre lo rebajado", () => {
    expect(settleStop(stop({ productDiscountCents: 300, couponFundedByStore: true }))).toEqual({ grossCents: 1000, commissionCents: 126, storeDiscountCents: 300, netCents: 574 });
  });

  it("con varias tiendas el descuento se reparte según el subtotal de cada una", () => {
    expect(discountShare({ subtotalCents: 750, orderSubtotalCents: 1000, productDiscountCents: 200 })).toBe(150);
    expect(discountShare({ subtotalCents: 250, orderSubtotalCents: 1000, productDiscountCents: 200 })).toBe(50);
    // Nunca más que lo que vende la tienda.
    expect(discountShare({ subtotalCents: 100, orderSubtotalCents: 100, productDiscountCents: 500 })).toBe(100);
  });

  it("una parada cancelada no genera venta ni comisión", () => {
    expect(settleStop(stop({ cancelled: true }))).toEqual({ grossCents: 0, commissionCents: 0, storeDiscountCents: 0, netCents: 0 });
  });

  it("redondea la comisión al centavo y suma bien", () => {
    expect(commissionOf(333, "restaurante")).toBe(60);
    const total = sumSettlements([settleStop(stop()), settleStop(stop({ kind: "mercado" }))]);
    expect(total).toEqual({ grossCents: 2000, commissionCents: 300, storeDiscountCents: 0, netCents: 1700 });
  });
});
