import { Suspense } from "react";
import { connection } from "next/server";
import { AppShell } from "@/components/shell/AppShell";
import { CheckoutView } from "@/components/shell/CheckoutView";
import { getCartExtras, getCouponOffers } from "@/server/catalog";
import { currentRate } from "@/server/orders";
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
  const [extras, rate, offers] = await Promise.all([getCartExtras(), currentRate(), getCouponOffers()]);
  return <CheckoutView extras={extras} rate={rate} offers={offers} />;
}
