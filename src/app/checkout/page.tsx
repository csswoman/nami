import { Suspense } from "react";
import { connection } from "next/server";
import { AppShell } from "@/components/shell/AppShell";
import { CheckoutView } from "@/components/shell/CheckoutView";
import { getCartExtras, getCouponOffers } from "@/server/catalog";
import { currentGuestToken } from "@/server/guest";
import { currentRate } from "@/server/orders";
import { getDemand } from "@/server/prefs";
export const metadata = { title: "Confirmar pedido · Ñami" };
export default function CheckoutPage() {
  return (
    <AppShell mobileHeader={false} bottomNav={false}>
      <Suspense fallback={<div className="min-h-dvh" aria-busy="true" />}>
        <Content />
      </Suspense>
    </AppShell>
  );
}
async function Content() {
  await connection();
  const [extras, rate, offers, demand] = await Promise.all([getCartExtras(), currentRate(), currentGuestToken().then((t) => getCouponOffers(undefined, t)), getDemand()]);
  return <CheckoutView extras={extras} rate={rate} offers={offers} demand={demand} />;
}
