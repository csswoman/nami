import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/nami";

/** Botón redondo de la barra móvil (atrás, buscar…). */
export function RoundLink({ href, label, children, onTile = false }: { href: string; label: string; children: ReactNode; onTile?: boolean }) {
  return (
    <Link href={href} aria-label={label} className={`grid size-11 place-items-center rounded-pill text-ink ${onTile ? "bg-surface-raised shadow-card" : "bg-surface-tile"} [&_.nm-icon]:size-5`}>
      {children}
    </Link>
  );
}

export function BackIcon() {
  return (
    <svg className="nm-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
  );
}

/** Barra superior de pantallas interiores en móvil: atrás · título · acción. */
export function ScreenBar({ title, back = "/", action }: { title: string; back?: string; action?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 desktop:hidden">
      <RoundLink href={back} label="Volver"><BackIcon /></RoundLink>
      <h1 className="grow text-center font-display text-title-md">{title}</h1>
      {action ?? <span className="size-11" aria-hidden="true" />}
    </div>
  );
}

export function SearchLink() {
  return <RoundLink href="/busqueda" label="Buscar"><Icon name="search" /></RoundLink>;
}
