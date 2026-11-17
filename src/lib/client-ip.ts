/**
 * IP del cliente a partir de las cabeceras. En Vercel `x-forwarded-for` la pone el propio edge (el cliente no la
 * puede falsificar); el primer valor es el cliente. En local no hay proxy: todo cuenta como "local".
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "local";
}
