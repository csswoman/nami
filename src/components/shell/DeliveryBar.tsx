import Link from "next/link";
import { Icon } from "@/components/nami";
import type { Zone } from "@/lib/geo";
/**
 * Aviso de cobertura: solo aparece si hay algo que decir (tiendas que no llegan o ubicación fuera de zona).
 * La dirección en sí ya está en el header; aquí no se repite.
 */
export function DeliveryBar({ zone, hidden = 0 }: { zone: Zone | null; hidden?: number }) {
  if (zone && hidden === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-surface-tile px-4 py-3 text-caption [&_.nm-icon]:size-4" data-testid="delivery-bar">
      <Icon name="pin" />
      <span className="font-bold">
        {zone ? `${hidden} ${hidden === 1 ? "tienda no llega" : "tiendas no llegan"} a ${zone.name}` : "Tu ubicación está fuera de nuestras zonas de entrega"}
      </span>
      <Link href="/direccion" className="ml-auto font-bold text-primary-text underline">{zone ? "Cambiar" : "Elegir otra ubicación"}</Link>
    </div>
  );
}
