import { AppShell } from "@/components/shell/AppShell";
import { EntregadoView } from "@/components/shell/EntregadoView";

export const metadata = { title: "Pedido entregado · Ñami" };

export default function EntregadoPage() {
  return (
    <AppShell mobileHeader={false} bottomNav={false}>
      <EntregadoView storeName="Arepera Doña Chela" deliveredAt="8:17 a. m." earlyMin={3} courier="Carlos" />
    </AppShell>
  );
}
