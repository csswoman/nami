import { z } from "zod";
/** Etiquetas que el cliente puede marcar sobre la entrega. */
export const REVIEW_TAGS = ["Llegó rápido", "Muy amable", "Bien empacado", "Llegó caliente"] as const;
export const reviewInputSchema = z.object({
  rating: z.number({ error: "Elige de 1 a 5 estrellas." }).int("Elige de 1 a 5 estrellas.").min(1, "Elige de 1 a 5 estrellas.").max(5, "Elige de 1 a 5 estrellas."),
  tags: z.array(z.enum(REVIEW_TAGS)).max(REVIEW_TAGS.length).default([]),
  comment: z.string().trim().max(300, "El comentario admite hasta 300 caracteres.").optional(),
});
export type ReviewInput = z.infer<typeof reviewInputSchema>;
/** Calificaciones de demostración que cuentan como "ya existentes": una tienda con 4,8 no baja a 1,0 por una sola reseña. */
export const RATING_PRIOR_WEIGHT = 10;
/**
 * Calificación mostrada: el promedio de las reseñas reales, mezclado con la calificación de partida de la tienda.
 * Sin reseñas queda la de partida; sin calificación de partida, el promedio de las reseñas.
 */
export function blendRating(base: number | null, count: number, sum: number): number | null {
  if (count <= 0) return base;
  if (base === null) return sum / count;
  return (base * RATING_PRIOR_WEIGHT + sum) / (RATING_PRIOR_WEIGHT + count);
}
/** 4.76 → "4,8" (coma decimal, como el resto de la app). */
export const formatRating = (n: number) => n.toFixed(1).replace(".", ",");
