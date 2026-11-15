import { Suspense } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { TrackingView } from "@/components/tracking/TrackingView";

export const metadata = { title: "Seguimiento del pedido · Ñami" };

export default function SeguimientoPage({ searchParams }: PageProps<"/seguimiento">) {
  return (
    <Suspense fallback={<AppShell mobileHeader={false} bottomNav={false}><div className="min-h-dvh" aria-busy="true" /></AppShell>}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({ searchParams }: { searchParams: PageProps<"/seguimiento">["searchParams"] }) {
  const sp = await searchParams;
  // ?id= elige el pedido; sin id, el más reciente en curso. El recorrido se lee del navegador.
  const id = typeof sp.id === "string" ? sp.id : undefined;
  return (
    <AppShell mobileHeader={false} bottomNav={false}>
      <TrackingView id={id} />
    </AppShell>
  );
}
