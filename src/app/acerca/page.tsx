/* eslint-disable @next/next/no-img-element */
import { AppShell } from "@/components/shell/AppShell";
import { ScreenBar } from "@/components/shell/ScreenBar";
import { Icon } from "@/components/nami";

export const metadata = { title: "Acerca del proyecto · Ñami" };

const STACK = ["Next.js", "React", "TypeScript", "PostgreSQL", "Drizzle", "Tailwind CSS", "Sistema de diseño Ñami", "Nunito + Figtree"];
const LINKS = [
  { title: "Código del proyecto", sub: "[ENLACE A GITHUB]" },
  { title: "Portafolio de Karla", sub: "[ENLACE]" },
  { title: "Sistema de diseño de Ñami", sub: "Tokens, componentes y mascota" },
];

export default function AcercaPage() {
  return (
    <AppShell mobileHeader={false} bottomNav={false}>
      <ScreenBar title="Acerca del proyecto" back="/" />
      <div className="page-x flex flex-col gap-8 pt-2 desktop:gap-12 desktop:pt-8">
        <section className="relative flex min-h-60 items-center overflow-hidden rounded-xl bg-primary px-6 text-on-primary desktop:min-h-120 desktop:px-20">
          <div className="relative z-10 flex max-w-[58%] flex-col gap-3 desktop:max-w-[55%] desktop:gap-8">
            <img src="/brand/nami-logo.png" alt="Ñami" className="h-7 w-auto self-start brightness-0 invert desktop:h-14" />
            <h1 className="font-display text-[22px] leading-7 font-extrabold desktop:text-[60px] desktop:leading-18">Tu delivery caraqueño, en un solo lugar.</h1>
            <p className="hidden text-body-strong desktop:block desktop:text-[20px]">Proyecto de portafolio · Demo 0.1 · Sin pagos reales</p>
          </div>
          <img src="/brand/guacamaya-moto.png" alt="" className="absolute -right-4 bottom-0 h-[85%] w-auto desktop:right-24 desktop:h-[100%]" />
        </section>

        <div className="grid grid-cols-1 gap-8 desktop:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] desktop:gap-24">
          <div className="flex flex-col gap-8">
            <section className="flex flex-col gap-3">
              <h2 className="font-display text-title-lg desktop:text-[32px]">¿Qué es Ñami?</h2>
              <p className="text-[18px] leading-7">Una app de delivery venezolana pensada para Caracas: comida, mercado, farmacia y tiendas. Es un proyecto de portafolio, así que puedes pedir, pagar y seguir tu pedido sin que nada se cobre ni se entregue.</p>
              <p className="text-[18px] leading-7">Las tiendas siguen la hora de Caracas, el stock se agota cada día y el modo demo te deja saltar entre desayuno, almuerzo, merienda, cena y noche.</p>
            </section>
            <section className="flex flex-col gap-3">
              <h2 className="font-display text-title-lg desktop:text-[32px]">Quién lo hizo</h2>
              <div className="flex items-start gap-4 rounded-xl bg-surface-tile p-5">
                <span className="grid size-14 shrink-0 place-items-center rounded-pill bg-primary font-display text-title-md font-black text-on-primary">K</span>
                <div className="flex flex-col gap-1">
                  <b className="text-body-strong">Karla</b>
                  <span className="text-caption font-bold text-primary-text">Diseño, frontend, backend y base de datos</span>
                  <span className="text-body text-ink-muted">Identidad, sistema de diseño, la interfaz, la lógica de pedidos y el modelo de datos.</span>
                </div>
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-8">
            <section className="flex flex-col gap-3">
              <h2 className="font-display text-title-lg desktop:text-[32px]">Stack</h2>
              <ul className="flex flex-wrap gap-3">
                {STACK.map((s) => <li key={s} className="rounded-pill border border-border px-4 py-2.5 text-button">{s}</li>)}
              </ul>
            </section>
            <section className="flex flex-col gap-1">
              <h2 className="pb-2 font-display text-title-lg desktop:text-[32px]">Enlaces</h2>
              <ul>
                {LINKS.map((l) => (
                  <li key={l.title} className="flex items-center gap-3 border-b border-border py-3.5">
                    <span className="flex grow flex-col"><b className="text-body-strong">{l.title}</b><span className="text-caption text-ink-muted">{l.sub}</span></span>
                    <Icon name="chevronRight" className="size-5 text-ink-muted" />
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
        <p className="pb-6 text-center text-caption text-ink-muted desktop:hidden">Demo 0.1 · Caracas, 2026 · Sin pagos reales</p>
      </div>
    </AppShell>
  );
}
