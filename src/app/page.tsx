import Link from "next/link";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { Suspense } from "react";
import { Badge, CategoryTile, CuisineChip, Icon, type IconName, PromoBanner, SectionHeader, StoreLogo } from "@/components/nami";
import { BannerRail, DiscoverRail, FlashCard, PopularTiles, ThemedPanel, type GeoBanner } from "@/components/home/HomeBlocks";
import { AppShell } from "@/components/shell/AppShell";
import { DeliveryBar } from "@/components/shell/DeliveryBar";
import { StoreMark } from "@/components/shell/StoreMark";
import { caracasNow, FRANJA_COOKIE, horaToMinutes, resolveFranja, type Franja } from "@/lib/demo/franja";
import { PromoTabs, type PromoGroup } from "@/components/cart/PromoTabs";
import { cartStoreOf } from "@/lib/cart/meta";
import { isOpenAt, marketCard, opensText } from "@/lib/catalog";
import { chipTag } from "@/lib/demo/catalog";
import { FRANJA_CONTENT, TRUSTED_MARKETS, VERTICALS } from "@/lib/demo/home";
import { getPromos, getStores } from "@/server/catalog";
import { getDeliveryContext, getMoneyPrefs } from "@/server/prefs";

const PROMO_MARKETS = ["nami-market", "abasto-el-saman", "automercado-avila", "bodegon-la-candelaria", "farmacia-san-onofre", "farmacia-los-proceres"];
/** Cada tarjeta de categoría abre la pestaña del listado con ese índice (?v=). */
const verticalHref = (i: number) => (i === 0 ? "/listado" : `/listado?v=${i}`);
/** Icono del panel temático según la franja. */
const FRANJA_ICON: Record<Franja, IconName> = { desayuno: "cafe", almuerzo: "utensils", merienda: "golfeado", cena: "pabellon", noche: "perro-caliente" };
/** Banners secundarios: cupones reales del seed (`SEED_COUPONS`) y Ñami Market. */
const SIDE_BANNERS: GeoBanner[] = [
  { tag: "NAMI10", title: "10 % menos en tu pedido", text: "En pedidos desde $ 10. Úsalo al pagar.", href: "/listado", image: "/brand/collages/collage-comida.jpg", tone: "primary" },
  { title: "Ñami Market", text: "Lo básico del hogar sin salir de casa.", href: "/mercado/nami-market", image: "/brand/collages/collage-super.jpg", tone: "leaf" },
  { tag: "ENVIOGRATIS", title: "Envío gratis", text: "Farmacia, ferretería y mascotas desde $ 12.", href: "/listado?v=2", image: "/brand/collages/collage-farmacia_ferreteria_mascotas.jpg", tone: "plus" },
];

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
  const byRating = <T extends { rating: string | null }>(a: T, b: T) => rate(b) - rate(a);
  const openAll = restaurants.filter((r) => isOpenAt(r, minutes)).sort(byRating);
  const closedAll = restaurants.filter((r) => !isOpenAt(r, minutes));
  // Cada sección muestra tiendas distintas: panel (3 mejores abiertas), descubre (las siguientes).
  const openStores = openAll.slice(0, 3);
  const discover = openAll.slice(3, 7);
  const popular = [...openAll, ...[...closedAll].sort(byRating)].slice(0, 6);
  const closedStores = closedAll.slice(0, 2);
  const trusted = TRUSTED_MARKETS.flatMap((t) => { const m = markets.find((x) => x.slug === t.slug); return m ? [{ ...m, featured: t.featured }] : []; });
  // Descuento real más alto entre las promociones del día (para la tarjeta amarilla).
  const maxOff = Math.max(0, ...promos.flat().map((p) => (p.oldPriceCents ? Math.round((1 - p.priceCents / p.oldPriceCents) * 100) : 0)));
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
          className="nm-banner--hero nm-banner--geo"
          eyebrow={content.eyebrow}
          title={content.title}
          image="/brand/guacamaya-moto.png"
          slides={3}
        />
        <aside className="hidden flex-col justify-between gap-3 rounded-lg bg-surface-warm p-6 desktop:flex desktop:h-[280px] border border-border/40 shadow-card transition-all duration-300 hover:shadow-hover">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Badge tone="promo">Demo de portafolio</Badge>
            </div>
            <h2 className="font-display text-[24px] leading-[30px] font-extrabold text-ink tracking-tight">Pide como si estuvieras en Caracas</h2>
            <p className="text-body text-ink-muted leading-snug">Las tiendas siguen la hora de Caracas. Si todo está cerrado, cambia de franja con el modo demo.</p>
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
          {VERTICALS.slice(2).map((v, i) => <Link key={v.title} href={verticalHref(i + 2)} className="flex shrink-0"><CategoryTile className="w-24 shrink-0" title={v.title} icon={v.icon} tone={v.tone} image={v.image} /></Link>)}
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

      {/* Populares: cuadrados con el logo al centro */}
      {popular.length ? (
        <section className="flex flex-col gap-4 desktop:gap-5">
          <SectionHeader title="Los más populares" action="Ver todo" href="/listado" />
          <PopularTiles stores={popular} badgeOf={(s) => (s.plusFree ? <Badge tone="promo">Envío $ 0</Badge> : null)} />
        </section>
      ) : null}

      {/* Tarjeta amarilla de ofertas + banners de cupones */}
      <div className="grid gap-6 desktop:grid-cols-[1fr_2fr] desktop:items-center">
        {maxOff > 0 ? (
          <FlashCard pill="OFERTAS DE HOY" title={`Ahorra hasta ${maxOff} %`} text="Descuentos en mercados, bodegones y farmacias." cta="Ver ofertas" href="/ofertas" image="/brand/guacamaya-celebra.png" />
        ) : null}
        <BannerRail banners={maxOff > 0 ? SIDE_BANNERS.slice(0, 2) : SIDE_BANNERS} />
      </div>

      {/* Panel temático de la franja */}
      {openStores.length ? (
        <ThemedPanel icon={FRANJA_ICON[franja]} eyebrow={content.label} title={content.sectionTitle} href="/listado" stores={openStores} />
      ) : null}

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

      {/* Descubre: fotos grandes con esquinas alternas */}
      {discover.length ? (
        <section className="flex flex-col gap-4 desktop:gap-5">
          <SectionHeader title="Descubre estas opciones" action="Ver todo" href="/listado" />
          <DiscoverRail stores={discover} />
        </section>
      ) : null}

      {closedStores.length ? (
        <section className="flex flex-col gap-4">
          <SectionHeader title="Abren más tarde" />
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
      ) : null}
    </div>
  );
}
