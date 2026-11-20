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
      <div className="page-x mx-auto flex w-full max-w-6xl flex-col gap-6 pt-5 pb-28 desktop:gap-8 desktop:pt-8 desktop:pb-8">
        <h1 className="font-display text-[28px] leading-8 font-extrabold tracking-[-0.01em] text-balance desktop:text-[40px] desktop:leading-11">Mis pedidos</h1>
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
