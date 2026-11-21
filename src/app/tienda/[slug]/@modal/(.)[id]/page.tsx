import { Suspense } from "react";
import { ProductoContent } from "../../_producto";

/** Interceptada: al navegar desde la tienda, el producto se abre encima de ella en vez de reemplazarla. */
export default function ProductoModalPage({ params }: PageProps<"/tienda/[slug]/[id]">) {
  return (
    <Suspense fallback={<div className="fixed inset-0 z-50 bg-ink/50" aria-busy="true" />}>
      <ProductoContent params={params} modal />
    </Suspense>
  );
}
