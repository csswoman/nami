"use client";

import { useCartHydration } from "@/lib/cart/hooks";

/** Monta la lectura del carrito guardado en el navegador. Va una vez, en el layout. */
export function CartProvider() {
  useCartHydration();
  return null;
}
