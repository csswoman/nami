"use client";
import { CartSheet } from "@/components/cart/CartSheet";
import { useCartHydration } from "@/lib/cart/hooks";

/** Monta la lectura del carrito guardado en el navegador y la hoja del carrito. Va una vez, en el layout. */
export function CartProvider() {
  useCartHydration();
  return <CartSheet />;
}
