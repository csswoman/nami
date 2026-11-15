import { Suspense } from "react";
import { LocalOrderDetail } from "@/components/orders/LocalOrderDetail";
import { OrderDetail } from "@/components/orders/OrderDetail";
import { AppShell } from "@/components/shell/AppShell";
import { ScreenBar } from "@/components/shell/ScreenBar";
import { getPastOrder } from "@/lib/demo/pedidos";
import { fromHistory } from "@/lib/orders/view";

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
  // Demo: el historial de ejemplo vive en el servidor; los pedidos que haces se leen del navegador.
  // La lógica real lo leerá por id + guestToken.
  const demo = getPastOrder(id);
  return demo ? <OrderDetail o={fromHistory(demo)} /> : <LocalOrderDetail id={id} />;
}
