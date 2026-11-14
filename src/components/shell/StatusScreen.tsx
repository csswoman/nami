/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  badge: string;
  title: string;
  text: string;
  /** Acción principal: enlace o botón (p. ej. "Reintentar"). */
  primary: ReactNode;
  secondary?: { href: string; label: string };
};

/** Pantalla de estado a página completa (404, sin conexión): guacamaya, título y acciones. */
export function StatusScreen({ badge, title, text, primary, secondary }: Props) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 bg-surface px-8 py-12 text-center">
      <span className="rounded-pill bg-surface-tile px-4 py-2 text-caption font-bold text-ink-muted">{badge}</span>
      <span className="grid size-60 place-items-center rounded-pill bg-surface-warm">
        <img src="/brand/guacamaya.png" alt="" className="h-52 w-auto" />
      </span>
      <h1 className="mt-2 font-display text-[30px] leading-9 font-extrabold desktop:text-[36px] desktop:leading-10">{title}</h1>
      <p className="text-body text-ink-muted">{text}</p>
      <div className="mt-2 flex w-full flex-col gap-1">
        {primary}
        {secondary ? <Link href={secondary.href} className="min-h-12 text-button leading-12 text-primary-text">{secondary.label}</Link> : null}
      </div>
    </main>
  );
}
