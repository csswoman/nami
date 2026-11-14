import { AppShell } from "@/components/shell/AppShell";
import { CheckoutView } from "@/components/shell/CheckoutView";
import { EXTRAS_BY_STORE } from "@/lib/demo/catalog";
import { DEMO_RATE } from "@/lib/demo/home";

export const metadata = { title: "Confirmar pedido · Ñami" };

export default function CheckoutPage() {
  return (
    <AppShell mobileHeader={false} bottomNav={false}>
      <CheckoutView extras={EXTRAS_BY_STORE} rate={DEMO_RATE} />
    </AppShell>
  );
}
