import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Icon } from "@/components/nami";
import { MarketProductCard } from "@/components/cart/MarketProductCard";
import { StoreCart } from "@/components/cart/StoreCart";
import { cartStoreOf } from "@/lib/cart/meta";
import { AppShell } from "@/components/shell/AppShell";
import { BackIcon, RoundLink } from "@/components/shell/ScreenBar";
import { StoreMark } from "@/components/shell/StoreMark";
import { DEMO_RATE } from "@/lib/demo/home";
import { MARKETS, type Market } from "@/lib/demo/mercado";
import { formatUsd, formatVes } from "@/lib/money";

export const metadata = { title: "Mercado · Ñami" };

export default function MercadoPage({ params }: PageProps<"/mercado/[slug]">) {
  return (
    <Suspense fallback={<AppShell mobileHeader={false} bottomNav={false}><div className="min-h-dvh" aria-busy="true" /></AppShell>}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/mercado/[slug]">["params"] }) {
  const { slug } = await params;
  const m: Market | undefined = MARKETS[slug];
  if (!m) notFound();

  const cartStore = cartStoreOf({ ...m, minOrderCents: m.minOrderCents }, "mercado");

  const meta = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-ink-muted [&_.nm-icon]:size-4">
      <span className="font-bold text-success">{m.hours}</span>
      <span className="flex items-center gap-1"><Icon name="clock" />{m.time}</span>
      <span className="flex items-center gap-1"><Icon name="moto" />{formatUsd(m.feeCents)} · {formatVes(m.feeCents, DEMO_RATE)}</span>
    </div>
  );
  const searchBox = (
    <form action="/busqueda" role="search" className="nm-search w-full">
      <input type="search" name="q" placeholder={`Buscar en ${m.name}`} aria-label={`Buscar en ${m.name}`} />
      <button className="nm-search__btn" type="submit" aria-label="Buscar"><Icon name="search" /></button>
    </form>
  );

  return (
    <AppShell mobileHeader={false} bottomNav={false}>
      {/* Banda de marca */}
      <div className="relative h-28 bg-leaf px-4 pt-4 desktop:h-41.5 desktop:px-8 desktop:pt-8" style={{ background: `var(--${m.color})` }}>
        <div className="mx-auto flex max-w-316 items-center justify-between">
          <span className="desktop:hidden"><RoundLink href={m.back.href} label="Volver" onTile><BackIcon /></RoundLink></span>
          <Link href={m.back.href} className="hidden min-h-11 items-center gap-1 rounded-pill bg-surface-raised pr-4 pl-2.5 text-button text-ink shadow-card desktop:flex [&_.nm-icon]:size-5"><BackIcon />{m.back.label}</Link>
          <button type="button" aria-label="Guardar en favoritos" className="grid size-11 place-items-center rounded-pill bg-surface-raised text-ink shadow-card desktop:hidden [&_.nm-icon]:size-5">
            <svg className="nm-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" /></svg>
          </button>
        </div>
      </div>

      <div className="relative -mt-6 rounded-t-xl bg-surface desktop:mt-0 desktop:rounded-none">
        <div className="page-x flex flex-col gap-3 pb-4 desktop:flex-row desktop:items-end desktop:gap-6 desktop:pb-6">
          <span className="-mt-8 w-fit rounded-xl bg-surface-raised p-1.5 shadow-card desktop:-mt-12 desktop:p-2"><StoreMark initials={m.initials} color={m.color} size={72} /></span>
          <div className="flex min-w-0 grow flex-col gap-1">
            <div className="flex items-baseline gap-2 desktop:flex-col desktop:gap-1">
              <h1 className="font-display text-[22px] leading-7 font-extrabold desktop:text-[40px] desktop:leading-11">{m.name}</h1>
              <span className="text-caption text-ink-muted desktop:hidden">{m.kind} · {m.area}</span>
            </div>
            <div className="hidden text-body text-ink-muted desktop:block">{m.kind} · {m.area}</div>
            {meta}
          </div>
          <div className="desktop:w-96">{searchBox}</div>
        </div>
      </div>

      <div className="page-x grid grid-cols-1 gap-8 pb-28 desktop:grid-cols-[250px_minmax(0,1fr)_340px] desktop:items-start desktop:gap-10 desktop:pb-8">
        {/* Categorías */}
        <nav aria-label="Categorías" className="scroll-x -mx-4 flex gap-2 px-4 desktop:sticky desktop:top-6 desktop:mx-0 desktop:flex-col desktop:gap-1 desktop:px-0">
          {m.categories.map((c, i) => (
            <a key={c} href={`#${m.sections[i]?.id ?? c}`} className={`flex min-h-11 shrink-0 items-center rounded-pill px-4 text-button desktop:rounded-md ${i === 0 ? "bg-primary-tint text-ink desktop:font-bold" : "bg-surface-tile text-ink desktop:bg-transparent"}`}>{c}</a>
          ))}
        </nav>

        <div className="flex min-w-0 flex-col gap-8">
          {m.sections.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`t-${s.id}`} className="flex scroll-mt-4 flex-col gap-4">
              <div className="flex items-baseline justify-between">
                <h2 id={`t-${s.id}`} className="font-display text-[24px] leading-8 font-extrabold desktop:text-[32px]">{s.title}</h2>
                <Link href={`/busqueda?q=${encodeURIComponent(s.title.split(" ")[0])}`} className="text-button text-primary-text">Ver todo</Link>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-6 desktop:grid-cols-4">
                {s.products.map((p) => <MarketProductCard key={p.id} store={cartStore} p={p} />)}
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
