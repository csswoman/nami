import { z } from "zod";
import { STOP_ACTIONS } from "./orders/stop-machine";
/** Entradas del panel de tienda (cuerpos JSON de `/api/tienda-admin/**`). */
export const MAX_PRICE_CENTS = 100_000;
export const stopActionSchema = z.object({
  action: z.enum(STOP_ACTIONS as unknown as [string, ...string[]], { error: "Falta una acción válida: aceptar, rechazar, preparar o listo." }),
  reason: z.string().max(200, "El motivo admite hasta 200 caracteres.").optional(),
});
export const openSchema = z.object({ open: z.boolean({ error: "Falta `open` (true o false)." }) });
export const productPatchSchema = z
  .object({
    available: z.boolean().optional(),
    priceCents: z.number().int("El precio va en centavos enteros.").min(1, "El precio mínimo es $ 0,01.").max(MAX_PRICE_CENTS, `El precio máximo es $ ${MAX_PRICE_CENTS / 100}.`).optional(),
  })
  .refine((v) => v.available !== undefined || v.priceCents !== undefined, { message: "No hay nada que cambiar." });
export const hoursSchema = z.object({
  schedule: z.array(z.object({ day: z.number().int(), opensAt: z.number().int(), closesAt: z.number().int() })).max(21, "Demasiados turnos."),
});
export const outOfStockSchema = z.object({ replacement: z.string().min(1).max(100).optional() });
