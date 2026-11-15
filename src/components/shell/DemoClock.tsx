import Link from "next/link";
import { Icon } from "@/components/nami";
import { FRANJAS, type Franja } from "@/lib/demo/franja";
import { FRANJA_CONTENT } from "@/lib/demo/home";

type Props = { franja: Franja; hora: string };

/**
 * Barra del modo demo: las tiendas siguen la hora de Caracas; con esto el visitante
 * cambia de franja sin esperar. Sin JS: cada franja es un enlace a `/?franja=…`.
 */
export function DemoClock({ franja, hora }: Props) {
  const label = FRANJA_CONTENT[franja].label;
  return (
    <div className="flex flex-col gap-3 rounded-lg bg-surface-tile px-4 py-3 desktop:flex-row desktop:items-center desktop:gap-4 desktop:rounded-pill desktop:py-3 desktop:pr-3 desktop:pl-5">
      <div className="flex items-center gap-2">
        <span className="flex grow items-center gap-1.5 text-caption text-ink-muted [&_.nm-icon]:size-4">
          <Icon name="clock" />
          <span><b className="text-ink">{label}</b> · {hora} en Caracas</span>
        </span>
        <span className="text-badge text-ink desktop:hidden">Modo demo</span>
      </div>

      <div role="group" aria-label="Franja horaria" className="scroll-x flex gap-1.5 desktop:ml-auto desktop:overflow-visible">
        <span className="hidden self-center pr-1 text-badge text-ink desktop:block">Modo demo</span>
        {FRANJAS.map((f) => {
          const on = f === franja;
          return (
            <Link
              key={f}
              href={`/?franja=${f}`}
              scroll={false}
              aria-current={on ? "true" : undefined}
              className={`flex min-h-10 shrink-0 items-center rounded-pill px-3.5 text-button ${on ? "bg-primary text-on-primary" : "border border-border bg-surface-tile text-ink"}`}
            >
              {FRANJA_CONTENT[f].label}
            </Link>
          );
        })}
        <Link href="/?franja=real" className="flex min-h-10 shrink-0 items-center px-3 text-button text-primary-text">
          Volver a la hora real
        </Link>
      </div>
    </div>
  );
}
