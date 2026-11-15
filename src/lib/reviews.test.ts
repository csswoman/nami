import { describe, expect, it } from "vitest";
import { blendRating, formatRating, reviewInputSchema } from "./reviews";

describe("blendRating", () => {
  it("sin reseñas deja la calificación de partida", () => {
    expect(blendRating(4.8, 0, 0)).toBe(4.8);
    expect(blendRating(null, 0, 0)).toBeNull();
  });
  it("sin calificación de partida es el promedio de las reseñas", () => {
    expect(blendRating(null, 2, 9)).toBe(4.5);
  });
  it("una reseña mala mueve poco a una tienda con historial, y muchas la mueven más", () => {
    const one = blendRating(4.8, 1, 1)!;
    expect(one).toBeGreaterThan(4.3);
    expect(one).toBeLessThan(4.8);
    expect(blendRating(4.8, 30, 30)!).toBeLessThan(one);
  });
  it("cinco estrellas sube o mantiene", () => {
    expect(blendRating(4.2, 5, 25)!).toBeGreaterThan(4.2);
  });
});
describe("formatRating", () => {
  it("una cifra con coma", () => {
    expect(formatRating(4.76)).toBe("4,8");
    expect(formatRating(5)).toBe("5,0");
  });
});
describe("reviewInputSchema", () => {
  it("acepta calificación, etiquetas y comentario", () => {
    const r = reviewInputSchema.parse({ rating: 5, tags: ["Llegó rápido"], comment: "  Muy rico " });
    expect(r).toEqual({ rating: 5, tags: ["Llegó rápido"], comment: "Muy rico" });
    expect(reviewInputSchema.parse({ rating: 3 }).tags).toEqual([]);
  });
  it("rechaza estrellas fuera de 1-5, etiquetas inventadas y comentarios larguísimos", () => {
    for (const rating of [0, 6, 2.5, "5"]) expect(reviewInputSchema.safeParse({ rating }).success).toBe(false);
    expect(reviewInputSchema.safeParse({ rating: 4, tags: ["Inventada"] }).success).toBe(false);
    expect(reviewInputSchema.safeParse({ rating: 4, comment: "x".repeat(301) }).success).toBe(false);
  });
});
