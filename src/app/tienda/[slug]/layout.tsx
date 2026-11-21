import type { ReactNode } from "react";

/** `modal` es la ranura donde se abre el detalle de producto encima de la tienda (ruta interceptada). */
export default function TiendaLayout({ children, modal }: { children: ReactNode; modal: ReactNode }) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
