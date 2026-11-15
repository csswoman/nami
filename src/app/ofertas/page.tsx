import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Icon, PromoBanner, SectionHeader, type IconName, type PromoBannerSlide } from "@/components/nami";
import { AppShell } from "@/components/shell/AppShell";
import { MarketProductCard } from "@/components/cart/MarketProductCard";
import { cartStoreOf } from "@/lib/cart/meta";
import type { CartStore } from "@/lib/cart/store";
import { marketCard } from "@/lib/catalog";
import type { MarketProduct } from "@/lib/demo/mercado";
import { getPromos, getStores } from "@/server/catalog";
import { getMoneyPrefs } from "@/server/prefs";
import type { Currency } from "@/lib/money";
import { StoreMark } from "@/components/shell/StoreMark";
import type { BrandColor } from "@/lib/demo/home";
import { formatUsd } from "@/lib/money";

export const metadata: Metadata = {
  title: "Ofertas del día · Ñami",
  description: "Combos y descuentos del día en restaurantes, supermercados y farmacias de Ñami.",
  alternates: { canonical: "/ofertas" },
};

type Combo = { slug: string; name: string; initials: string; color: BrandColor; bg: string; icon: IconName; rating: string; time: string; feeCents: number; deal: string; image: string };
type Deal = { p: MarketProduct; store: CartStore; storeName: string };
const COMBOS: Combo[] = [
  { slug: "arepera-dona-chela", name: "Arepera Doña Chela", initials: "DC", color: "brand-orange", bg: "bg-brand-orange text-on-primary", icon: "arepa", rating: "4,8", time: "20–30 min", feeCents: 120, deal: "2 arepas + guayoyo a $ 7,50", image: "/brand/food/reina-pepiada.jpg" },
  { slug: "tequenos-la-esquina", name: "Tequeños La Esquina", initials: "TE", color: "primary", bg: "bg-surface-warm text-brand-orange", icon: "tequeno", rating: "4,6", time: "15–25 min", feeCents: 90, deal: "2×1 en tequeños", image: "/brand/food/tequeno.jpg" },
  { slug: "cocina-de-mama-rosa", name: "Cocina de Mamá Rosa", initials: "MR", color: "leaf", bg: "bg-leaf text-on-primary", icon: "pabellon", rating: "4,9", time: "30–40 min", feeCents: 140, deal: "Menú del día a $ 4,50", image: "/brand/food/pabellon.jpg" },
  { slug: "panaderia-la-reina", name: "Panadería La Reina", initials: "LR", color: "primary", bg: "bg-primary text-on-primary", icon: "golfeado", rating: "4,7", time: "25–35 min", feeCents: 100, deal: "Golfeado + café a $ 3,50", image: "/brand/food/golfeado.jpg" },
  { slug: "perros-el-gocho", name: "Perros El Gocho", initials: "EG", color: "ink", bg: "bg-ink text-surface", icon: "perro-caliente", rating: "4,7", time: "15–25 min", feeCents: 80, deal: "Perro doble + malta a $ 5", image: "/brand/food/perro-caliente.jpg" },
  { slug: "cachapas-el-tio", name: "Cachapas El Tío", initials: "ET", color: "brand-orange", bg: "bg-surface-warm text-brand-orange", icon: "cachapa", rating: "4,8", time: "20–30 min", feeCents: 110, deal: "Cachapa con queso a $ 4,90", image: "/brand/food/cachapa-queso.jpg" },
];
/** Un par de ofertas por tienda, cada una con su propio carrito. */
async function dealsOf(slugs: string[], per = 2): Promise<Deal[]> {
  const all = await getStores();
  const groups = await Promise.all(slugs.map(async (slug) => ({ store: all.find((s) => s.slug === slug), promos: await getPromos(slug, per) })));
  return groups.flatMap(({ store, promos }) => (store ? promos.map((p) => ({ p: marketCard(p), store: cartStoreOf(store, "mercado"), storeName: store.name })) : []));
}
const FILTERS = [["todas", "Todas"], ["comida", "Comida"], ["super", "Súper"], ["farmacia", "Farmacia"], ["tiendas", "Tiendas"]] as const;

export default function OfertasPage({ searchParams }: PageProps<"/ofertas">) {
  return (
    <Suspense fallback={<AppShell mobileHeader={false} activeNav={2}><div className="min-h-dvh" aria-busy="true" /></AppShell>}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

const HERO_SLIDES: PromoBannerSlide[] = [
  {
    eyebrow: "Hora de la merienda · 3:00 a 6:00 p. m.",
    title: "Tequeños y golfeados 2×1 en meriendas",
    badge: <span className="nm-badge nm-badge--brand">2×1 Especial</span>,
    image: "/brand/promo-feast.png",
    href: "/tienda/tequenos-la-esquina",
    ctaText: "Ver tequeños",
    bg: "linear-gradient(135deg, #d9531e 0%, #99340b 100%)",
  },
  {
    eyebrow: "Cocina de Mamá Rosa",
    title: "Menú criollo completo por solo $ 4,50",
    badge: <span className="nm-badge nm-badge--brand">Combo Ahorro</span>,
    image: "/brand/food/pabellon.jpg",
    href: "/tienda/cocina-de-mama-rosa",
    ctaText: "Pedir almuerzo",
    bg: "linear-gradient(135deg, #1b8a5a 0%, #12583a 100%)",
  },
  {
    eyebrow: "Ñami Delivery · Caracas",
    title: "Envío gratis en combos y pedidos desde $ 12",
    badge: <span className="nm-badge nm-badge--success">Envío $ 0 con Ñami+</span>,
    image: "/brand/guacamaya-celebra.png",
    href: "/listado",
    ctaText: "Explorar tiendas",
    bg: "var(--primary)",
  },
];

function DealGrid({ items, money }: { items: Deal[]; money: { currency: Currency; rate: number } }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 desktop:grid-cols-4 desktop:gap-6">
      {items.map((d) => (
        <div key={`${d.store.slug}-${d.p.id}`} className="flex min-w-0 flex-col gap-1.5">
          <MarketProductCard store={d.store} p={d.p} money={money} />
          <div className="flex items-center gap-1.5 px-0.5">
            <StoreMark initials={d.store.initials} color={d.store.color} slug={d.store.slug} size={20} />
            <span className="truncate text-caption text-ink-muted">{d.storeName}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
async function Content({ searchParams }: { searchParams: PageProps<"/ofertas">["searchParams"] }) {
  const sp = await searchParams;
  const money = await getMoneyPrefs();
  const [SUPER, FARMACIA, TIENDAS] = await Promise.all([
    dealsOf(["nami-market", "abasto-el-saman", "automercado-avila", "bodegon-la-candelaria", "bodegon-los-chaguaramos"]),
    dealsOf(["farmacia-san-onofre", "farmacia-los-proceres", "farmacia-el-avila"]),
    dealsOf(["todo-hogar-chacao", "papeleria-el-estudiante"]),
  ]);
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
          <PromoBanner className="nm-banner--hero" slides={HERO_SLIDES} />
          <aside className="relative hidden flex-col justify-between overflow-hidden rounded-xl bg-promo p-8 text-ink desktop:flex">
            <div className="relative z-10 flex flex-col gap-2">
              <span className="text-body-strong font-bold">Solo hoy en súper</span>
              <h2 className="font-display text-[36px] leading-10 font-extrabold">Hasta 15% en víveres</h2>
              <p className="text-body text-ink/80">Harina de maíz, aceite y más en Abasto El Samán.</p>
            </div>
            <div className="relative z-10 flex items-center gap-3 pt-4">
              <StoreMark initials="AS" color="leaf" slug="abasto-el-saman" size={40} />
              <div className="flex flex-col leading-tight">
                <span className="text-body-strong font-bold">Abasto El Samán</span>
                <span className="text-caption text-ink-muted">Entregas en 25 min</span>
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/products/harina-pan.jpg"
              alt=""
              className="pointer-events-none absolute -bottom-6 -right-6 size-36 rounded-full object-cover opacity-25 shadow-lg mix-blend-multiply"
            />
          </aside>
        </div>

        {show("comida") ? (
          <section className="flex flex-col gap-4">
            <SectionHeader title="Combos de restaurantes" action="Ver todo" href="/listado" />
            <div className="scroll-x -mx-4 flex gap-4 px-4 desktop:mx-0 desktop:grid desktop:grid-cols-3 desktop:gap-6 desktop:overflow-visible desktop:px-0">
              {COMBOS.map((cb) => (
                <Link
                  key={cb.slug}
                  href={`/tienda/${cb.slug}`}
                  className="group flex w-[88%] shrink-0 flex-col gap-3 desktop:w-auto desktop:shrink"
                >
                  <div className="relative h-44 overflow-hidden rounded-xl border border-border/70 bg-surface-tile shadow-card desktop:h-56">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cb.image}
                      alt={cb.name}
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                    <span className="absolute top-3 right-3 rounded-pill bg-promo px-3 py-1 text-badge font-extrabold text-ink shadow-sm">
                      {cb.deal}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <StoreMark initials={cb.initials} color={cb.color} slug={cb.slug} size={48} />
                    <span className="flex min-w-0 grow flex-col text-caption text-ink-muted [&_.nm-icon]:size-4">
                      <span className="flex items-baseline justify-between gap-2">
                        <b className="truncate text-body-strong text-ink transition-colors group-hover:text-primary">{cb.name}</b>
                        <span className="flex shrink-0 items-center gap-1 text-ink"><Icon name="star" />{cb.rating}</span>
                      </span>
                      <span className="flex items-center gap-1"><Icon name="clock" />{cb.time}</span>
                      <span className="flex items-center gap-1"><Icon name="moto" />{formatUsd(cb.feeCents)}</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {show("super") ? (
          <section className="flex flex-col gap-4">
            <SectionHeader title="Súper con descuento" action="Ver todo" href="/listado?v=1" />
            <DealGrid items={SUPER} money={money} />
          </section>
        ) : null}

        {show("farmacia") ? (
          <section className="flex flex-col gap-4 pb-4">
            <SectionHeader title="Farmacia" action="Ver todo" href="/listado?v=2" />
            <DealGrid items={FARMACIA} money={money} />
          </section>
        ) : null}
        {show("tiendas") ? (
          <section className="flex flex-col gap-4 pb-4">
            <SectionHeader title="Tiendas" action="Ver todo" href="/listado?v=5" />
            <DealGrid items={TIENDAS} money={money} />
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
