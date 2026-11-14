import Link from "next/link";
import { formatUsd } from "@/lib/money";

/** Aviso de pedido mínimo: cuánto falta y, si hay `href`, enlace para volver al menú. */
export function MinNotice({ shortfall, min, href }: { shortfall: number; min: number; href?: string }) {
  return (
    <p role="status" className="rounded-md bg-surface-warm px-4 py-3 text-center text-caption">
      Te faltan <b>{formatUsd(shortfall)}</b> para el pedido mínimo de {formatUsd(min)}.
      {href ? <> <Link href={href} className="font-bold text-primary-text">Agregar más</Link></> : null}
    </p>
  );
}
