import Link from "next/link";
import { MARKETS } from "@/lib/demo/mercado";
import { Suspense } from "react";
import { Icon } from "@/components/nami";
import { AppShell } from "@/components/shell/AppShell";
import { BackIcon, RoundLink } from "@/components/shell/ScreenBar";
import { StoreMark } from "@/components/shell/StoreMark";
import { RECENT_SEARCHES, SUGGESTIONS, search, type SearchProduct, type SearchStore } from "@/lib/demo/busqueda";
import { DEMO_RATE } from "@/lib/demo/home";
import { formatUsd, formatVes } from "@/lib/money";

export const metadata = { title: "Buscar · Ñami" };

export default function BusquedaPage({ searchParams }: PageProps<"/busqueda">) {
  return (
    <Suspense fallback={<AppShell mobileHeader={false}><div className="min-h-dvh" aria-busy="true" /></AppShell>}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

const chip = "flex min-h-11 items-center rounded-pill border border-border px-4 text-button text-ink";
const storeHref = (slug: string) => (slug in MARKETS ? `/mercado/${slug}` : `/tienda/${slug}`);
const productHref = (p: SearchProduct) => (p.storeSlug === "arepera-dona-chela" ? `/tienda/${p.storeSlug}/${p.id}` : storeHref(p.storeSlug));
const href = (q: string) => `/busqueda?q=${encodeURIComponent(q)}`;

function StoreRow({ s }: { s: SearchStore }) {
  return (
    <li className="border-b border-border">
      <Link href={storeHref(s.slug)} className="flex items-center gap-4 py-3.5">
        <StoreMark initials={s.initials} color={s.color} size={64} dim={!s.open} />
        <span className="flex min-w-0 grow flex-col">
          <span className="text-body-strong font-bold">{s.name}</span>
          <span className="text-caption text-ink-muted">{s.meta}</span>
          <span className={`text-caption font-bold ${s.open ? "text-success" : "text-ink-muted"}`}>{s.status}</span>
        </span>
        <Icon name="chevronRight" className="size-5 text-ink-muted" />
      </Link>
    </li>
  );
}

function ProductRow({ p }: { p: SearchProduct }) {
  const out = Boolean(p.soldOut);
  return (
    <li className={`flex items-center gap-4 border-b border-border py-3.5 ${out ? "opacity-55" : ""}`}>
      <span className="grid size-16 shrink-0 place-items-center rounded-md bg-surface-tile [&_.nm-icon]:size-8"><Icon name={p.icon} /></span>
      <span className="flex min-w-0 grow flex-col">
        <span className="text-body-strong font-bold">{p.name}</span>
        <span className="text-caption text-ink-muted">{p.store}</span>
        <span className="flex items-baseline gap-2"><b className="text-price">{formatUsd(p.priceCents)}</b><span className="text-caption text-ink-muted">{formatVes(p.priceCents, DEMO_RATE)}</span></span>
        {p.soldOut ? <span className="text-caption font-bold text-ink">{p.soldOut}</span> : null}
      </span>
      {out ? null : (
        <Link href={productHref(p)} aria-label={`Ver ${p.name}`} className="grid size-11 shrink-0 place-items-center rounded-pill bg-primary text-on-primary [&_.nm-icon]:size-5"><Icon name="plus" /></Link>
      )}
    </li>
  );
}

async function Content({ searchParams }: { searchParams: PageProps<"/busqueda">["searchParams"] }) {
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").slice(0, 60);
  const tab = sp.tab === "productos" ? "productos" : "tiendas";
  const { stores, products } = search(q);
  const none = q.trim() !== "" && stores.length === 0 && products.length === 0;

  const form = (
    <form action="/busqueda" role="search" className="nm-search grow">
      <input type="search" name="q" defaultValue={q} placeholder="Arepas, perros, harina de maíz…" aria-label="Buscar" />
      <button className="nm-search__btn" type="submit" aria-label="Buscar"><Icon name="search" /></button>
    </form>
  );

  return (
    <AppShell mobileHeader={false} activeNav={0}>
      <div className="page-x flex flex-col gap-5 pt-3 desktop:gap-6 desktop:pt-8">
        <div className="flex items-center gap-3 desktop:max-w-[54rem]">
          <span className="desktop:hidden"><RoundLink href="/" label="Volver"><BackIcon /></RoundLink></span>
          {form}
        </div>

        <section aria-label="Búsquedas recientes" className="flex flex-col gap-2.5 desktop:flex-row desktop:flex-wrap desktop:items-center desktop:gap-3">
          <h2 className="text-caption font-bold text-ink-muted desktop:text-body-strong">
            <span className="desktop:hidden">Búsquedas recientes</span><span className="hidden desktop:inline">Recientes</span>
          </h2>
          <div className="flex flex-wrap gap-2.5">
            {RECENT_SEARCHES.map((r) => <Link key={r} href={href(r)} className={chip}>{r}</Link>)}
          </div>
        </section>

        {none ? (
          <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3.5 px-4 py-8 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <span className="grid size-52 place-items-center rounded-pill bg-surface-warm"><img src="/brand/guacamaya.png" alt="" className="h-44 w-auto" /></span>
            <h1 className="font-display text-[24px] leading-7.5 font-extrabold">No encontramos «{q}» cerca de ti</h1>
            <p className="text-body text-ink-muted">Revisa cómo lo escribiste o prueba con algo más criollo.</p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {SUGGESTIONS.map((r) => <Link key={r} href={href(r)} className={chip}>{r}</Link>)}
            </div>
          </div>
        ) : q.trim() === "" ? (
          <p className="py-6 text-body text-ink-muted">Escribe el nombre de una tienda o de un plato.</p>
        ) : (
          <>
            <div role="tablist" aria-label="Resultados" className="flex gap-8 border-b border-border desktop:hidden">
              {([["tiendas", `Tiendas (${stores.length})`], ["productos", `Productos (${products.length})`]] as const).map(([id, label]) => (
                <Link key={id} role="tab" aria-selected={tab === id} replace scroll={false} href={`/busqueda?q=${encodeURIComponent(q)}&tab=${id}`} className={`-mb-px min-h-11 border-b-2 text-body-strong ${tab === id ? "border-primary font-bold" : "border-transparent font-medium text-ink-muted"}`}>{label}</Link>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-x-10 desktop:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
              <section aria-labelledby="r-tiendas" className={tab === "tiendas" ? "" : "hidden desktop:block"}>
                <h2 id="r-tiendas" className="hidden pb-3 font-display text-title-lg desktop:block desktop:text-[28px]">Tiendas <span className="text-ink-muted">({stores.length})</span></h2>
                <ul>{stores.map((s) => <StoreRow key={s.slug} s={s} />)}</ul>
              </section>
              <section aria-labelledby="r-productos" className={tab === "productos" ? "" : "hidden desktop:block"}>
                <h2 id="r-productos" className="hidden pb-3 font-display text-title-lg desktop:block desktop:text-[28px]">Productos <span className="text-ink-muted">({products.length})</span></h2>
                <ul className="desktop:grid desktop:grid-cols-2 desktop:gap-x-10">{products.map((p) => <ProductRow key={p.id} p={p} />)}</ul>
              </section>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
