import Link from "next/link";
import type { ReactNode } from "react";
import { CurrencyToggle } from "@/components/shell/CurrencyToggle";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { AppHeader, BottomNav, TopBar } from "@/components/nami";

type AppShellProps = {
  children: ReactNode;
  /** Pestaña activa de la barra inferior (0 Inicio · 1 Mercados · 2 Promociones · 3 Pedidos · 4 Perfil). */
  activeNav?: number;
  /** Oculta el header de móvil cuando la pantalla trae el suyo (tienda, checkout…). */
  mobileHeader?: boolean;
  /** Oculta la barra inferior de móvil (pantallas con su propia barra de acción). */
  bottomNav?: boolean;
  address?: string;
  /** "logo": barra de escritorio solo con el logo (pantallas de tarea corta). */
  topBar?: "full" | "logo";
};

export function AppShell({ children, activeNav = 0, mobileHeader = true, bottomNav = true, address = "Av. Francisco de Miranda, Chacao", topBar = "full" }: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      {mobileHeader ? (
        <div className="relative z-30 desktop:hidden">
          <AppHeader address={address} placeholder="Arepas, perros, harina de maíz…" unread />
        </div>
      ) : null}
      <div className="relative z-30 hidden desktop:block">
        {topBar === "logo" ? (
          <header className="nm-topbar">
            <div className="nm-topbar__inner">
              <Link href="/" className="nm-topbar__logo-link" aria-label="Ir al inicio de Ñami">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="nm-topbar__logo" src="/brand/nami-logo.png" alt="Ñami" />
              </Link>
              <div className="nm-topbar__actions">
                <CurrencyToggle />
                <ThemeToggle />
              </div>
            </div>
          </header>
        ) : (
          <TopBar address={address} placeholder="Arepas, perros, harina de maíz…" />
        )}
      </div>

      <div className={`flex-1 desktop:pb-12 ${bottomNav ? "pb-24" : "pb-28"}`}>{children}</div>

      <footer className="hidden bg-surface-tile desktop:block">
        <div className="page-x flex items-center gap-6 py-6 text-caption text-ink-muted">
          <span className="grow">Ñami · Demo de portafolio · Sin pagos reales</span>
          <Link href="/tienda-admin" className="font-bold text-ink hover:text-primary-text">Panel de tienda</Link>
          <Link href="/demo" className="font-bold text-ink hover:text-primary-text">Pantalla dividida</Link>
          <Link href="/acerca" className="font-bold text-ink hover:text-primary-text">Acerca del proyecto</Link>
        </div>
      </footer>

      {bottomNav ? (
        <div className="fixed inset-x-0 bottom-0 z-20 desktop:hidden">
          <BottomNav active={activeNav} />
        </div>
      ) : null}
    </div>
  );
}
