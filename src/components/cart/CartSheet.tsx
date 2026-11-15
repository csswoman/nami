"use client";
import { useEffect } from "react";
import { CartPanel } from "@/components/cart/CartPanel";
import { useCartStore } from "@/lib/cart/store";

/** Hoja del carrito que se abre desde cualquier pantalla (p. ej. al repetir un pedido). */
export function CartSheet() {
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeCart]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center desktop:items-start desktop:justify-end desktop:p-6 desktop:pt-20">
      <button type="button" aria-label="Cerrar carrito" onClick={closeCart} className="absolute inset-0 cursor-default bg-ink/40" />
      <div role="dialog" aria-modal="true" aria-label="Tu carrito" className="relative w-full desktop:w-auto">
        <CartPanel onNavigate={closeCart} />
      </div>
    </div>
  );
}
