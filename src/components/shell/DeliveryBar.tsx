import Link from "next/link";
import { Icon } from "@/components/nami";
import type { Zone } from "@/lib/geo";
/** «Entregando en Altamira · Cambiar»: la zona del mapa con la que se filtran las tiendas y se calcula el envío. */
export function DeliveryBar({ zone, hidden = 0 }: { zone: Zone | null; hidden?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-surface-tile px-4 py-3 text-caption [&_.nm-icon]:size-4" data-testid="delivery-bar">
      <Icon name="pin" />
      <span className="font-bold">{zone ? `Entregando en ${zone.name}` : "Tu ubicación está fuera de nuestras zonas de entrega"}</span>
      {zone && hidden > 0 ? <span className="text-ink-muted">· {hidden} {hidden === 1 ? "tienda no llega" : "tiendas no llegan"} hasta ahí</span> : null}
      <Link href="/direccion" className="ml-auto font-bold text-primary-text underline">{zone ? "Cambiar" : "Elegir otra ubicación"}</Link>
    </div>
  );
}
