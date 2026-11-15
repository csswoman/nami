/** Clave de una línea del carrito: el mismo producto con otra nota u otras opciones es otra línea. */
export const lineKey = (productId: string, note?: string) => `${productId}|${note ?? ""}`;
