"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/nami";
import { MinNotice } from "@/components/cart/MinNotice";
import { Stepper } from "@/components/shell/Stepper";
import { useCart } from "@/lib/cart/hooks";
import { storeHref } from "@/lib/cart/meta";
import { minOrderShortfall, useCartStore } from "@/lib/cart/store";
import { DEMO_RATE } from "@/lib/demo/home";
import { formatUsd, formatVes } from "@/lib/money";

/** Botón de carrito de las barras con popover flotante al pasar el cursor (hover). */
export function CartLink({ variant }: { variant: "topbar" | "header" }) {
  const { ready, store, lines, count, subtotal } = useCart();
  const setQty = useCartStore((s) => s.setQty);
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

  const shortfall = store ? minOrderShortfall(store, subtotal) : 0;
  const total = subtotal + (store && count ? store.feeCents : 0);

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
        <div
          className="nm-cart-popover"
          role="dialog"
          aria-label="Vista previa del carrito"
        >
          <div className="nm-cart-popover__panel">
            {/* Header del popover */}
            <div className="nm-cart-popover__header">
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-[16px] leading-5">Tu carrito</span>
                <span className="nm-badge nm-badge--primary">{count}</span>
              </div>
              {count > 0 && store ? (
                <span className="text-caption text-ink-muted truncate max-w-[150px] font-medium">
                  {store.name}
                </span>
              ) : null}
            </div>

            {/* Contenido según si hay productos o no */}
            {!ready || count === 0 || !store ? (
              <div className="nm-cart-popover__empty">
                <div className="grid size-11 place-items-center rounded-pill bg-surface-tile text-ink-muted [&_.nm-icon]:size-5">
                  <Icon name="cart" />
                </div>
                <p className="text-body-strong font-bold text-[14px]">Tu carrito está vacío</p>
                <p className="text-caption text-ink-muted text-center max-w-[220px]">
                  Pasa por nuestras tiendas y toca + para agregar lo que te provoque.
                </p>
                <Link
                  href="/listado"
                  onClick={() => setIsOpen(false)}
                  className="nm-btn nm-btn--secondary nm-btn--sm mt-1"
                >
                  Ver restaurantes
                </Link>
              </div>
            ) : (
              <>
                {/* Lista interactiva de productos */}
                <ul className="nm-cart-popover__list">
                  {lines.map((l) => (
                    <li key={l.key} className="nm-cart-popover__item">
                      <span className="nm-cart-popover__item-art">
                        <Icon name={l.icon} />
                      </span>
                      <div className="flex flex-col min-w-0 grow">
                        <span className="text-body-strong font-semibold truncate text-[13px] leading-4">
                          {l.name}
                        </span>
                        <span className="text-price font-bold text-[13px]">
                          {formatUsd(l.qty * l.unitCents)}
                        </span>
                      </div>
                      <Stepper
                        qty={l.qty}
                        name={l.name}
                        onMinus={() => setQty(l.key, l.qty - 1)}
                        onPlus={() => setQty(l.key, l.qty + 1)}
                      />
                    </li>
                  ))}
                </ul>

                {/* Aviso si falta para pedido mínimo */}
                {shortfall > 0 ? (
                  <div className="px-3.5 pt-2">
                    <MinNotice shortfall={shortfall} min={store.minOrderCents} href={storeHref(store)} />
                  </div>
                ) : null}

                {/* Resumen de montos */}
                <div className="nm-cart-popover__summary">
                  <div className="flex justify-between text-caption">
                    <span>Subtotal</span>
                    <span className="font-semibold">{formatUsd(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-caption text-ink-muted">
                    <span>Envío</span>
                    <span>{formatUsd(store.feeCents)}</span>
                  </div>
                  <div className="flex items-baseline justify-between border-t border-dashed border-border pt-1.5">
                    <span className="text-body-strong font-bold text-[14px]">Total</span>
                    <div className="flex flex-col items-end">
                      <span className="text-title-md font-extrabold text-[16px] leading-5">
                        {formatUsd(total)}
                      </span>
                      <span className="text-caption text-ink-muted text-[11px]">
                        {formatVes(total, DEMO_RATE)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="nm-cart-popover__footer">
                  {shortfall === 0 ? (
                    <Link
                      href="/checkout"
                      onClick={() => setIsOpen(false)}
                      className="nm-btn nm-btn--primary nm-btn--block nm-btn--sm"
                    >
                      Ir a pagar · {formatUsd(total)}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="nm-btn nm-btn--primary nm-btn--block nm-btn--sm"
                    >
                      Ir a pagar (mín. {formatUsd(store.minOrderCents)})
                    </button>
                  )}

                  <Link
                    href="/carrito"
                    onClick={() => setIsOpen(false)}
                    className="nm-btn nm-btn--secondary nm-btn--block nm-btn--sm"
                  >
                    Ver carrito completo
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
