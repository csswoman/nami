import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Icon } from "@/components/nami";
import { MarketProductCard } from "@/components/cart/MarketProductCard";
import { StoreCart } from "@/components/cart/StoreCart";
import { cartStoreOf } from "@/lib/cart/meta";
import { AppShell } from "@/components/shell/AppShell";
import { BackIcon, RoundLink } from "@/components/shell/ScreenBar";
import { FavoriteButton } from "@/components/shell/FavoriteButton";
import { StoreMark } from "@/components/shell/StoreMark";
import { hoursText, LISTING_TABS, marketCard } from "@/lib/catalog";
import { DEMO_RATE } from "@/lib/demo/home";
import { formatDistance } from "@/lib/geo";
import { formatUsd, formatVes } from "@/lib/money";
import { NotCoveredNotice } from "@/components/shell/NotCoveredNotice";
import { getStore } from "@/server/catalog";
import { getDeliveryContext, getMoneyPrefs } from "@/server/prefs";

export async function generateMetadata({ params }: PageProps<"/mercado/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const m = await getStore(slug);
  if (!m || m.kind !== "mercado") return { title: "Mercado · Ñami" };

  const title = `${m.name} · Ñami`;
  const description = `${m.description} en Ñami · Entrega en ${m.time} · ${hoursText(m)}.`;
  return {
    title,
    description,
    alternates: { canonical: `/mercado/${slug}` },
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export default function MercadoPage({ params }: PageProps<"/mercado/[slug]">) {
  return (
    <Suspense fallback={<AppShell mobileHeader={false} bottomNav={false}><div className="min-h-dvh" aria-busy="true" /></AppShell>}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/mercado/[slug]">["params"] }) {
  await connection();
  const { slug } = await params;
  const delivery = await getDeliveryContext();
  const m = await getStore(slug, delivery);
  if (!m || m.kind !== "mercado") notFound();
  const money = await getMoneyPrefs();
  const cartStore = cartStoreOf({ slug: m.slug, name: m.name, initials: m.initials, color: m.color, feeCents: m.feeCents, minOrderCents: m.minOrderCents }, "mercado");
  const tab = m.verticals[0] ?? 1;
  const back = { href: `/listado?v=${tab}`, label: LISTING_TABS[tab] };

  const meta = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-ink-muted [&_.nm-icon]:size-4">
      <span className="font-bold text-success">{hoursText(m)}</span>
      <span className="flex items-center gap-1"><Icon name="clock" />{m.time}</span>
      <span className="flex items-center gap-1"><Icon name="moto" />{formatUsd(m.feeCents)} · {formatVes(m.feeCents, DEMO_RATE)}{m.delivery?.distanceM ? ` · ${formatDistance(m.delivery.distanceM)}` : ""}</span>
    </div>
  );
  const searchBox = (
    <form action="/busqueda" role="search" className="relative flex h-10 w-full items-center rounded-pill border border-border/70 bg-surface-raised pl-3.5 pr-1 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-focus-ring/30 focus-within:shadow-card desktop:h-10.5">
      <input
        type="search"
        name="q"
        placeholder={`Buscar en ${m.name}…`}
        aria-label={`Buscar en ${m.name}`}
        className="w-full min-w-0 bg-transparent text-caption font-sans text-ink placeholder:text-ink-muted outline-none pr-2 desktop:text-body"
      />
      <button
        className="grid size-8 shrink-0 place-items-center rounded-pill bg-primary text-on-primary transition-transform active:scale-90 hover:brightness-105"
        type="submit"
        aria-label="Buscar"
      >
        <Icon name="search" className="size-4" />
      </button>
    </form>
  );

  return (
    <AppShell mobileHeader={false} bottomNav={false}>
      {/* Hero de marca */}
      <div className="desktop:mx-auto desktop:w-full desktop:max-w-316 desktop:px-8 desktop:pt-6 desktop:pb-6">
        <div className="desktop:relative desktop:overflow-hidden desktop:rounded-xl desktop:p-5" style={{ background: `var(--${m.color})` }}>
          <div className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(circle_at_88%_20%,rgba(255,255,255,0.18),transparent_55%)] desktop:block" aria-hidden="true" />
          <div className="relative h-24 px-4 pt-3 desktop:h-auto desktop:px-0 desktop:pt-0">
            <div className="flex items-center">
              <span className="desktop:hidden"><RoundLink href={back.href} label="Volver" onTile><BackIcon /></RoundLink></span>
              <Link href={back.href} className="hidden min-h-11 items-center gap-1 rounded-pill bg-surface-raised pr-4 pl-2.5 text-button text-ink shadow-card desktop:flex [&_.nm-icon]:size-5"><BackIcon />{back.label}</Link>
              <span className="grow" />
              <FavoriteButton target={{ kind: "store", slug: m.slug }} name={m.name} />
            </div>
          </div>

          <div className="relative -mt-5 rounded-t-xl bg-surface px-4 pt-3 pb-4 desktop:mt-4 desktop:rounded-xl desktop:bg-surface-raised desktop:p-5 desktop:shadow-card">
            <div className="flex flex-col gap-3 desktop:flex-row desktop:items-center desktop:gap-5">
              <span className="-mt-8 w-fit rounded-xl bg-surface-raised p-1.5 shadow-card desktop:mt-0 desktop:bg-transparent desktop:p-0 desktop:shadow-none"><StoreMark initials={m.initials} color={m.color} slug={m.slug} size={64} /></span>
              <div className="flex min-w-0 grow flex-col gap-1">
                <div className="flex items-baseline gap-2 desktop:flex-col desktop:gap-0.5">
                  <h1 className="font-display text-[22px] leading-7 font-extrabold desktop:text-[28px] desktop:leading-8.5">{m.name}</h1>
                  <span className="text-caption text-ink-muted desktop:hidden">{m.description} · {m.area}</span>
                </div>
                <div className="hidden text-body text-ink-muted desktop:block">{m.description} · {m.area}</div>
                {meta}
                <NotCoveredNotice store={m} zone={delivery.zone} />
              </div>
              <div className="desktop:w-72 desktop:shrink-0">{searchBox}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-x grid grid-cols-1 gap-8 pb-28 desktop:grid-cols-[220px_minmax(0,1fr)_330px] desktop:items-start desktop:gap-8 desktop:pb-12">
        {/* Categorías */}
        <nav aria-label="Categorías" className="scroll-x -mx-4 flex gap-2 px-4 desktop:sticky desktop:top-6 desktop:mx-0 desktop:flex-col desktop:gap-1 desktop:px-0">
          {m.sections.map((s, i) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`flex min-h-10 shrink-0 items-center rounded-pill px-4 text-button transition-colors desktop:rounded-md desktop:px-3.5 desktop:text-body ${
                i === 0
                  ? "bg-primary-tint font-bold text-primary-text"
                  : "bg-surface-tile text-ink desktop:bg-transparent hover:desktop:bg-surface-tile"
              }`}
            >
              {s.title}
            </a>
          ))}
        </nav>

        <div className="flex min-w-0 flex-col gap-8">
          {m.sections.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`t-${s.id}`} className="flex scroll-mt-4 flex-col gap-4">
              <div className="flex items-baseline justify-between">
                <h2 id={`t-${s.id}`} className="font-display text-[22px] leading-7 font-extrabold desktop:text-[26px] desktop:leading-8">{s.title}</h2>
                <Link href={`/busqueda?q=${encodeURIComponent(s.title.split(" ")[0])}`} className="text-button text-primary-text hover:underline">Ver todo</Link>
              </div>
              <div className="grid grid-cols-2 gap-x-3.5 gap-y-5 sm:grid-cols-3 desktop:grid-cols-3 desktop:gap-x-5 desktop:gap-y-6">
                {s.products.map((p) => <MarketProductCard key={p.id} store={cartStore} p={marketCard(p)} money={money} />)}
              </div>
            </section>
          ))}
        </div>

        {/* Tu mercado (escritorio) */}
        <StoreCart variant="aside" label="Tu mercado" store={cartStore} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 bg-surface p-4 shadow-nav desktop:hidden">
        <StoreCart variant="bar" store={cartStore} />
      </div>
    </AppShell>
  );
}
