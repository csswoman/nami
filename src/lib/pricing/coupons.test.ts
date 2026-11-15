import { describe, expect, it } from "vitest";
import { applyCoupon, bogoSavings, normalizeCode, type CouponContext, type CouponRule } from "./coupons";

const rule = (over: Partial<CouponRule> = {}): CouponRule => ({
  code: "TEST", description: "", percent: null, amountCents: null, freeShipping: false, bogoSection: null,
  minSubtotalCents: 0, expiresAt: null, storeSlug: null, firstOrderOnly: false, ...over,
});
const line = (storeSlug: string, section: string, qty: number, unitCents: number) => ({ storeSlug, section, qty, unitCents });
const ctx = (over: Partial<CouponContext> = {}): CouponContext => ({ now: 1000, firstOrder: false, shippingCents: 120, lines: [line("a", "arepas", 2, 350)], ...over });

describe("normalizeCode", () => {
  it("quita espacios y pasa a mayúsculas", () => expect(normalizeCode("  nami10 ")).toBe("NAMI10"));
});
describe("bogoSavings", () => {
  it("regala la unidad más barata de cada par", () => {
    expect(bogoSavings([350, 350])).toBe(350);
    expect(bogoSavings([380, 280])).toBe(280);
    expect(bogoSavings([350, 280, 380])).toBe(350); // pares: 380+350 → gratis 350; sobra 280
    expect(bogoSavings([100, 200, 300, 400])).toBe(300 + 100);
  });
  it("una sola unidad no ahorra nada", () => expect(bogoSavings([500])).toBe(0));
});
describe("applyCoupon", () => {
  it("porcentaje sobre el subtotal, redondeado hacia abajo", () => {
    expect(applyCoupon(rule({ percent: 10 }), ctx())).toEqual({ ok: true, discountCents: 70, shippingDiscountCents: 0 });
    expect(applyCoupon(rule({ percent: 15 }), ctx({ lines: [line("a", "x", 1, 333)] }))).toMatchObject({ discountCents: 49 });
  });
  it("monto fijo, sin pasarse del subtotal", () => {
    expect(applyCoupon(rule({ amountCents: 200 }), ctx())).toMatchObject({ discountCents: 200 });
    expect(applyCoupon(rule({ amountCents: 5000 }), ctx())).toMatchObject({ discountCents: 700 });
  });
  it("envío gratis descuenta todo el envío", () => {
    expect(applyCoupon(rule({ freeShipping: true }), ctx())).toEqual({ ok: true, discountCents: 0, shippingDiscountCents: 120 });
  });
  it("envío gratis con un envío ya en cero no sirve", () => {
    expect(applyCoupon(rule({ freeShipping: true }), ctx({ shippingCents: 0 }))).toMatchObject({ ok: false, code: "COUPON_NOT_APPLICABLE" });
  });
  it("porcentaje y envío gratis se combinan", () => {
    expect(applyCoupon(rule({ percent: 10, freeShipping: true }), ctx())).toEqual({ ok: true, discountCents: 70, shippingDiscountCents: 120 });
  });
  it("vence", () => {
    expect(applyCoupon(rule({ percent: 10, expiresAt: 999 }), ctx())).toMatchObject({ ok: false, code: "COUPON_EXPIRED" });
    expect(applyCoupon(rule({ percent: 10, expiresAt: 1000 }), ctx()).ok).toBe(true);
  });
  it("pide un subtotal mínimo y dice cuánto falta", () => {
    const r = applyCoupon(rule({ percent: 10, minSubtotalCents: 1000 }), ctx());
    expect(r).toMatchObject({ ok: false, code: "COUPON_MIN_NOT_MET" });
    expect(r.ok ? "" : r.message).toContain("$ 3,00");
  });
  it("un cupón de una tienda solo cuenta esa tienda", () => {
    const two = ctx({ lines: [line("a", "x", 1, 1000), line("b", "x", 1, 500)] });
    expect(applyCoupon(rule({ percent: 10, storeSlug: "b" }), two)).toMatchObject({ discountCents: 50 });
    expect(applyCoupon(rule({ percent: 10, storeSlug: "z" }), two)).toMatchObject({ ok: false, code: "COUPON_NOT_APPLICABLE" });
    expect(applyCoupon(rule({ percent: 10, storeSlug: "b", minSubtotalCents: 800 }), two)).toMatchObject({ code: "COUPON_MIN_NOT_MET" });
  });
  it("solo primer pedido", () => {
    expect(applyCoupon(rule({ freeShipping: true, firstOrderOnly: true }), ctx({ firstOrder: true })).ok).toBe(true);
    expect(applyCoupon(rule({ freeShipping: true, firstOrderOnly: true }), ctx({ firstOrder: false }))).toMatchObject({ code: "COUPON_NOT_APPLICABLE" });
  });
  it("2x1 en una sección de la tienda del cupón", () => {
    const r = rule({ bogoSection: "arepas", storeSlug: "a" });
    const lines = [line("a", "arepas", 1, 350), line("a", "arepas", 1, 280), line("a", "bebidas", 3, 100), line("b", "arepas", 2, 999)];
    expect(applyCoupon(r, ctx({ lines }))).toEqual({ ok: true, discountCents: 280, shippingDiscountCents: 0 });
    expect(applyCoupon(r, ctx({ lines: [line("a", "arepas", 1, 350)] }))).toMatchObject({ ok: false, code: "COUPON_NOT_APPLICABLE" });
  });
});
