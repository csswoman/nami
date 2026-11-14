/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { cx } from "./cx";
import { Icon, type IconName } from "./icon";
import { SearchBar } from "./client";
import { CartLink } from "@/components/cart/CartLink";
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
  return (
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
          <NavClock variant="header" />
          <ThemeToggle />
          <button className="nm-iconbtn" type="button" aria-label="Notificaciones">
            <Icon name="bell" />
            {unread ? <i className="nm-iconbtn__dot" /> : null}
          </button>
          <CartLink variant="header" />
        </div>
      </div>
      {search ? <SearchBar placeholder={placeholder} /> : null}
    </header>
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
  { icon: "percent", label: "Promociones", href: "/ofertas" },
  { icon: "receipt", label: "Pedidos", href: "/pedidos" },
  { icon: "user", label: "Mi perfil", href: "/perfil" },
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
