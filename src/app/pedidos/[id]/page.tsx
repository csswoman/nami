import { Suspense } from "react";
import { LocalOrderDetail } from "@/components/orders/LocalOrderDetail";
import { OrderDetail } from "@/components/orders/OrderDetail";
import { AppShell } from "@/components/shell/AppShell";
import { ScreenBar } from "@/components/shell/ScreenBar";
import { getPastOrder } from "@/lib/demo/pedidos";
import { fromHistory } from "@/lib/orders/view";
import { getMoneyPrefs } from "@/server/prefs";

export const metadata = { title: "Detalle del pedido · Ñami" };

export default function DetallePedidoPage({ params }: PageProps<"/pedidos/[id]">) {
  return (
    <AppShell mobileHeader={false} bottomNav={false} activeNav={3}>
      <ScreenBar title="Detalle del pedido" back="/pedidos" />
      <Suspense fallback={<div className="min-h-[60dvh]" aria-busy="true" />}>
        <Content params={params} />
      </Suspense>
    </AppShell>
  );
}

async function Content({ params }: { params: PageProps<"/pedidos/[id]">["params"] }) {
  const id = decodeURIComponent((await params).id);
  const money = await getMoneyPrefs();
  const demo = getPastOrder(id);
  return demo ? <OrderDetail o={fromHistory(demo)} money={money} /> : <LocalOrderDetail id={id} money={money} />;
}
