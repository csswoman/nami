import { z } from "zod";
/**
 * Sustituciones en mercado: qué hacer con un producto si no hay. El cliente lo elige al pedir;
 * la tienda lo resuelve desde su panel («No hay»). Funciones y tipos puros, sin BD.
 */
export const substitutionSchema = z
  .object({
    /** remove = quitarlo del pedido · similar = la tienda elige algo parecido · product = este producto de la tienda. */
    kind: z.enum(["remove", "similar", "product"]),
    product: z.string().min(1).max(100).optional(),
  })
  .refine((v) => v.kind !== "product" || Boolean(v.product), { message: "Elige el producto de reemplazo.", path: ["product"] });
export type Substitution = z.infer<typeof substitutionSchema>;
/** Lo que pasó con un producto sin stock. */
export type Resolution = { kind: "removed" } | { kind: "replaced"; fromName: string; fromSlug: string; fromUnitCents: number };
export const SUBSTITUTION_LABELS: Record<Substitution["kind"], string> = {
  similar: "Cambiar por algo parecido",
  remove: "Quitarlo del pedido",
  product: "Elegir otro producto",
};
/** El reemplazo nunca cuesta más que lo que el cliente iba a pagar; si es más barato, se cobra lo más barato. */
export const replacementUnitCents = (originalCents: number, replacementCents: number) => Math.min(originalCents, replacementCents);
/** Línea para mostrar al cliente: "Harina PAN → Harina Juana" o "Sin stock: Harina PAN, lo quitamos". */
export function describeChange(item: { productName: string; resolution: Resolution | null }): string | null {
  const r = item.resolution;
  if (!r) return null;
  return r.kind === "removed" ? `Sin stock: ${item.productName}, lo quitamos del pedido.` : `Sin stock: ${r.fromName}. Lo cambiamos por ${item.productName}.`;
}
export type TotalsInput = { subtotalCents: number; shippingCents: number; tipCents: number; discountCents: number };
/** Totales después de quitar o cambiar productos: el descuento nunca supera lo que se paga por productos y envío. */
export function totalsAfterChange(t: TotalsInput): { discountCents: number; totalCents: number } {
  const discountCents = Math.min(t.discountCents, t.subtotalCents + t.shippingCents);
  return { discountCents, totalCents: t.subtotalCents + t.shippingCents + t.tipCents - discountCents };
}
