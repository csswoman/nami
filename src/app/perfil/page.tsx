import type { Metadata } from "next";
import { PerfilView } from "@/components/profile/PerfilView";
import { AppShell } from "@/components/shell/AppShell";
import { ScreenBar } from "@/components/shell/ScreenBar";
import { getMoneyPrefs } from "@/server/prefs";
import { Suspense } from "react";
export const metadata: Metadata = { title: "Mi perfil · Ñami", description: "Direcciones guardadas, favoritos, moneda y tema de tu demo de Ñami." };
export default function PerfilPage() {
  return (
    <AppShell mobileHeader={false} activeNav={4}>
      <ScreenBar title="Mi perfil" back="/" />
      <div className="page-x flex flex-col gap-8 pt-2 pb-28 desktop:pt-8 desktop:pb-8">
        <h1 className="hidden font-display text-[56px] leading-16 font-extrabold desktop:block">Mi perfil</h1>
        <Suspense fallback={<div className="min-h-[60dvh]" aria-busy="true" />}>
          <Content />
        </Suspense>
      </div>
    </AppShell>
  );
}
async function Content() {
  const money = await getMoneyPrefs();
  return <PerfilView money={money} />;
}
