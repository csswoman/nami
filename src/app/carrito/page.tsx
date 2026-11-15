import { Suspense } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { CarritoView } from "@/components/cart/CarritoView";
import { getCartExtras } from "@/server/catalog";
export const metadata = { title: "Tu carrito · Ñami" };
export default function CarritoPage() {
  return (
    <AppShell mobileHeader={false} bottomNav={false}>
      <Suspense fallback={<div className="min-h-dvh" aria-busy="true" />}>
        <Content />
      </Suspense>
    </AppShell>
  );
}
async function Content() {
  return <CarritoView extras={await getCartExtras()} />;
}
