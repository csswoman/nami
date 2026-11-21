import { Suspense } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { ProductoContent } from "../_producto";

export const metadata = { title: "Producto · Ñami" };

export default function ProductoPage({ params }: PageProps<"/tienda/[slug]/[id]">) {
  return (
    <Suspense fallback={<AppShell mobileHeader={false} bottomNav={false}><div className="min-h-dvh" aria-busy="true" /></AppShell>}>
      <ProductoContent params={params} />
    </Suspense>
  );
}
