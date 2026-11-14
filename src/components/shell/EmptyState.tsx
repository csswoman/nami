/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { ReactNode } from "react";

type Action = { href: string; label: string };

/** Estado vacío / error: guacamaya en círculo cálido, título, texto y hasta dos acciones. */
export function EmptyState({ title, text, primary, secondary, image = "/brand/guacamaya.png", children }: {
  title: string; text: string; primary?: Action; secondary?: Action; image?: string; children?: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3.5 px-8 py-10 text-center desktop:py-20">
      <div className="grid size-60 place-items-center rounded-pill bg-surface-warm">
        <img src={image} alt="" className="h-52 w-auto" />
      </div>
      <h2 className="mt-2 font-display text-[24px] leading-7.5 font-extrabold">{title}</h2>
      <p className="text-body text-ink-muted">{text}</p>
      {children}
      {primary ? <Link href={primary.href} className="nm-btn nm-btn--primary mt-2 self-stretch">{primary.label}</Link> : null}
      {secondary ? <Link href={secondary.href} className="nm-btn nm-btn--ghost self-stretch">{secondary.label}</Link> : null}
    </div>
  );
}
