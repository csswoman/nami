import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Badge, Icon, SearchBar } from "@/components/nami";
import { AppShell } from "@/components/shell/AppShell";
import { BackIcon, RoundLink, SearchLink } from "@/components/shell/ScreenBar";
import { NotCoveredNotice } from "@/components/shell/NotCoveredNotice";
import { FavoriteButton } from "@/components/shell/FavoriteButton";
import { StoreMark } from "@/components/shell/StoreMark";
import { AddButton } from "@/components/cart/AddButton";
import { StoreCart } from "@/components/cart/StoreCart";
import { cartStoreOf } from "@/lib/cart/meta";
import type { CartStore } from "@/lib/cart/store";
import { caracasMinutes, hoursText, isOpenAt, opensText, soldOutLabel, type CatalogProduct } from "@/lib/catalog";
import { DEMO_RATE } from "@/lib/demo/home";
import { formatDistance } from "@/lib/geo";
import { formatMoney, formatUsd, formatVes, type Currency } from "@/lib/money";
import { getStore } from "@/server/catalog";
import { listReviews } from "@/server/reviews";
import { getDeliveryContext, getMoneyPrefs } from "@/server/prefs";

export async function generateMetadata({ params }: PageProps<"/tienda/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStore(slug);
  if (!store || store.kind !== "restaurante") return { title: "Tienda · Ñami" };

  const title = `${store.name} · Ñami`;
  const description = `${store.description} · Entrega en ${store.time} · Calificación ${store.rating ?? "nueva"}. Pide en Ñami.`;
  return {
    title,
    description,
    alternates: { canonical: `/tienda/${slug}` },
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export default function TiendaPage({ params, searchParams }: PageProps<"/tienda/[slug]">) {
  return (
    <Suspense fallback={<AppShell mobileHeader={false} bottomNav={false}><div className="min-h-dvh" aria-busy="true" /></AppShell>}>
      <Content params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({ params, searchParams }: Pick<PageProps<"/tienda/[slug]">, "params" | "searchParams">) {
  await connection();
  const { slug } = await params;
  const sp = await searchParams;
  const money = await getMoneyPrefs();
  const delivery = await getDeliveryContext();
  const base = await getStore(slug, delivery);
  if (!base || base.kind !== "restaurante") notFound();
  // Abierta = interruptor manual encendido y dentro del horario semanal. Demo: ?estado=cerrada fuerza cerrada.
  const minutes = caracasMinutes();
  const open = sp.estado === "cerrada" ? false : base.isOpen && isOpenAt(base, minutes);
  const store = { ...base, open, menu: base.sections, openUntil: hoursText(base, minutes), opensAt: opensText(base, minutes), rating: base.rating ?? "Nuevo", reviews: base.reviews ?? "0" };
  const recentReviews = await listReviews(base.id, 4);
  const cartStore = cartStoreOf({ ...store, opensAt: store.opensAt });
  const scheduleText = store.opensAt.replace("Abre mañana a las", "mañana a las").replace("Abre a las", "hoy a las").replace("Abre el", "el");

  return (
    <AppShell mobileHeader={false} bottomNav={false}>
      <div className="mx-auto w-full desktop:max-w-316 desktop:px-8 desktop:pt-6">
        {/* Hero de tienda */}
        <div className="relative desktop:overflow-hidden desktop:rounded-xl desktop:p-6">
          <div className="relative h-52 overflow-hidden bg-surface-tile desktop:static desktop:h-auto desktop:overflow-visible desktop:bg-transparent">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={store.imageUrl ?? ""} alt="" className={`size-full object-cover desktop:absolute desktop:inset-0 ${store.open ? "" : "grayscale"}`} />
            <div className="absolute inset-x-4 top-4 flex gap-2 desktop:relative desktop:inset-auto">
              <span className="desktop:hidden"><RoundLink href="/listado" label="Volver" onTile><BackIcon /></RoundLink></span>
              <Link href="/listado" className="hidden min-h-11 items-center gap-1 rounded-pill bg-surface-raised pr-4 pl-2.5 text-button text-ink shadow-card desktop:flex [&_.nm-icon]:size-5">
                <BackIcon />Volver
              </Link>
              <span className="grow" />
              <span className="desktop:hidden"><SearchLink /></span>
              <FavoriteButton target={{ kind: "store", slug: store.slug }} name={store.name} />
            </div>
          </div>

          {/* Ficha */}
          <div className="relative -mt-10 rounded-t-xl bg-surface px-4 desktop:mt-14 desktop:rounded-lg desktop:bg-surface-raised desktop:p-5 desktop:shadow-card">
            <div className="flex items-end gap-4 desktop:items-center desktop:gap-5">
              <span className="grid size-22 shrink-0 place-items-center rounded-xl border border-border bg-surface shadow-card desktop:size-auto desktop:border-0 desktop:bg-transparent desktop:shadow-none">
                <StoreMark initials={store.initials} color={store.color} slug={store.slug} size={68} />
              </span>
              <div className="flex min-w-0 grow flex-col gap-1.5 pb-1 desktop:gap-1 desktop:pb-0">
                <h1 className="font-display text-[26px] leading-8 font-extrabold desktop:text-[32px] desktop:leading-9.5">{store.name}</h1>
                <p className="text-caption text-ink-muted desktop:hidden">{store.description}</p>
                <div className="hidden flex-wrap gap-x-4 gap-y-1.5 text-caption text-ink-muted desktop:flex [&_.nm-icon]:size-4">
                  <span>{store.description}</span>
                  <span className="flex items-center gap-1 font-bold text-ink"><Icon name="star" />{store.rating} <span className="font-medium text-ink-muted">({store.reviews})</span></span>
                  <span className="flex items-center gap-1"><Icon name="clock" />{store.time}</span>
                  <span className="flex items-center gap-1"><Icon name="moto" />{formatUsd(store.feeCents)} · {formatVes(store.feeCents, DEMO_RATE)}{store.delivery?.distanceM ? ` · ${formatDistance(store.delivery.distanceM)}` : ""}</span>
                  <span><b className={store.open ? "text-success" : "text-danger"}>{store.open ? "Abierto" : "Cerrado"}</b> · {store.open ? store.openUntil : store.opensAt}</span>
                </div>
              </div>
              <div className="hidden shrink-0 gap-2 desktop:flex">
                <Badge>Envío $ 0 desde $ 12</Badge>
                <Badge tone="success">Mismo precio que en local</Badge>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-caption text-ink-muted desktop:hidden [&_.nm-icon]:size-4">
              <span className="flex items-center gap-1 font-bold text-ink"><Icon name="star" />{store.rating} <span className="font-medium text-ink-muted">({store.reviews})</span></span>
              <span className="flex items-center gap-1"><Icon name="clock" />{store.time}</span>
              <span className="flex items-center gap-1"><Icon name="moto" />{formatUsd(store.feeCents)} · {formatVes(store.feeCents, DEMO_RATE)}{store.delivery?.distanceM ? ` · ${formatDistance(store.delivery.distanceM)}` : ""}</span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 rounded-md bg-surface-tile px-4 py-3 text-body-strong desktop:hidden">
              <span><b className={store.open ? "text-success" : "text-danger"}>{store.open ? "Abierto" : "Cerrado"}</b> · {store.open ? store.openUntil : store.opensAt}</span>
              <span className="text-caption font-medium text-ink-muted">Mín. {formatUsd(store.minOrderCents)}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 desktop:hidden">
              <Badge>Envío $ 0 desde $ 12</Badge>
              <Badge tone="success">Mismo precio que en local</Badge>
            </div>
          </div>
        </div>

        <div className="px-4 desktop:px-0">
          <div className="mt-3 empty:hidden"><NotCoveredNotice store={store} zone={delivery.zone} /></div>
          <p className="mt-3 text-caption text-ink-muted">¿Eres de {store.name}? <Link href={`/tienda-admin/${store.slug}`} className="font-bold text-primary-text underline">Abre el panel de esta tienda</Link> (demo, sin login).</p>
          {!store.open ? (
            <div className="mt-4 flex flex-col gap-3 rounded-lg bg-surface-warm p-4">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-pill bg-ink text-surface [&_.nm-icon]:size-5"><Icon name="clock" /></span>
                <div>
                  <p className="font-display text-title-md">{store.name} está cerrada ahora</p>
                  <p className="text-caption text-ink-muted">{store.opensAt}. Agrega lo que quieras y tu pedido queda programado para {scheduleText}.</p>
                </div>
              </div>
              <a href={`#${store.menu[0]?.id ?? ""}`} className="nm-btn nm-btn--secondary nm-btn--block"><Icon name="clock" />Programar para {scheduleText}</a>
            </div>
          ) : null}
        </div>

        {recentReviews.length ? (
          <section aria-label="Reseñas" className="mx-4 mt-6 flex flex-col gap-3 desktop:mx-0">
            <h2 className="font-display text-title-lg">Lo que dicen los clientes</h2>
            <ul className="grid gap-3 desktop:grid-cols-2">
              {recentReviews.map((r, i) => (
                <li key={i} className="flex flex-col gap-1 rounded-lg border border-border p-4">
                  <span className="flex items-center gap-2"><span aria-label={`${r.rating} de 5 estrellas`} className="text-body-strong">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span><span className="text-caption text-ink-muted">{new Date(r.createdAt).toLocaleDateString("es-VE", { day: "numeric", month: "short" })}</span></span>
                  {r.tags.length ? <span className="text-caption text-ink-muted">{r.tags.join(" · ")}</span> : null}
                  {r.comment ? <p className="text-body">{r.comment}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {/* Menú */}

        {/* Menú */}
        <div className="px-4 desktop:grid desktop:grid-cols-[220px_minmax(0,1fr)_340px] desktop:items-start desktop:gap-8 desktop:px-0 desktop:pt-9">
          <nav aria-label="Categorías del menú" className="nm-tabs scroll-x sticky top-0 z-10 mt-4 bg-surface desktop:hidden">
            {store.menu.map((s, i) => <a key={s.id} href={`#${s.id}`} role="tab" aria-selected={i === 0} className="nm-tab">{s.title}</a>)}
          </nav>
          <nav aria-label="Categorías del menú" className="sticky top-6 hidden flex-col gap-1 desktop:flex">
            {store.menu.map((s, i) => (
              <a key={s.id} href={`#${s.id}`} className={`flex min-h-11 items-center rounded-md px-3.5 text-body ${i === 0 ? "bg-primary-tint font-bold" : "font-medium"}`}>{s.title}</a>
            ))}
          </nav>

          <div className="flex flex-col gap-9 pt-4 desktop:pt-0">
            <div className="hidden desktop:block"><SearchBar placeholder={`Buscar en el menú de ${store.name}`} /></div>
            {store.menu.map((s) => (
              <section key={s.id} id={s.id} className="flex scroll-mt-16 flex-col gap-1 desktop:gap-4">
                <h2 className="py-3 font-display text-title-lg desktop:py-0 desktop:text-[24px] desktop:leading-7.5">{s.title}</h2>
                <div className="flex flex-col desktop:grid desktop:grid-cols-2 desktop:gap-4">
                  {s.products.map((it) => <MenuCard key={it.id} item={it} store={cartStore} hasOptions={it.hasOptions} slug={store.slug} money={money} />)}
                </div>
              </section>
            ))}
          </div>

          {/* Tu pedido (escritorio) */}
          <StoreCart variant="aside" store={cartStore} scheduleText={store.open ? undefined : scheduleText} />
        </div>
      </div>

      {/* Barra de acción (móvil) */}
      <div className="fixed inset-x-0 bottom-0 z-20 bg-surface p-4 shadow-nav desktop:hidden">
        <StoreCart variant="bar" store={cartStore} scheduleText={store.open ? undefined : scheduleText} />
      </div>
    </AppShell>
  );
}

function MenuCard({ item, slug, store, hasOptions, money }: { item: CatalogProduct; slug: string; store: CartStore; hasOptions: boolean; money: { currency: Currency; rate: number } }) {
  const other: Currency = money.currency === "USD" ? "VES" : "USD";
  const out = item.soldOut;
  return (
    <article className={`relative flex min-h-26 gap-4 border-b border-border py-4 desktop:rounded-lg desktop:border desktop:p-4 ${out ? "opacity-50" : ""}`}>
      <div className="flex min-w-0 grow flex-col gap-1">
        <h3 className="text-body-strong font-semibold">
          {out ? item.name : <Link href={`/tienda/${slug}/${item.id}`} className="after:absolute after:inset-0">{item.name}</Link>}
        </h3>
        <p className="text-caption font-normal text-ink-muted">{item.description}</p>
        <div className="mt-auto flex items-baseline gap-2 pt-1.5 whitespace-nowrap">
          <span className="text-price">{formatMoney(item.priceCents, money.currency, money.rate)}</span>
          <span className="text-caption text-ink-muted">{formatMoney(item.priceCents, other, money.rate)}</span>
        </div>
        {item.stock ? <span className="text-badge text-primary-text">Quedan {item.stock}</span> : null}
        {out ? <span className="self-start rounded-pill bg-surface-tile px-2.5 py-1 text-badge">{soldOutLabel(item.soldOutUntil)}</span> : null}
      </div>
      <div className="relative size-26 shrink-0 overflow-hidden rounded-md bg-surface-tile">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt="" className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center text-ink [&_.nm-icon]:size-10"><Icon name={item.icon ?? "utensils"} /></span>
        )}
        {!out ? (
          <AddButton className="absolute -right-1.5 -bottom-1.5 z-[1]" store={store} hasOptions={hasOptions} href={`/tienda/${slug}/${item.id}`} item={{ id: item.id, name: item.name, priceCents: item.priceCents, icon: item.icon ?? "utensils", image: item.image ?? undefined }} />
        ) : null}
      </div>
    </article>
  );
}
