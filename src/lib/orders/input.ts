import { z } from "zod";

/**
 * Lo único que manda el cliente para crear un pedido: ids, cantidades, opciones, nota, propina,
 * método de pago y dirección. Los precios, el envío, los totales y la tasa los calcula el servidor.
 */
export const orderInputSchema = z.object({
  delivery: z.enum(["separate", "combined"]),
  tipCents: z.number().int().min(0).max(10_000),
  payment: z.enum(["movil", "zelle", "efectivo"]),
  address: z.object({
    name: z.string().trim().max(60),
    line: z.string().trim().min(5).max(200),
    reference: z.string().trim().max(200),
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
  | "INTERNAL";
export type ApiError = { error: { code: ApiErrorCode; message: string } };
