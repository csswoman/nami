import { AppShell } from "@/components/shell/AppShell";
import { CarritoView } from "@/components/cart/CarritoView";
import { EXTRAS_BY_STORE } from "@/lib/demo/catalog";

export const metadata = { title: "Tu carrito · Ñami" };

export default function CarritoPage() {
  return (
    <AppShell mobileHeader={false} bottomNav={false}>
      <CarritoView extras={EXTRAS_BY_STORE} />
    </AppShell>
  );
}
