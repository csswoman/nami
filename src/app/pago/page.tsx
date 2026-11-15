import { Suspense } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { PagoMovilView } from "@/components/shell/PagoMovilView";
import { currentRate } from "@/server/orders";
export const metadata = { title: "Pago móvil · Ñami" };
export default function PagoPage({ searchParams }: PageProps<"/pago">) {
  return (
    <AppShell mobileHeader={false} bottomNav={false}>
      <Suspense fallback={<div className="min-h-dvh" aria-busy="true" />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </AppShell>
  );
}
async function Content({ searchParams }: { searchParams: PageProps<"/pago">["searchParams"] }) {
  const sp = await searchParams;
  const id = typeof sp.id === "string" ? sp.id : undefined;
  return (
    <PagoMovilView
      id={id}
      rate={await currentRate()}
      banks={["Banco del Ávila", "Banesco", "Mercantil", "Provincial", "Venezuela", "Bancamiga"]}
      receiver={[
        { label: "Banco", value: "Banco del Ávila (0199)" },
        { label: "Teléfono", value: "0414-555-0199" },
        { label: "Cédula o RIF", value: "J-50012345-6" },
        { label: "A nombre de", value: "Ñami Demo C.A." },
      ]}
    />
  );
}
