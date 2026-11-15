import { Suspense } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { EntregadoView } from "@/components/shell/EntregadoView";

export const metadata = { title: "Pedido entregado · Ñami" };

export default function EntregadoPage({ searchParams }: PageProps<"/entregado">) {
  return (
    <AppShell mobileHeader={false} bottomNav={false}>
      <Suspense fallback={<div className="min-h-dvh" aria-busy="true" />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </AppShell>
  );
}

async function Content({ searchParams }: { searchParams: PageProps<"/entregado">["searchParams"] }) {
  const sp = await searchParams;
  const id = typeof sp.id === "string" ? sp.id : undefined;
  // Sin pedido propio se muestra el ejemplo.
  return <EntregadoView id={id} storeName="Arepera Doña Chela" deliveredAt="8:17 a. m." earlyMin={3} courier="Carlos" />;
}
