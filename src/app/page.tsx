import Link from "next/link";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { Suspense } from "react";
import { Badge, CategoryTile, CuisineChip, Icon, PromoBanner, RestaurantCard, SectionHeader, StoreLogo } from "@/components/nami";
import { AppShell } from "@/components/shell/AppShell";
import { DeliveryBar } from "@/components/shell/DeliveryBar";
import { StoreMark } from "@/components/shell/StoreMark";
import { caracasNow, FRANJA_COOKIE, horaToMinutes, resolveFranja } from "@/lib/demo/franja";
import { PromoTabs, type PromoGroup } from "@/components/cart/PromoTabs";
import { cartStoreOf } from "@/lib/cart/meta";
import { isOpenAt, marketCard, opensText } from "@/lib/catalog";
import { chipTag } from "@/lib/demo/catalog";
import { FRANJA_CONTENT, TRUSTED_MARKETS, VERTICALS } from "@/lib/demo/home";
import { formatUsd } from "@/lib/money";
import { getPromos, getStores } from "@/server/catalog";
import { getDeliveryContext, getMoneyPrefs } from "@/server/prefs";

const PROMO_MARKETS = ["nami-market", "abasto-el-saman", "automercado-avila", "bodegon-la-candelaria", "farmacia-san-onofre", "farmacia-los-proceres"];
/** Cada tarjeta de categoría abre la pestaña del listado con ese índice (?v=). */
const verticalHref = (i: number) => (i === 0 ? "/listado" : `/listado?v=${i}`);

export default function HomePage({ searchParams }: PageProps<"/">) {
  return (
    <AppShell activeNav={0}>
      <Suspense fallback={<div className="page-x min-h-dvh" aria-busy="true" />}>
        <HomeContent searchParams={searchParams} />
      </Suspense>
    </AppShell>
  );
}

async function HomeContent({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  // La hora de Caracas cambia en cada petición: se calcula en tiempo de request, no al prerenderizar.
  await connection();
  const { franja: raw } = await searchParams;
  const real = caracasNow();
  const pick = resolveFranja(typeof raw === "string" ? raw : undefined, (await cookies()).get(FRANJA_COOKIE)?.value);
  const franja = pick ?? real.franja;
  const content = FRANJA_CONTENT[franja];
  const minutes = horaToMinutes(content.hora);
  const delivery = await getDeliveryContext();
  const [money, allRestaurants, allMarkets, promos] = await Promise.all([
    getMoneyPrefs(),
    getStores({ vertical: 0, delivery }),
    getStores({ delivery }),
    Promise.all(PROMO_MARKETS.map((s) => getPromos(s))),
  ]);
  // Solo lo que llega hasta la dirección elegida.
  const reaches = (s: { delivery?: { covered: boolean } }) => s.delivery?.covered !== false;
  const restaurants = allRestaurants.filter(reaches);
  const markets = allMarkets.filter(reaches);
  const hidden = allMarkets.length - markets.length;
  const rate = (r: { rating: string | null }) => Number(r.rating?.replace(",", ".") ?? 0);
  const openStores = restaurants.filter((r) => isOpenAt(r, minutes)).sort((a, b) => rate(b) - rate(a)).slice(0, 3);
  const closedStores = restaurants.filter((r) => !isOpenAt(r, minutes)).slice(0, 2);
  const trusted = TRUSTED_MARKETS.flatMap((t) => { const m = markets.find((x) => x.slug === t.slug); return m ? [{ ...m, featured: t.featured }] : []; });
  const promoGroups: PromoGroup[] = PROMO_MARKETS.flatMap((slug, i) => {
    const m = markets.find((x) => x.slug === slug);
    return m ? [{ label: m.name, initials: m.initials, color: m.color === "primary" ? undefined : `var(--${m.color})`, logo: `/brand/stores/${m.slug}.jpg`, store: cartStoreOf(m, "mercado"), products: promos[i].map((p) => marketCard(p)) }] : [];
  });
  return (
    <div className="page-x flex flex-col gap-8 pt-4 desktop:gap-12 desktop:pt-7">
      <DeliveryBar zone={delivery.zone} hidden={hidden} />
      {/* Banner de campaña (en escritorio comparte fila con la tarjeta del demo) */}
      <div className="grid gap-6 desktop:grid-cols-[2fr_1fr]">
        <PromoBanner
          className="nm-banner--hero"
          eyebrow={content.eyebrow}
          title={content.title}
          image="/brand/guacamaya-moto.png"
          slides={3}
        />
        <aside className="hidden flex-col justify-between gap-5 rounded-lg bg-surface-warm p-7 desktop:flex desktop:h-[290px] border border-border/40 shadow-card transition-all duration-300 hover:shadow-hover">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Badge tone="promo">Demo de portafolio</Badge>
            </div>
            <h2 className="font-display text-[26px] leading-[1.2] font-extrabold text-ink tracking-tight">Pide como si estuvieras en Caracas</h2>
            <p className="text-body text-ink-muted leading-relaxed">Las tiendas siguen la hora de Caracas. Si todo está cerrado, cambia de franja con el modo demo.</p>
          </div>
          <Link href="/acerca" className="nm-btn nm-btn--secondary self-start bg-surface border border-border/80 shadow-xs transition-transform hover:scale-105 active:scale-95">Cómo funciona</Link>
        </aside>
      </div>

      {/* Verticales: móvil 2 grandes + fila de pequeñas; escritorio 6 en rejilla */}
      <section aria-label="Categorías" className="flex flex-col gap-3 desktop:hidden">
        <div className="grid grid-cols-2 gap-3">
          {VERTICALS.slice(0, 2).map((v, i) => (
            <Link key={v.title} href={verticalHref(i)} className="flex"><CategoryTile className="w-full" size="lg" title={v.title} icon={v.icon} tone={v.tone} image={v.image} /></Link>
          ))}
        </div>
        <div className="scroll-x -mx-4 flex gap-3 px-4">
          {VERTICALS.slice(2).map((v, i) => <Link key={v.title} href={verticalHref(i + 2)} className="flex shrink-0"><CategoryTile className="w-33 shrink-0" title={v.title} icon={v.icon} tone={v.tone} image={v.image} /></Link>)}
        </div>
      </section>
      <section aria-label="Categorías" className="hidden grid-cols-6 gap-4 desktop:grid">
        {VERTICALS.map((v, i) => (
          <Link key={v.title} href={verticalHref(i)} className="flex"><CategoryTile className="w-full" title={v.title} icon={v.icon} tone={v.tone} image={v.image} /></Link>
        ))}
      </section>
      <section className="flex flex-col gap-4 desktop:gap-5">
        <SectionHeader title="¿Qué se te antoja?" />
        <div className="scroll-x -mx-4 flex gap-4 px-4 py-2 desktop:mx-0 desktop:gap-5 desktop:px-0">
          {content.chips.map((c) => {
            const tag = chipTag(c.label);
            return <Link key={c.label} href={tag ? `/listado?chip=${tag}` : "/listado"} className="shrink-0"><CuisineChip icon={c.icon} label={c.label} /></Link>;
          })}
        </div>
      </section>

      <section className="flex flex-col gap-4 desktop:gap-5">
        <SectionHeader title={content.sectionTitle} action="Ver todo" href="/listado" />
        <div className="scroll-x -mx-4 flex gap-4 px-4 desktop:mx-0 desktop:grid desktop:grid-cols-3 desktop:gap-6 desktop:overflow-visible desktop:px-0">
          {openStores.map((r) => (
            <Link key={r.slug} href={`/tienda/${r.slug}`} className="flex shrink-0 flex-col desktop:shrink">
              <RestaurantCard
                className="desktop:w-full"
                name={r.name}
                image={r.imageUrl ?? ""}
                logo={`/brand/stores/${r.slug}.jpg`}
                initials={r.initials}
                rating={r.rating ?? ""}
                time={r.time}
                fee={formatUsd(r.feeCents)}
                plusFree={r.plusFree}
              />
            </Link>
          ))}
        </div>

        <h3 className="mt-2 font-display text-title-md">Abren más tarde</h3>
        <div className="grid gap-3 desktop:grid-cols-2 desktop:gap-4">
          {closedStores.map((r) => (
            <Link
              key={r.slug}
              href={`/tienda/${r.slug}`}
              className="group flex flex-col justify-between gap-3 rounded-lg border border-border p-3 transition-colors hover:border-ink/20 hover:bg-surface-tile/40 tablet:flex-row tablet:items-center tablet:gap-4 desktop:p-3.5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <StoreMark initials={r.initials} color={r.color} slug={r.slug} dim />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-body-strong font-bold text-ink transition-colors group-hover:text-primary-text">{r.name}</span>
                  <span className="truncate text-caption text-ink-muted">{r.description}</span>
                </span>
              </div>
              <span className="flex w-fit shrink-0 items-center gap-1.5 self-start rounded-pill bg-surface-tile px-2.5 py-1.5 text-badge text-ink whitespace-nowrap tablet:self-auto [&_.nm-icon]:size-4">
                <Icon name="clock" />
                {opensText(r, minutes)}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-1">
        <SectionHeader title="Mercados de confianza" action="Ver todo" href="/listado?v=1" />
        <p className="text-caption text-ink-muted desktop:hidden">Abastos, bodegones y farmacias abiertos todo el día.</p>
        <div className="scroll-x -mx-4 flex gap-4 px-4 pt-4 desktop:mx-0 desktop:gap-6 desktop:px-0">
          {trusted.map((m) => (
            <StoreLogo key={m.slug} href={`/mercado/${m.slug}`} name={m.name} logo={`/brand/stores/${m.slug}.jpg`} initials={m.initials} color={m.slug === "nami-market" ? undefined : `var(--${m.color})`} featured={m.featured} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader title="Promociones del día" action="Ver todo" href="/ofertas" />
        <PromoTabs groups={promoGroups} money={money} />
      </section>
    </div>
  );
}
