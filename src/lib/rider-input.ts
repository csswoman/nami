import { z } from "zod";
/** Lo que manda la app del repartidor: tomar el pedido, recogerlo en la tienda o avisar que llegó. */
export const RIDER_ACTIONS = ["tomar", "recoger", "llegue"] as const;
export type RiderAction = (typeof RIDER_ACTIONS)[number];
export const riderActionSchema = z.object({ action: z.enum(RIDER_ACTIONS) });
