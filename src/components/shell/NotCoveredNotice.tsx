import Link from "next/link";
import { Icon } from "@/components/nami";
import { formatDistance, type Zone } from "@/lib/geo";
import type { StoreSummary } from "@/lib/catalog";
/** Aviso cuando la tienda no llega a la dirección elegida (se puede mirar el menú, pero el pedido no pasa). */
export function NotCoveredNotice({ store, zone }: { store: Pick<StoreSummary, "name" | "delivery">; zone: Zone | null }) {
  if (!store.delivery || store.delivery.covered) return null;
  const far = store.delivery.distanceM;
  return (
    <div role="status" className="flex items-start gap-3 rounded-lg bg-surface-warm p-4 text-caption [&_.nm-icon]:size-5 [&_.nm-icon]:shrink-0" data-testid="not-covered">
      <Icon name="pin" />
      <span>
        <b>{store.name} no llega a {zone ? zone.name : "tu ubicación"}.</b>{" "}
        {far !== null ? `Está a ${formatDistance(far)} por calle y reparte hasta ${formatDistance(store.delivery.maxM)}. ` : "Todavía no repartimos en esa zona. "}
        <Link href="/direccion" className="font-bold text-primary-text underline">Elegir otra dirección</Link>
      </span>
    </div>
  );
}
