/**
 * Pedidos programados: cuando una tienda está cerrada, el pedido se hace igual y queda para su próxima apertura.
 * Funciones puras (sin estado), también válidas en el cliente.
 */

/** "Abre mañana a las 6:00 a. m." / "Abre a las 5:00 p. m." → próxima hora de apertura (ms), o null si no se entiende. */
export function nextOpening(opensAt: string, now: number): number | null {
  const m = /(\d{1,2}):(\d{2})\s*([ap])\./i.exec(opensAt);
  if (!m) return null;
  let hour = Number(m[1]) % 12;
  if (m[3].toLowerCase() === "p") hour += 12;
  const d = new Date(now);
  d.setHours(hour, Number(m[2]), 0, 0);
  const tomorrow = /mañana/i.test(opensAt);
  if (tomorrow || d.getTime() <= now) d.setDate(d.getDate() + 1);
  return d.getTime();
}

type StoreLike = { open?: boolean; opensAt?: string };

/** Hora a la que se puede entregar un pedido con estas tiendas: la apertura más tardía de las cerradas, o null si todas están abiertas. */
export function scheduledFor(stores: StoreLike[], now: number): number | null {
  const times = stores.filter((s) => s.open === false && s.opensAt).map((s) => nextOpening(s.opensAt!, now)).filter((t): t is number => t != null);
  return times.length ? Math.max(...times) : null;
}
