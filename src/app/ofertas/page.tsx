import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Icon, PromoBanner, SectionHeader, type IconName } from "@/components/nami";
import { AppShell } from "@/components/shell/AppShell";
import { MarketProductCard } from "@/components/cart/MarketProductCard";
import { cartStoreOf } from "@/lib/cart/meta";
import type { CartStore } from "@/lib/cart/store";
import { MARKETS, promosOf, type MarketProduct } from "@/lib/demo/mercado";
import { StoreMark } from "@/components/shell/StoreMark";
import type { BrandColor } from "@/lib/demo/home";
import { formatUsd } from "@/lib/money";

export const metadata: Metadata = {
  title: "Ofertas del día · Ñami",
  description: "Combos y descuentos del día en restaurantes, supermercados y farmacias de Ñami.",
  alternates: { canonical: "/ofertas" },
};

type Combo = { slug: string; name: string; initials: string; color: BrandColor; bg: string; icon: IconName; rating: string; time: string; feeCents: number; deal: string };
type Deal = { p: MarketProduct; store: CartStore; storeName: string };
const COMBOS: Combo[] = [
  { slug: "arepera-dona-chela", name: "Arepera Doña Chela", initials: "DC", color: "brand-orange", bg: "bg-brand-orange text-on-primary", icon: "arepa", rating: "4,8", time: "20–30 min", feeCents: 120, deal: "2 arepas + guayoyo a $ 7,50" },
  { slug: "tequenos-la-esquina", name: "Tequeños La Esquina", initials: "TE", color: "primary", bg: "bg-surface-warm text-brand-orange", icon: "tequeno", rating: "4,6", time: "15–25 min", feeCents: 90, deal: "2×1 en tequeños" },
  { slug: "cocina-de-mama-rosa", name: "Cocina de Mamá Rosa", initials: "MR", color: "leaf", bg: "bg-leaf text-on-primary", icon: "pabellon", rating: "4,9", time: "30–40 min", feeCents: 140, deal: "Menú del día a $ 4,50" },
  { slug: "panaderia-la-reina", name: "Panadería La Reina", initials: "LR", color: "primary", bg: "bg-primary text-on-primary", icon: "golfeado", rating: "4,7", time: "25–35 min", feeCents: 100, deal: "Golfeado + café a $ 3,50" },
  { slug: "perros-el-gocho", name: "Perros El Gocho", initials: "EG", color: "ink", bg: "bg-ink text-surface", icon: "perro-caliente", rating: "4,7", time: "15–25 min", feeCents: 80, deal: "Perro doble + malta a $ 5" },
  { slug: "cachapas-el-tio", name: "Cachapas El Tío", initials: "ET", color: "brand-orange", bg: "bg-surface-warm text-brand-orange", icon: "cachapa", rating: "4,8", time: "20–30 min", feeCents: 110, deal: "Cachapa con queso a $ 4,90" },
];
/** Un par de ofertas por tienda, cada una con su propio carrito. */
const dealsOf = (slugs: string[], per = 2): Deal[] =>
  slugs.flatMap((s) => promosOf(s, per).map((p) => ({ p, store: cartStoreOf(MARKETS[s], "mercado"), storeName: MARKETS[s].name })));
const SUPER = dealsOf(["nami-market", "abasto-el-saman", "automercado-avila", "bodegon-la-candelaria", "bodegon-los-chaguaramos"]);
const FARMACIA = dealsOf(["farmacia-san-onofre", "farmacia-los-proceres", "farmacia-el-avila"]);
const TIENDAS = dealsOf(["todo-hogar-chacao", "papeleria-el-estudiante"]);
const FILTERS = [["todas", "Todas"], ["comida", "Comida"], ["super", "Súper"], ["farmacia", "Farmacia"], ["tiendas", "Tiendas"]] as const;

export default function OfertasPage({ searchParams }: PageProps<"/ofertas">) {
  return (
    <Suspense fallback={<AppShell mobileHeader={false} activeNav={2}><div className="min-h-dvh" aria-busy="true" /></AppShell>}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

function DealGrid({ items }: { items: Deal[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 desktop:grid-cols-4 desktop:gap-6">
      {items.map((d) => (
        <div key={`${d.store.slug}-${d.p.id}`} className="flex min-w-0 flex-col gap-1">
          <MarketProductCard store={d.store} p={d.p} />
          <span className="text-caption text-ink-muted">{d.storeName}</span>
        </div>
      ))}
    </div>
  );
}
async function Content({ searchParams }: { searchParams: PageProps<"/ofertas">["searchParams"] }) {
  const sp = await searchParams;
  const c = FILTERS.some(([id]) => id === sp.c) ? (sp.c as string) : "todas";
  const show = (k: string) => c === "todas" || c === k;

  return (
    <AppShell mobileHeader={false} activeNav={2}>
      <div className="page-x flex flex-col gap-8 pt-5 desktop:gap-12 desktop:pt-8">
        <header className="flex flex-col gap-3 desktop:flex-row desktop:items-end desktop:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-[32px] leading-9 font-extrabold desktop:text-[56px] desktop:leading-16">Ofertas del día</h1>
            <p className="flex items-center gap-2 text-caption text-ink-muted desktop:text-body [&_.nm-icon]:size-4"><Icon name="clock" />Se renuevan todos los días a las 6:00 a. m.</p>
          </div>
          <nav aria-label="Filtrar ofertas" className="scroll-x -mx-4 flex gap-3 px-4 desktop:mx-0 desktop:px-0">
            {FILTERS.map(([id, label]) => (
              <Link key={id} href={`/ofertas?c=${id}`} replace scroll={false} aria-current={c === id ? "true" : undefined} className={`flex min-h-11 shrink-0 items-center rounded-pill px-5 text-button ${c === id ? "bg-primary text-on-primary" : "bg-surface-tile text-ink"}`}>{label}</Link>
            ))}
          </nav>
        </header>

        <div className="grid gap-6 desktop:grid-cols-[2fr_1fr]">
          <PromoBanner className="nm-banner--hero" eyebrow="De 3:00 a 6:00 p. m." title="Tequeños y golfeados 2×1" image="/brand/guacamaya-moto.png" slides={3} />
          <aside className="hidden flex-col justify-center gap-3 rounded-xl bg-promo p-8 text-ink desktop:flex">
            <span className="text-body-strong font-bold">Solo hoy en súper</span>
            <h2 className="font-display text-[40px] leading-11 font-extrabold">Hasta 15% en víveres</h2>
            <p className="text-body">Harina de maíz, aceite y más en Abasto El Samán.</p>
          </aside>
        </div>

        {show("comida") ? (
          <section className="flex flex-col gap-4">
            <SectionHeader title="Combos de restaurantes" action="Ver todo" href="/listado" />
            <div className="scroll-x -mx-4 flex gap-4 px-4 desktop:mx-0 desktop:grid desktop:grid-cols-3 desktop:gap-6 desktop:overflow-visible desktop:px-0">
              {COMBOS.map((cb) => (
                <Link key={cb.slug} href={`/tienda/${cb.slug}`} className="flex w-[88%] shrink-0 flex-col gap-3 desktop:w-auto desktop:shrink">
                  <div className={`relative grid h-44 place-items-center overflow-hidden rounded-xl desktop:h-62 ${cb.bg}`}>
                    <span className="absolute right-[8%] size-32 rounded-pill bg-current opacity-12 desktop:size-56" aria-hidden="true" />
                    <span className="relative size-20 desktop:size-32 [&_.nm-icon]:size-full [&_.nm-icon]:stroke-1"><Icon name={cb.icon} /></span>
                  </div>
                  <div className="flex items-start gap-3">
                    <StoreMark initials={cb.initials} color={cb.color} size={52} />
                    <span className="flex min-w-0 grow flex-col text-caption text-ink-muted [&_.nm-icon]:size-4">
                      <span className="flex items-baseline justify-between gap-2"><b className="text-body-strong text-ink">{cb.name}</b><span className="flex items-center gap-1 text-ink"><Icon name="star" />{cb.rating}</span></span>
                      <span className="flex items-center gap-1"><Icon name="clock" />{cb.time}</span>
                      <span className="flex items-center gap-1"><Icon name="moto" />{formatUsd(cb.feeCents)}</span>
                    </span>
                  </div>
                  <span className="w-fit rounded-pill bg-promo px-3 py-1.5 text-badge font-bold text-ink">{cb.deal}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {show("super") ? (
          <section className="flex flex-col gap-4">
            <SectionHeader title="Súper con descuento" action="Ver todo" href="/listado?v=1" />
            <DealGrid items={SUPER} />
          </section>
        ) : null}

        {show("farmacia") ? (
          <section className="flex flex-col gap-4 pb-4">
            <SectionHeader title="Farmacia" action="Ver todo" href="/listado?v=2" />
            <DealGrid items={FARMACIA} />
          </section>
        ) : null}
        {show("tiendas") ? (
          <section className="flex flex-col gap-4 pb-4">
            <SectionHeader title="Tiendas" action="Ver todo" href="/listado?v=5" />
            <DealGrid items={TIENDAS} />
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
