/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { ScreenBar } from "@/components/shell/ScreenBar";
import { Icon } from "@/components/nami";
import { PORTFOLIO_URL, REPO_URL } from "@/lib/links";

export const metadata: Metadata = {
  title: "Acerca del proyecto · Ñami",
  description:
    "Conoce Ñami: proyecto de portafolio diseñado y desarrollado por Karla con Next.js, React, TypeScript, PostgreSQL, Drizzle y Tailwind CSS.",
  alternates: { canonical: "/acerca" },
};

const STACK = ["Next.js", "React", "TypeScript", "PostgreSQL", "Drizzle", "Tailwind CSS", "Sistema de diseño Ñami", "Nunito + Figtree"];
type Item = { title: string; sub: string; href?: string; external?: boolean };
const LINKS: Item[] = [
  { title: "Panel de tienda", sub: "Atiende pedidos, agota productos y cambia horarios. Sin login.", href: "/tienda-admin" },
  { title: "Pantalla dividida", sub: "Cliente y tienda lado a lado (escritorio)", href: "/demo" },
  { title: "Mi perfil", sub: "Direcciones guardadas, favoritos, moneda y tema", href: "/perfil" },
  { title: "Código del proyecto", sub: "Repositorio en GitHub", href: REPO_URL, external: true },
  { title: "Portafolio de Karla", sub: PORTFOLIO_URL ? "Más proyectos y contacto" : "Próximamente", href: PORTFOLIO_URL ?? undefined, external: true },
  { title: "Sistema de diseño de Ñami", sub: "Tokens, componentes y mascota", href: "/sistema" },
];
/** Recorridos guiados: cada uno se prueba en un par de minutos y muestra una parte distinta del proyecto. */
const TOURS: { title: string; steps: string[]; href: string; cta: string }[] = [
  {
    title: "Pide y sigue tu pedido",
    steps: ["Elige un restaurante y agrega algo al carrito.", "En el checkout elige dirección, franja y cupón (prueba NAMI10).", "Mira el seguimiento: el repartidor se mueve por la ruta guardada."],
    href: "/listado", cta: "Ver restaurantes",
  },
  {
    title: "Atiende el pedido como tienda",
    steps: ["Abre la pantalla dividida: cliente a la izquierda, tienda a la derecha.", "Haz un pedido y acéptalo desde el panel.", "Avanza los estados y mira cómo cambia el seguimiento del cliente."],
    href: "/demo", cta: "Abrir pantalla dividida",
  },
  {
    title: "Busca con errores de tipeo",
    steps: ["Escribe «teqeños» (sin la u).", "La búsqueda sigue encontrando «tequeños» (pg_trgm).", "Prueba los filtros: abierto ahora, envío gratis, hasta 30 min y precio."],
    href: "/busqueda?q=teqe%C3%B1os", cta: "Probar la búsqueda",
  },
  {
    title: "Cambia de zona",
    steps: ["Mueve el pin del mapa o elige Caricuao.", "Mira qué tiendas llegan y cuánto cuesta el envío.", "Marca «Guardar esta dirección» y úsala luego desde tu perfil."],
    href: "/direccion", cta: "Elegir dirección",
  },
];
function Row({ l }: { l: Item }) {
  const body = (
    <>
      <span className="flex grow flex-col"><b className="text-body-strong">{l.title}</b><span className="text-caption text-ink-muted">{l.sub}</span></span>
      <Icon name="chevronRight" className="size-5 text-ink-muted" />
    </>
  );
  if (!l.href) return <div className="flex items-center gap-3 py-3.5">{body}</div>;
  return l.external ? (
    <a href={l.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 py-3.5">{body}</a>
  ) : (
    <Link href={l.href} className="flex items-center gap-3 py-3.5">{body}</Link>
  );
}

export default function AcercaPage() {
  return (
    <AppShell mobileHeader={false} bottomNav={false}>
      <ScreenBar title="Acerca del proyecto" back="/" />
      <div className="page-x flex flex-col gap-8 pt-2 desktop:gap-12 desktop:pt-8">
        <section className="relative flex min-h-60 items-center overflow-hidden rounded-xl bg-primary px-6 text-on-primary desktop:min-h-96 desktop:px-20">
          <div className="relative z-10 flex max-w-[58%] flex-col gap-3 desktop:max-w-[55%] desktop:gap-8">
            <img src="/brand/nami-logo.png" alt="Ñami" className="h-7 w-auto self-start brightness-0 invert desktop:h-14" />
            <h1 className="font-display text-[22px] leading-7 font-extrabold desktop:text-[60px] desktop:leading-18">Tu delivery caraqueño, en un solo lugar.</h1>
            <p className="hidden text-body-strong desktop:block desktop:text-[20px]">Proyecto de portafolio · Demo 0.1 · Sin pagos reales</p>
          </div>
          <img src="/brand/guacamaya-moto.png" alt="" className="absolute -right-4 bottom-0 h-[85%] w-auto desktop:right-24 desktop:h-[100%]" />
        </section>

        <section aria-labelledby="dos-minutos" className="flex flex-col gap-4">
          <h2 id="dos-minutos" className="font-display text-title-lg desktop:text-[32px]">Prueba esto en 2 minutos</h2>
          <div className="scroll-x -mx-4 flex snap-x snap-mandatory gap-4 px-4 pb-2 desktop:mx-0 desktop:grid desktop:grid-cols-4 desktop:overflow-visible desktop:px-0 desktop:pb-0">
            {TOURS.map((t, i) => (
              <article key={t.title} className="flex w-[78%] shrink-0 snap-start scroll-ml-4 flex-col gap-3 rounded-xl border border-border p-5 desktop:w-auto desktop:shrink">
                <h3 className="font-display text-title-md"><span className="text-primary-text">{i + 1}.</span> {t.title}</h3>
                <ol className="flex list-decimal flex-col gap-1 pl-5 text-body text-ink-muted">{t.steps.map((st) => <li key={st}>{st}</li>)}</ol>
                <Link href={t.href} className="nm-btn nm-btn--secondary nm-btn--sm mt-auto self-start">{t.cta}</Link>
              </article>
            ))}
          </div>
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
                {LINKS.map((l) => <li key={l.title} className="border-b border-border"><Row l={l} /></li>)}
              </ul>
            </section>
          </div>
        </div>
        <p className="pb-6 text-center text-caption text-ink-muted desktop:hidden">Demo 0.1 · Caracas, 2026 · Sin pagos reales</p>
      </div>
    </AppShell>
  );
}
