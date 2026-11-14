import { AppShell } from "@/components/shell/AppShell";
import { PagoMovilView } from "@/components/shell/PagoMovilView";
import { DEMO_RATE } from "@/lib/demo/home";

export const metadata = { title: "Pago móvil · Ñami" };

export default function PagoPage() {
  return (
    <AppShell mobileHeader={false} bottomNav={false}>
      <PagoMovilView
        rate={DEMO_RATE}
        banks={["Banco del Ávila", "Banesco", "Mercantil", "Provincial", "Venezuela", "Bancamiga"]}
        receiver={[
          { label: "Banco", value: "Banco del Ávila (0199)" },
          { label: "Teléfono", value: "0414-555-0199" },
          { label: "Cédula o RIF", value: "J-50012345-6" },
          { label: "A nombre de", value: "Ñami Demo C.A." },
        ]}
      />
    </AppShell>
  );
}
