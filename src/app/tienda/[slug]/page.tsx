import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Badge, Icon, SearchBar } from "@/components/nami";
import { AppShell } from "@/components/shell/AppShell";
import { BackIcon, RoundLink, SearchLink } from "@/components/shell/ScreenBar";
import { StoreMark } from "@/components/shell/StoreMark";
import { AddButton } from "@/components/cart/AddButton";
import { StoreCart } from "@/components/cart/StoreCart";
import { cartStoreOf } from "@/lib/cart/meta";
import type { CartStore } from "@/lib/cart/store";
import { optionGroupsFor } from "@/lib/demo/producto";
import { getStore, type MenuItem, type StoreDetail } from "@/lib/demo/catalog";
import { DEMO_RATE } from "@/lib/demo/home";
import { formatUsd, formatVes } from "@/lib/money";

export async function generateMetadata({ params }: PageProps<"/tienda/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const store = getStore(slug);
  if (!store) return { title: "Tienda · Ñami" };

  const title = `${store.name} · Ñami`;
  const description = `${store.kind} · Entrega en ${store.time} · Calificación ${store.rating}. Pide en Ñami.`;
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
  const { slug } = await params;
  const sp = await searchParams;
  const base = getStore(slug);
  if (!base) notFound();
  // Demo: ?estado=cerrada muestra la tienda cerrada. La lógica real decidirá esto por horario.
  const store: StoreDetail = { ...base, open: sp.estado === "cerrada" ? false : base.open };

  const cartStore = cartStoreOf(store);
  const scheduleText = store.opensAt.replace("Abre mañana a las", "mañana a las").replace("Abre a las", "hoy a las");

  return (
    <AppShell mobileHeader={false} bottomNav={false}>
      <div className="mx-auto w-full desktop:max-w-316 desktop:px-8 desktop:pt-6">
        {/* Hero de tienda */}
        <div className="relative desktop:overflow-hidden desktop:rounded-xl desktop:p-6">
          <div className="relative h-52 overflow-hidden bg-surface-tile desktop:static desktop:h-auto desktop:overflow-visible desktop:bg-transparent">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/brand/food/${store.heroImage}.svg`} alt="" className={`size-full object-cover desktop:absolute desktop:inset-0 ${store.open ? "" : "grayscale"}`} />
            <div className="absolute inset-x-4 top-4 flex gap-2 desktop:relative desktop:inset-auto">
              <span className="desktop:hidden"><RoundLink href="/listado" label="Volver" onTile><BackIcon /></RoundLink></span>
              <Link href="/listado" className="hidden min-h-11 items-center gap-1 rounded-pill bg-surface-raised pr-4 pl-2.5 text-button text-ink shadow-card desktop:flex [&_.nm-icon]:size-5">
                <BackIcon />Volver
              </Link>
              <span className="grow" />
              <span className="desktop:hidden"><SearchLink /></span>
              <span className="desktop:hidden"><IconCircle label="Guardar en favoritos" icon="star" /></span>
            </div>
          </div>

          {/* Ficha */}
          <div className="relative -mt-10 rounded-t-xl bg-surface px-4 desktop:mt-14 desktop:rounded-lg desktop:bg-surface-raised desktop:p-5 desktop:shadow-card">
            <div className="flex items-end gap-4 desktop:items-center desktop:gap-5">
              <span className="grid size-22 shrink-0 place-items-center rounded-xl border border-border bg-surface shadow-card desktop:size-auto desktop:border-0 desktop:bg-transparent desktop:shadow-none">
                <StoreMark initials={store.initials} color={store.color} size={68} />
              </span>
              <div className="flex min-w-0 grow flex-col gap-1.5 pb-1 desktop:gap-1 desktop:pb-0">
                <h1 className="font-display text-[26px] leading-8 font-extrabold desktop:text-[32px] desktop:leading-9.5">{store.name}</h1>
                <p className="text-caption text-ink-muted desktop:hidden">{store.kind}</p>
                <div className="hidden flex-wrap gap-x-4 gap-y-1.5 text-caption text-ink-muted desktop:flex [&_.nm-icon]:size-4">
                  <span>{store.kind}</span>
                  <span className="flex items-center gap-1 font-bold text-ink"><Icon name="star" />{store.rating} <span className="font-medium text-ink-muted">({store.reviews})</span></span>
                  <span className="flex items-center gap-1"><Icon name="clock" />{store.time}</span>
                  <span className="flex items-center gap-1"><Icon name="moto" />{formatUsd(store.feeCents)} · {formatVes(store.feeCents, DEMO_RATE)}</span>
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
              <span className="flex items-center gap-1"><Icon name="moto" />{formatUsd(store.feeCents)} · {formatVes(store.feeCents, DEMO_RATE)}</span>
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
                  {s.items.map((it) => <MenuCard key={it.id} item={it} store={cartStore} hasOptions={optionGroupsFor(s.id).length > 0} slug={store.slug} />)}
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

function IconCircle({ label, icon }: { label: string; icon: "star" }) {
  return (
    <button type="button" aria-label={label} className="grid size-11 place-items-center rounded-pill bg-surface-raised text-ink shadow-card [&_.nm-icon]:size-5">
      <Icon name={icon} />
    </button>
  );
}

function MenuCard({ item, slug, store, hasOptions }: { item: MenuItem; slug: string; store: CartStore; hasOptions: boolean }) {
  const out = item.soldOut;
  return (
    <article className={`relative flex min-h-26 gap-4 border-b border-border py-4 desktop:rounded-lg desktop:border desktop:p-4 ${out ? "opacity-50" : ""}`}>
      <div className="flex min-w-0 grow flex-col gap-1">
        <h3 className="text-body-strong font-semibold">
          {out ? item.name : <Link href={`/tienda/${slug}/${item.id}`} className="after:absolute after:inset-0">{item.name}</Link>}
        </h3>
        <p className="text-caption font-normal text-ink-muted">{item.desc}</p>
        <div className="mt-auto flex items-baseline gap-2 pt-1.5 whitespace-nowrap">
          <span className="text-price">{formatUsd(item.priceCents)}</span>
          <span className="text-caption text-ink-muted">{formatVes(item.priceCents, DEMO_RATE)}</span>
        </div>
        {item.low ? <span className="text-badge text-primary-text">Quedan {item.low}</span> : null}
        {out ? <span className="self-start rounded-pill bg-surface-tile px-2.5 py-1 text-badge">Agotado · Vuelve mañana a las 7:00 a. m.</span> : null}
      </div>
      <div className="relative size-26 shrink-0">
        <span className="grid size-full place-items-center rounded-md bg-surface-tile text-ink [&_.nm-icon]:size-10"><Icon name={item.icon} /></span>
        {!out ? (
          <AddButton className="absolute -right-1.5 -bottom-1.5 z-[1]" store={store} hasOptions={hasOptions} href={`/tienda/${slug}/${item.id}`} item={{ id: item.id, name: item.name, priceCents: item.priceCents, icon: item.icon }} />
        ) : null}
      </div>
    </article>
  );
}
