import Link from "next/link";
import type { ReactNode } from "react";
import { CurrencyToggle } from "@/components/shell/CurrencyToggle";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { getDeliveryContext } from "@/server/prefs";
import { SPOTS } from "@/lib/demo/direcciones";
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

export async function AppShell({ children, activeNav = 0, mobileHeader = true, bottomNav = true, address: addressProp, topBar = "full" }: AppShellProps) {
  // Única dirección visible de la app: la zona va primero para que no se pierda al truncarse.
  // Con `address` explícita no se lee la cookie: así el skeleton de loading.tsx se prerenderiza.
  const zone = addressProp === undefined ? (await getDeliveryContext()).zone : null;
  const spot = SPOTS.find((s) => s.zone === zone?.slug);
  const address = addressProp ?? (zone ? `${zone.name}${spot ? ` · ${spot.addr.split(",")[0]}` : ""}` : "Elegir dirección");
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-pill focus:bg-primary focus:px-4 focus:py-2.5 focus:font-bold focus:text-on-primary">Saltar al contenido</a>
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

      <main id="contenido" className={`flex-1 desktop:pb-12 ${bottomNav ? "pb-24" : "pb-28"}`}>{children}</main>

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
