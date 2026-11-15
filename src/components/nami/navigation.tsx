"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState } from "react";
import { cx } from "./cx";
import { Icon, type IconName } from "./icon";
import { SearchBar } from "./client";
import { CartLink } from "@/components/cart/CartLink";
import { CurrencyToggle } from "@/components/shell/CurrencyToggle";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { NavClock } from "@/components/shell/NavClock";

type AppHeaderProps = {
  address?: string;
  placeholder?: string;
  unread?: boolean;
  search?: boolean;
  onAddress?: () => void;
  className?: string;
};

/** Header rojo móvil (< 1024px). */
export function AppHeader({ address = "Elegir dirección", placeholder, unread, search = true, onAddress, className }: AppHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Manejo de Escape y bloqueo de scroll mientras el menú esté abierto
  useEffect(() => {
    if (!isMenuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isMenuOpen]);

  return (
    <>
      <header className={cx("nm-header", className)}>
        <div className="nm-header__row">
          <Link href="/" className="nm-header__logo-link" aria-label="Ir al inicio de Ñami">
            <img className="nm-header__logo" src="/brand/nami-logo.png" alt="Ñami" />
          </Link>
          <button className="nm-header__addr" type="button" onClick={onAddress} aria-label={`Dirección: ${address}`}>
            <Icon name="pin" />
            <span>{address}</span>
            <Icon name="chevronDown" />
          </button>
          <div className="nm-header__actions">
            <CartLink variant="header" />
            <button
              className="nm-iconbtn"
              type="button"
              aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={isMenuOpen}
              aria-controls="nm-mobile-drawer"
              onClick={() => setIsMenuOpen((prev) => !prev)}
            >
              <Icon name={isMenuOpen ? "close" : "menu"} />
              {unread ? <i className="nm-iconbtn__dot" /> : null}
            </button>
          </div>
        </div>
        {search ? <SearchBar placeholder={placeholder} /> : null}
      </header>

      {/* Menú lateral desplegable (hamburguesa) en móvil */}
      {isMenuOpen ? (
        <div className="nm-drawer-backdrop" onClick={() => setIsMenuOpen(false)}>
          <div
            id="nm-mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Menú principal de opciones"
            className="nm-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="nm-drawer__header">
              <div className="flex items-center gap-2">
                <img className="h-6 w-auto" src="/brand/nami-logo.png" alt="Ñami" />
                <span className="font-display font-black text-title-md text-ink">Menú</span>
              </div>
              <button
                type="button"
                className="nm-iconbtn !border-0 text-ink-muted hover:text-ink"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Cerrar menú"
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="nm-drawer__body">
              {/* Opciones rápidas que antes saturaban el navbar */}
              <div className="nm-drawer__section">
                <span className="nm-drawer__section-title">Ajustes y simulación</span>
                <div className="nm-drawer__card">
                  <div className="nm-drawer__row">
                    <div className="flex flex-col">
                      <span className="text-body-strong font-bold text-ink">Moneda</span>
                      <span className="text-caption text-ink-muted">Precios en USD ($) o Bs.</span>
                    </div>
                    <CurrencyToggle />
                  </div>

                  <div className="nm-drawer__row">
                    <div className="flex flex-col">
                      <span className="text-body-strong font-bold text-ink">Modo visual</span>
                      <span className="text-caption text-ink-muted">Tema claro u oscuro</span>
                    </div>
                    <ThemeToggle />
                  </div>

                  <div className="nm-drawer__row">
                    <div className="flex flex-col">
                      <span className="text-body-strong font-bold text-ink">Hora de Caracas</span>
                      <span className="text-caption text-ink-muted">Simulador de turnos (demo)</span>
                    </div>
                    <NavClock variant="header" />
                  </div>

                  <div className="nm-drawer__row">
                    <div className="flex flex-col">
                      <span className="text-body-strong font-bold text-ink">Notificaciones</span>
                      <span className="text-caption text-ink-muted">
                        {unread ? "Tienes avisos activos" : "Sin avisos pendientes"}
                      </span>
                    </div>
                    <button className="nm-iconbtn" type="button" aria-label="Notificaciones">
                      <Icon name="bell" />
                      {unread ? <i className="nm-iconbtn__dot" /> : null}
                    </button>
                  </div>
                </div>
              </div>

              {/* Navegación principal */}
              <div className="nm-drawer__section">
                <span className="nm-drawer__section-title">Explorar</span>
                <nav className="flex flex-col gap-1" aria-label="Secciones principales">
                  <Link href="/" className="nm-drawer__link" onClick={() => setIsMenuOpen(false)}>
                    <Icon name="home" />
                    <span>Inicio</span>
                  </Link>
                  <Link href="/mercados" className="nm-drawer__link" onClick={() => setIsMenuOpen(false)}>
                    <Icon name="basket" />
                    <span>Mercados</span>
                  </Link>
                  <Link href="/ofertas" className="nm-drawer__link" onClick={() => setIsMenuOpen(false)}>
                    <Icon name="percent" />
                    <span>Promos</span>
                  </Link>
                  <Link href="/pedidos" className="nm-drawer__link" onClick={() => setIsMenuOpen(false)}>
                    <Icon name="receipt" />
                    <span>Pedidos</span>
                  </Link>
                  <Link href="/perfil" className="nm-drawer__link" onClick={() => setIsMenuOpen(false)}>
                    <Icon name="user" />
                    <span>Perfil</span>
                  </Link>
                </nav>
              </div>

              {/* Demostración y administración */}
              <div className="nm-drawer__section">
                <span className="nm-drawer__section-title">Demostración</span>
                <nav className="flex flex-col gap-1" aria-label="Herramientas de demostración">
                  <Link href="/tienda-admin" className="nm-drawer__link justify-between" onClick={() => setIsMenuOpen(false)}>
                    <span className="flex items-center gap-3">
                      <Icon name="utensils" />
                      <span>Panel de tienda</span>
                    </span>
                    <span className="nm-badge nm-badge--promo text-[10px] py-0.5 px-2">Demo</span>
                  </Link>
                  <Link href="/demo" className="nm-drawer__link" onClick={() => setIsMenuOpen(false)}>
                    <Icon name="repeat" />
                    <span>Pantalla dividida</span>
                  </Link>
                  <Link href="/acerca" className="nm-drawer__link" onClick={() => setIsMenuOpen(false)}>
                    <Icon name="star" />
                    <span>Acerca del proyecto</span>
                  </Link>
                </nav>
              </div>
            </div>

            <div className="nm-drawer__footer">
              <span className="block text-caption font-semibold text-ink-muted">Ñami · Demo de portafolio</span>
              <span className="block text-[11px] text-ink-muted/80">Sin pagos reales · Caracas, Venezuela</span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

type TopBarProps = {
  address?: string;
  placeholder?: string;
  logoSrc?: string;
  ordersHref?: string;
  onAddress?: () => void;
  className?: string;
};

/** Barra superior de escritorio (>= 1024px). */
export function TopBar({
  address = "Elegir dirección",
  placeholder,
  logoSrc = "/brand/nami-logo.png",
  ordersHref = "/pedidos",
  onAddress,
  className,
}: TopBarProps) {
  return (
    <header className={cx("nm-topbar", className)}>
      <div className="nm-topbar__inner">
        <div className="nm-topbar__left">
          <Link href="/" className="nm-topbar__logo-link" aria-label="Ir al inicio de Ñami">
            <img className="nm-topbar__logo" src={logoSrc} alt="Ñami" />
          </Link>
          <button className="nm-topbar__addr" type="button" onClick={onAddress} aria-label={`Dirección de entrega: ${address}`}>
            <Icon name="pin" />
            <span>{address}</span>
            <Icon name="chevronDown" />
          </button>
        </div>

        <div className="nm-topbar__center">
          <SearchBar placeholder={placeholder} />
        </div>

        <div className="nm-topbar__actions">
          <NavClock variant="topbar" />
          <Link className="nm-topbar__link" href={ordersHref}>Mis pedidos</Link>
          <CurrencyToggle />
          <ThemeToggle />
          <CartLink variant="topbar" />
        </div>
      </div>
    </header>
  );
}

export type NavItem = { icon: IconName; label: string; href: string };

const DEFAULT_NAV: NavItem[] = [
  { icon: "home", label: "Inicio", href: "/" },
  { icon: "basket", label: "Mercados", href: "/mercados" },
  { icon: "percent", label: "Promos", href: "/ofertas" },
  { icon: "receipt", label: "Pedidos", href: "/pedidos" },
  { icon: "user", label: "Perfil", href: "/perfil" },
];

/** Barra inferior móvil con cinco destinos. */
export function BottomNav({ active = 0, items = DEFAULT_NAV, className }: { active?: number; items?: NavItem[]; className?: string }) {
  return (
    <nav className={cx("nm-nav", className)} aria-label="Principal">
      {items.map((it, i) => (
        <Link key={it.href} className="nm-nav__item" href={it.href} aria-current={i === active ? "page" : undefined}>
          <span className="nm-nav__pill"><Icon name={it.icon} /></span>
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
