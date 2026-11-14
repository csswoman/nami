"use client";

import { StatusScreen } from "@/components/shell/StatusScreen";

/** Límite de error de la app: algo falló al cargar (red, servidor). */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <StatusScreen
      badge="Sin conexión"
      title="Se nos fue la señal"
      text="Revisa tu internet y vuelve a intentarlo. Tu carrito sigue guardado."
      primary={<button type="button" onClick={reset} className="nm-btn nm-btn--primary">Reintentar</button>}
    />
  );
}
