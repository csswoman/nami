import { z } from "zod";
import { substitutionSchema } from "./substitution";

/**
 * Lo único que manda el cliente para crear un pedido: ids, cantidades, opciones, nota, propina,
 * método de pago y dirección. Los precios, el envío, los totales y la tasa los calcula el servidor.
 */
export const orderInputSchema = z.object({
  delivery: z.enum(["separate", "combined"]),
  tipCents: z.number().int().min(0).max(10_000),
  payment: z.enum(["movil", "zelle", "efectivo"]),
  /** Código de cupón; el servidor lo valida y calcula el descuento. */
  coupon: z.string().trim().max(30).optional(),
  /** Hora elegida para programar el pedido (ms epoch, en punto o y media). Sin ella: lo antes posible. */
  scheduledFor: z.number().int().positive().optional(),
  address: z.object({
    name: z.string().trim().max(60),
    line: z.string().trim().min(5).max(200),
    reference: z.string().trim().max(200),
    /** Punto elegido en el mapa. Con él el envío se calcula por distancia; sin él, vale la tarifa base de cada tienda. */
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
  }),
  items: z
    .array(
      z.object({
        store: z.string().min(1).max(100),
        product: z.string().min(1).max(100),
        qty: z.number().int().min(1).max(50),
        /** groupId → ids de opciones elegidas */
        options: z.record(z.string().max(100), z.array(z.string().max(100)).max(20)).optional(),
        note: z.string().trim().max(200).optional(),
        /** Solo mercados: qué hacer si no hay el producto. Sin esto, se quita. */
        substitution: substitutionSchema.optional(),
      }),
    )
    .min(1)
    .max(60),
});
export type OrderInput = z.infer<typeof orderInputSchema>;

export type ApiErrorCode =
  | "INVALID_INPUT"
  | "NO_GUEST_TOKEN"
  | "NOT_FOUND"
  | "STORE_NOT_FOUND"
  | "PRODUCT_NOT_FOUND"
  | "PRODUCT_UNAVAILABLE"
  | "INVALID_OPTIONS"
  | "MIN_ORDER_NOT_MET"
  | "RATE_UNAVAILABLE"
  | "INVALID_TRANSITION"
  | "NOT_CANCELLABLE"
  | "SLOT_UNAVAILABLE"
  | "OUT_OF_COVERAGE"
  | "NOT_REVIEWABLE"
  | "COUPON_INVALID"
  | "COUPON_EXPIRED"
  | "COUPON_NOT_APPLICABLE"
  | "COUPON_MIN_NOT_MET"
  | "INTERNAL";
export type ApiError = { error: { code: ApiErrorCode; message: string } };
