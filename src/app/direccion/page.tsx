import { AppShell } from "@/components/shell/AppShell";
import { DireccionView } from "@/components/shell/DireccionView";
import { SPOTS } from "@/lib/demo/direcciones";

export const metadata = { title: "Elige tu dirección · Ñami" };

export default function DireccionPage() {
  return (
    <AppShell mobileHeader={false} bottomNav={false} topBar="logo">
      <DireccionView spots={SPOTS} initial="altamira" next="/checkout" />
    </AppShell>
  );
}
