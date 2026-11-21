import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { ScreenBar } from "@/components/shell/ScreenBar";
import { RiderApp } from "@/components/rider/RiderApp";
import { SPLIT_VIEW } from "@/lib/demo/split-view";
import { currentGuestToken } from "@/server/guest";
import { getRiderBoard } from "@/server/rider";

export const metadata: Metadata = {
  title: "App del repartidor · Ñami",
  description: "El tercer lado de la demo: toma pedidos listos, recógelos en la tienda y entrégalos. El cliente ve cada paso en su seguimiento.",
  alternates: { canonical: "/repartidor" },
};

export default function RepartidorPage({ searchParams }: PageProps<"/repartidor">) {
  return (
    <Suspense fallback={<div className="min-h-dvh" aria-busy="true" />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({ searchParams }: Pick<PageProps<"/repartidor">, "searchParams">) {
  await connection();
  const sp = await searchParams;
  const initial = await getRiderBoard(await currentGuestToken());
  // Dentro de la pantalla dividida: sin barras.
  if (sp.vista === SPLIT_VIEW) {
    return (
      <main id="contenido" className="flex min-h-dvh flex-col gap-4 bg-surface px-4 py-4">
        <h1 className="font-display text-title-lg">Repartidor</h1>
        <RiderApp initial={initial} embedded />
      </main>
    );
  }
  return (
    <AppShell mobileHeader={false} bottomNav={false}>
      <ScreenBar title="App del repartidor" back="/" />
      <div className="page-x flex flex-col gap-5 pt-2 desktop:pt-8">
        <div className="flex flex-col gap-1 rounded-lg bg-primary-tint p-4">
          <p className="text-caption text-ink-muted">Juegas como repartidor</p>
          <h1 className="font-display text-title-lg desktop:text-[28px]">Tus entregas</h1>
          <p className="text-caption text-ink-muted">Sin login, como el panel de tienda. Llevas los pedidos que haces desde este navegador y los simulados desde el panel; lo que marques aquí lo ve el cliente en su seguimiento. Para ver los tres lados a la vez abre la <Link href="/demo" className="font-bold text-primary-text underline">pantalla dividida</Link>.</p>
        </div>
        <RiderApp initial={initial} />
      </div>
    </AppShell>
  );
}
