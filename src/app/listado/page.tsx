import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { Suspense } from "react";
import { CuisineChip, Icon, RestaurantCard } from "@/components/nami";
import { AppShell } from "@/components/shell/AppShell";
import { ScreenBar, SearchLink } from "@/components/shell/ScreenBar";
import { DeliveryBar } from "@/components/shell/DeliveryBar";
import { StoreMark } from "@/components/shell/StoreMark";
import { hoursText, isOpenAt, LISTING_TABS, opensText, type StoreSummary } from "@/lib/catalog";
import { ListingFilterChips } from "@/components/shell/ListingFilterChips";
import { applyListing, filterParams, parseFilters, type ListingFilters } from "@/lib/listing";
import { LISTING_CHIPS } from "@/lib/demo/catalog";
import { caracasNow, FRANJA_COOKIE, horaToMinutes, resolveFranja } from "@/lib/demo/franja";
import { FRANJA_CONTENT } from "@/lib/demo/home";
import { formatUsd } from "@/lib/money";
import { getStores } from "@/server/catalog";
import { getDeliveryContext } from "@/server/prefs";

export const metadata: Metadata = {
  title: "Restaurantes y tiendas · Ñami",
  description: "Explora restaurantes, supermercados, farmacias, bodegones y panaderías en Ñami.",
  alternates: { canonical: "/listado" },
};

/** El orden es el de `?v=`: 0 restaurantes, 1 súper, 2 farmacias, 3 bodegones, 4 panaderías, 5 tiendas. */
const VERTICALS = LISTING_TABS;

type Query = { franja?: string; v?: string; chip?: string };

const rowOf = (s: StoreSummary) => ({
  slug: s.slug, name: s.name, initials: s.initials, color: s.color,
  meta: `${s.description.split(" · ")[0]} · ${s.time} · ${formatUsd(s.feeCents)}`,
  hours: hoursText(s), href: s.kind === "mercado" ? `/mercado/${s.slug}` : `/tienda/${s.slug}`,
});

function href(q: Query, f?: ListingFilters): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...q, ...(f ? filterParams(f) : {}) })) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `/listado?${s}` : "/listado";
}

export default function ListadoPage({ searchParams }: PageProps<"/listado">) {
  return (
    <AppShell activeNav={1} mobileHeader={false}>
      <Suspense fallback={<div className="page-x min-h-dvh" aria-busy="true" />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </AppShell>
  );
}

async function Content({ searchParams }: { searchParams: PageProps<"/listado">["searchParams"] }) {
  await connection();
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const q: Query = { franja: get("franja"), v: get("v"), chip: get("chip") };
  const filters = parseFilters(get);
  const n = Number(q.v);
  const vi = Number.isInteger(n) && n >= 1 && n < VERTICALS.length ? n : 0;
  const title = VERTICALS[vi];

  const real = caracasNow();
  const franja = resolveFranja(q.franja, (await cookies()).get(FRANJA_COOKIE)?.value);
  const label = FRANJA_CONTENT[franja ?? real.franja].label;
  const hora = franja ? FRANJA_CONTENT[franja].hora : real.hora;
  const minutes = horaToMinutes(hora);
  const delivery = await getDeliveryContext();
  const all = await getStores({ vertical: vi, delivery });
  const listed = all.filter((s) => s.delivery?.covered !== false);
  const hidden = all.length - listed.length;
  // Los filtros se aplican a las abiertas y a las cerradas; "abiertos ahora" oculta la sección de cerradas.
  const restaurants = vi === 0 ? applyListing(listed, { ...filters, open: false }, minutes).filter((r) => !q.chip || r.tags.includes(q.chip)) : [];
  const openNow = restaurants.filter((r) => isOpenAt(r, minutes));
  const closedNow = restaurants.filter((r) => !isOpenAt(r, minutes));
  const open = openNow;
  const showClosed = vi === 0 && !filters.open;
  const rows = vi === 0 ? [] : listed.map(rowOf);
  const count = vi === 0 ? `${openNow.length} abiertas · ${closedNow.length} cerradas` : `${rows.length} abiertas`;

  return (
    <>
      <ScreenBar title={title} action={<SearchLink />} />

      <div className="page-x flex flex-col gap-4 pb-8 desktop:gap-6 desktop:pt-6">
        <DeliveryBar zone={delivery.zone} hidden={hidden} />
        <nav aria-label="Ruta" className="hidden gap-2 text-caption text-ink-muted desktop:flex">
          <Link href="/" className="font-semibold">Inicio</Link>
          <span aria-hidden="true">/</span>
          <span className="text-ink">{title}</span>
        </nav>

        <div className="flex flex-col gap-3 desktop:flex-row desktop:items-end desktop:gap-8">
          <h1 className="hidden font-display text-[40px] leading-11 font-extrabold desktop:block">{title}</h1>
          <div role="tablist" className="nm-tabs scroll-x grow">
            {VERTICALS.map((label, i) => (
              <Link key={label} href={href({ v: i ? String(i) : undefined }, filters)} role="tab" aria-selected={i === vi} className="nm-tab">{label}</Link>
            ))}
          </div>
          <span className="flex items-center gap-1.5 text-caption text-ink-muted desktop:pb-3 desktop:whitespace-nowrap [&_.nm-icon]:size-4">
            <Icon name="clock" />
            <span><b className="text-ink">{label}</b> · {hora} en Caracas · {count}</span>
          </span>
        </div>

        <div className={`grid grid-cols-1 gap-4 desktop:items-start desktop:gap-10 ${vi === 0 ? "desktop:grid-cols-[240px_minmax(0,1fr)]" : ""}`}>
          {vi === 0 ? <aside aria-label="Filtros" className="flex flex-col gap-3 desktop:sticky desktop:top-6 desktop:order-first">
            <h2 className="hidden font-display text-title-md desktop:block">Filtros</h2>
            <div className="order-2 desktop:order-none"><ListingFilterChips filters={filters} to={(patch) => href(q, { ...filters, ...patch })} /></div>
            <p className="hidden text-caption text-ink-muted desktop:block">¿Todo cerrado? Cambia de franja con el modo demo del inicio.</p>
          </aside> : null}

          <div className="flex flex-col gap-6 desktop:gap-8">
            {vi === 0 ? (
              <>
                <div className="scroll-x -mx-4 flex gap-4 px-4 desktop:mx-0 desktop:gap-5 desktop:px-0">
                  {LISTING_CHIPS.map((c) => {
                    const on = q.chip === c.tag;
                    return (
                      <Link key={c.tag} href={href({ ...q, chip: on ? undefined : c.tag }, filters)} scroll={false} className="shrink-0">
                        <CuisineChip icon={c.icon} label={c.label} selected={on} />
                      </Link>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-6 desktop:grid desktop:grid-cols-3 desktop:gap-6">
                  {open.map((r) => (
                    <Link key={r.slug} href={`/tienda/${r.slug}`} className="flex flex-col">
                      <RestaurantCard
                        className="w-full"
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
                {open.length === 0 ? (
                  <p className="rounded-lg bg-surface-tile p-8 text-center text-body text-ink-muted">
                    No hay tiendas abiertas con ese filtro ahora. Prueba otra comida o usa el modo demo.
                  </p>
                ) : null}
              </>
            ) : (
              <div className="grid gap-3 desktop:grid-cols-2 desktop:gap-4">
                {rows.map((s) => (
                  <Link key={s.slug} href={s.href} className="flex min-h-22 items-center gap-3.5 rounded-lg border border-border p-4 text-ink">
                    <StoreMark initials={s.initials} color={s.color} slug={s.slug} />
                    <span className="flex grow flex-col gap-0.5">
                      <span className="text-body-strong font-bold">{s.name}</span>
                      <span className="text-caption text-ink-muted">{s.meta}</span>
                      <span className="text-badge text-success">Abierto · {s.hours}</span>
                    </span>
                    <span className="text-ink-muted"><Icon name="chevronRight" /></span>
                  </Link>
                ))}
              </div>
            )}

            {showClosed && closedNow.length > 0 ? (
              <section className="flex flex-col gap-4">
                <h2 className="font-display text-title-md desktop:text-[20px]">Cerradas ahora</h2>
                <div className="flex flex-col gap-3 desktop:grid desktop:grid-cols-3 desktop:gap-4">
                  {closedNow.map((r) => (
                    <Link key={r.slug} href={`/tienda/${r.slug}`} className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <StoreMark initials={r.initials} color={r.color} slug={r.slug} dim />
                      <span className="flex min-w-0 grow flex-col gap-0.5">
                        <span className="text-body-strong font-bold text-ink-muted">{r.name}</span>
                        <span className="text-caption text-ink-muted desktop:hidden">{r.description}</span>
                        <span className="hidden items-center gap-1 text-badge text-ink desktop:flex [&_.nm-icon]:size-4"><Icon name="clock" />{opensText(r, minutes)}</span>
                      </span>
                      <span className="flex items-center gap-1 rounded-pill bg-surface-tile px-2.5 py-1.5 text-badge whitespace-nowrap desktop:hidden [&_.nm-icon]:size-4">
                        <Icon name="clock" />{opensText(r, minutes)}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
