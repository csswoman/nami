/** Pantalla dividida (/demo): cliente y panel de tienda lado a lado, cada uno en un iframe. */

/** Valor de `?vista=` con el que la pantalla dividida embebe el panel (sin barras ni selector de tienda). */
export const SPLIT_VIEW = "dividida";

/** Mensaje que el panel embebido le manda a la pantalla dividida cuando cambia algo que el cliente ve. */
export const PANEL_CHANGED_MESSAGE = "nami:panel-changed";

/** URL de la tienda vista como cliente. */
export const clientHrefOf = (slug: string, kind: "restaurante" | "mercado" | undefined) => (kind === "mercado" ? `/mercado/${slug}` : `/tienda/${slug}`);

/** URL del panel de la tienda, embebido o no. */
export const panelHrefOf = (slug: string, embedded = false) => `/tienda-admin/${slug}${embedded ? `?vista=${SPLIT_VIEW}` : ""}`;
