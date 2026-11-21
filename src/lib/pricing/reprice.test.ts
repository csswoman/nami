import { describe, expect, it } from "vitest";
import { EXTRA_STOP_CENTS } from "./index";
import { repriceOrder, type RepriceOrder } from "./reprice";

const order = (over: Partial<RepriceOrder> = {}): RepriceOrder => ({ delivery: "combined", shippingCents: 260, tipCents: 100, surchargeCents: 0, discountCents: 0, ...over });

describe("recalcular un pedido cuando cambia una parada", () => {
  it("sin cancelaciones solo cambia el subtotal (sustituciones)", () => {
    const r = repriceOrder(order(), [{ subtotalCents: 800, feeCents: 200, cancelled: false }, { subtotalCents: 500, feeCents: 150, cancelled: false }]);
    expect(r).toEqual({ subtotalCents: 1300, shippingCents: 260, discountCents: 0, totalCents: 1660 });
  });

  it("si una tienda rechaza su parte, no se cobran sus productos ni su envío", () => {
    const r = repriceOrder(order(), [{ subtotalCents: 800, feeCents: 200, cancelled: false }, { subtotalCents: 500, feeCents: 150, cancelled: true }]);
    expect(r).toEqual({ subtotalCents: 800, shippingCents: 200, discountCents: 0, totalCents: 1100 });
  });

  it("con envíos separados quita solo el envío de esa tienda", () => {
    const r = repriceOrder(order({ delivery: "separate", shippingCents: 350 }), [
      { subtotalCents: 800, feeCents: 200, cancelled: false },
      { subtotalCents: 300, feeCents: 100, cancelled: false },
      { subtotalCents: 500, feeCents: 150, cancelled: true },
    ]);
    expect(r?.shippingCents).toBe(300);
  });

  it("combinado: el recargo por parada extra baja con cada tienda que se cae", () => {
    const r = repriceOrder(order({ shippingCents: 200 + 2 * EXTRA_STOP_CENTS }), [
      { subtotalCents: 800, feeCents: 200, cancelled: false },
      { subtotalCents: 300, feeCents: 100, cancelled: false },
      { subtotalCents: 500, feeCents: 150, cancelled: true },
    ]);
    expect(r?.shippingCents).toBe(200 + EXTRA_STOP_CENTS);
  });

  it("mantiene propina y recargo, y topa el descuento", () => {
    const r = repriceOrder(order({ surchargeCents: 75, discountCents: 2000 }), [{ subtotalCents: 800, feeCents: 200, cancelled: false }, { subtotalCents: 500, feeCents: 150, cancelled: true }]);
    expect(r).toEqual({ subtotalCents: 800, shippingCents: 200, discountCents: 1000, totalCents: 175 });
  });

  it("pedidos viejos sin envío por parada conservan el envío cobrado", () => {
    const r = repriceOrder(order(), [{ subtotalCents: 800, feeCents: 0, cancelled: false }, { subtotalCents: 500, feeCents: 0, cancelled: true }]);
    expect(r?.shippingCents).toBe(260);
  });

  it("si se cancelan todas, devuelve null", () => {
    expect(repriceOrder(order(), [{ subtotalCents: 800, feeCents: 200, cancelled: true }])).toBeNull();
  });
});
