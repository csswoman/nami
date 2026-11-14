import { redirect } from "next/navigation";

/** La pestaña Mercados lleva al listado de súper (vertical 1). */
export default function MercadosPage() {
  redirect("/listado?v=1");
}
