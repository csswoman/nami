/** Franjas horarias del modo demo. Las tiendas siguen la hora de Caracas (UTC-4). */

export const FRANJAS = ["desayuno", "almuerzo", "merienda", "cena", "noche"] as const;
export type Franja = (typeof FRANJAS)[number];

export function isFranja(value: string | undefined): value is Franja {
  return !!value && (FRANJAS as readonly string[]).includes(value);
}

export function caracasNow(now: number = Date.now()): { franja: Franja; hora: string } {
  const d = new Date(now - 4 * 3600 * 1000);
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  const franja: Franja =
    h >= 6 && h < 11 ? "desayuno" : h >= 11 && h < 15 ? "almuerzo" : h >= 15 && h < 18 ? "merienda" : h >= 18 && h < 22 ? "cena" : "noche";
  const h12 = ((h + 11) % 12) + 1;
  return { franja, hora: `${h12}:${String(m).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}` };
}

/** "7:40 a. m." → minutos desde la medianoche (460). */
export function horaToMinutes(hora: string): number {
  const m = /^(\d{1,2}):(\d{2}) ([ap])\. m\.$/.exec(hora);
  if (!m) return 0;
  return (Number(m[1]) % 12) * 60 + Number(m[2]) + (m[3] === "p" ? 720 : 0);
}

export const FRANJA_COOKIE = "nami_franja";
/** Franja elegida: primero `?franja=` de la URL ("real" fuerza la hora real) y luego la cookie del modo demo. */
export function resolveFranja(param: string | undefined, cookie: string | undefined): Franja | undefined {
  if (param !== undefined) return isFranja(param) ? param : undefined;
  return isFranja(cookie) ? cookie : undefined;
}
