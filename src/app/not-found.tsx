import Link from "next/link";
import { StatusScreen } from "@/components/shell/StatusScreen";

export const metadata = { title: "Página no encontrada · Ñami" };

export default function NotFound() {
  return (
    <StatusScreen
      badge="Error 404"
      title="Esta página se perdió en la cola de la Francisco de Miranda"
      text="No encontramos lo que buscabas. Puede que el enlace esté roto o la tienda ya no exista."
      primary={<Link href="/" className="nm-btn nm-btn--primary">Volver al inicio</Link>}
      secondary={{ href: "/busqueda", label: "Buscar algo rico" }}
    />
  );
}
