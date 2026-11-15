import { Suspense } from "react";
import { OrdersView } from "@/components/orders/OrdersView";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyState } from "@/components/shell/EmptyState";
import { PAST_ORDERS } from "@/lib/demo/pedidos";
import { fromHistory } from "@/lib/orders/view";
import { getMoneyPrefs } from "@/server/prefs";

export const metadata = { title: "Mis pedidos · Ñami" };

export default function PedidosPage({ searchParams }: PageProps<"/pedidos">) {
  return (
    <Suspense fallback={<AppShell mobileHeader={false} activeNav={3}><div className="min-h-dvh" aria-busy="true" /></AppShell>}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({ searchParams }: { searchParams: PageProps<"/pedidos">["searchParams"] }) {
  const sp = await searchParams;
  // Demo: ?vacio=1 muestra el estado sin pedidos.
  const empty = sp.vacio === "1";
  const money = await getMoneyPrefs();
  return (
    <AppShell mobileHeader={false} activeNav={3}>
      <div className="page-x flex flex-col gap-8 pt-5 pb-28 desktop:pt-8 desktop:pb-8">
        <h1 className="font-display text-[32px] leading-9 font-extrabold desktop:text-[56px] desktop:leading-16">Mis pedidos</h1>
        {empty ? (
          <EmptyState
            title="Aún no tienes pedidos"
            text="Cuando pidas algo, aquí verás el recorrido, el total y la opción de repetirlo."
            primary={{ href: "/listado", label: "Explorar restaurantes" }}
          />
        ) : (
          <OrdersView demo={PAST_ORDERS.map(fromHistory)} money={money} />
        )}
      </div>
    </AppShell>
  );
}
