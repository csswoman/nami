import Link from "next/link";
import { Suspense } from "react";
import { OrderCard } from "@/components/nami";
import { ActiveOrderCard } from "@/components/cart/ActiveOrderCard";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyState } from "@/components/shell/EmptyState";
import { PAST_ORDERS } from "@/lib/demo/pedidos";
import { formatUsd } from "@/lib/money";

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

  return (
    <AppShell mobileHeader={false} activeNav={3}>
      <div className="page-x flex flex-col gap-6 pt-5 desktop:pt-8">
        <h1 className="font-display text-[32px] leading-9 font-extrabold desktop:text-[56px] desktop:leading-16">Mis pedidos</h1>

        {empty ? (
          <EmptyState
            title="Aún no tienes pedidos"
            text="Cuando pidas algo, aquí verás el recorrido, el total y la opción de repetirlo."
            primary={{ href: "/listado", label: "Explorar restaurantes" }}
          />
        ) : (
          <>
            <section aria-labelledby="en-curso" className="flex flex-col gap-3">
              <h2 id="en-curso" className="font-display text-title-lg">En curso</h2>
              <ActiveOrderCard />
            </section>

            <section aria-labelledby="anteriores" className="flex flex-col gap-1">
              <h2 id="anteriores" className="font-display text-title-lg">Anteriores</h2>
              <div className="grid grid-cols-1 gap-x-8 desktop:grid-cols-2">
                {PAST_ORDERS.map((o) => (
                  <div key={o.id} className="relative">
                    <OrderCard
                      className="max-w-none"
                      store={o.store}
                      initials={o.initials}
                      color={`var(--${o.color})`}
                      date={`· ${o.date}`}
                      total={formatUsd(o.totalCents)}
                      status={o.status}
                    />
                    <Link href={`/pedidos/${o.id}`} aria-label={`Ver detalle del pedido de ${o.store}`} className="absolute inset-x-0 top-4 h-14" />
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
