"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/nami";
import { CartPanel } from "@/components/cart/CartPanel";
import { useCart } from "@/lib/cart/hooks";

/** Botón de carrito de las barras con popover flotante al pasar el cursor (hover). */
export function CartLink({ variant }: { variant: "topbar" | "header" }) {
  const { count } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div
      className="nm-cart-popover-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {variant === "header" ? (
        <Link
          href="/carrito"
          onClick={(e) => {
            if (window.matchMedia("(max-width: 1023px)").matches && count > 0) {
              e.preventDefault();
              setIsOpen((v) => !v);
            }
          }}
          className="nm-iconbtn"
          aria-label={count ? `Carrito, ${count} productos` : "Carrito"}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
        >
          <Icon name="cart" />
          {count ? (
            <span className="nm-iconbtn__badge" aria-hidden="true">
              {count > 99 ? "99+" : count}
            </span>
          ) : null}
        </Link>
      ) : (
        <Link
          href="/carrito"
          className="nm-topbar__cart"
          aria-label={`Carrito, ${count} productos`}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
        >
          <Icon name="cart" />
          <span>Carrito</span>
          <span className="nm-topbar__count">{count}</span>
        </Link>
      )}

      {/* Popover flotante al pasar el mouse (hover) */}
      {isOpen ? (
        <div className="nm-cart-popover" role="dialog" aria-label="Vista previa del carrito">
          <CartPanel onNavigate={() => setIsOpen(false)} />
        </div>
      ) : null}
    </div>
  );
}
