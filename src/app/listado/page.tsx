import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { Suspense } from "react";
import { CuisineChip, Icon, RestaurantCard } from "@/components/nami";
import { AppShell } from "@/components/shell/AppShell";
import { ScreenBar, SearchLink } from "@/components/shell/ScreenBar";
import { StoreMark } from "@/components/shell/StoreMark";
import { LISTING_CHIPS, restaurantsAt, STORES } from "@/lib/demo/catalog";
import { caracasNow, FRANJA_COOKIE, horaToMinutes, resolveFranja } from "@/lib/demo/franja";
import { FRANJA_CONTENT, type BrandColor } from "@/lib/demo/home";
import { MARKETS } from "@/lib/demo/mercado";
import { BAKERY_SLUGS } from "@/lib/demo/tiendas";
import { formatUsd } from "@/lib/money";

export const metadata: Metadata = {
  title: "Restaurantes y tiendas · Ñami",
  description: "Explora restaurantes, supermercados, farmacias, bodegones y panaderías en Ñami.",
  alternates: { canonical: "/listado" },
};

/** El orden es el de `?v=`: 0 restaurantes, 1 súper, 2 farmacias, 3 bodegones, 4 panaderías, 5 tiendas. */
const VERTICALS = ["Restaurantes", "Súper", "Farmacia", "Bodegones", "Panaderías", "Tiendas"] as const;

type Query = { franja?: string; v?: string; chip?: string; open?: string; free?: string };

type Row = { slug: string; name: string; initials: string; color: BrandColor; meta: string; hours: string; href: string };

function rowsFor(vi: number): Row[] {
  if (vi === 4) {
    return BAKERY_SLUGS.flatMap((slug) => {
      const b = STORES[slug];
      return b ? [{ slug, name: b.name, initials: b.initials, color: b.color, meta: `${b.kind.split(" · ")[0]} · ${b.time} · ${formatUsd(b.feeCents)}`, hours: b.openUntil.replace("Hasta", "hasta"), href: `/tienda/${slug}` }] : [];
    });
  }
  return Object.values(MARKETS)
    .filter((m) => m.vertical === vi)
    .map((m) => ({ slug: m.slug, name: m.name, initials: m.initials, color: m.color, meta: `${m.kind} · ${m.time} · ${formatUsd(m.feeCents)}`, hours: m.hours, href: `/mercado/${m.slug}` }));
}

function href(q: Query): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) if (v) p.set(k, v);
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
  const q: Query = { franja: get("franja"), v: get("v"), chip: get("chip"), open: get("open"), free: get("free") };
  const n = Number(q.v);
  const vi = Number.isInteger(n) && n >= 1 && n < VERTICALS.length ? n : 0;
  const title = VERTICALS[vi];

  const real = caracasNow();
  const franja = resolveFranja(q.franja, (await cookies()).get(FRANJA_COOKIE)?.value);
  const label = FRANJA_CONTENT[franja ?? real.franja].label;
  const hora = franja ? FRANJA_CONTENT[franja].hora : real.hora;
  const { open: openNow, closed: closedNow } = restaurantsAt(horaToMinutes(hora));
  const open = openNow.filter((r) => (!q.chip || r.tags.includes(q.chip)) && (q.free !== "1" || r.plusFree));
  const showClosed = vi === 0 && q.open !== "1";
  const rows = vi === 0 ? [] : rowsFor(vi);
  const count = vi === 0 ? `${openNow.length} abiertas · ${closedNow.length} cerradas` : `${rows.length} abiertas`;

  const filters = [
    { label: "Abiertos ahora", on: q.open === "1", to: href({ ...q, open: q.open === "1" ? undefined : "1" }) },
    { label: "Envío gratis con Ñami+", on: q.free === "1", to: href({ ...q, free: q.free === "1" ? undefined : "1" }) },
    { label: "Mejor calificados", on: false, to: href(q) },
  ];

  return (
    <>
      <ScreenBar title={title} action={<SearchLink />} />

      <div className="page-x flex flex-col gap-4 pb-8 desktop:gap-6 desktop:pt-6">
        <nav aria-label="Ruta" className="hidden gap-2 text-caption text-ink-muted desktop:flex">
          <Link href="/" className="font-semibold">Inicio</Link>
          <span aria-hidden="true">/</span>
          <span className="text-ink">{title}</span>
        </nav>

        <div className="flex flex-col gap-3 desktop:flex-row desktop:items-end desktop:gap-8">
          <h1 className="hidden font-display text-[40px] leading-11 font-extrabold desktop:block">{title}</h1>
          <div role="tablist" className="nm-tabs scroll-x grow">
            {VERTICALS.map((label, i) => (
              <Link key={label} href={href({ v: i ? String(i) : undefined })} role="tab" aria-selected={i === vi} className="nm-tab">{label}</Link>
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
            <div className="scroll-x -mx-4 order-2 flex gap-2 px-4 desktop:order-none desktop:mx-0 desktop:flex-col desktop:overflow-visible desktop:px-0">
              {filters.map((f) => (
                <Link
                  key={f.label}
                  href={f.to}
                  scroll={false}
                  aria-pressed={f.on}
                  className={`flex min-h-10 shrink-0 items-center rounded-pill px-3.5 text-caption font-bold whitespace-nowrap ${f.on ? "bg-ink text-surface" : "border border-border bg-surface text-ink"}`}
                >
                  {f.label}
                </Link>
              ))}
            </div>
            <p className="hidden text-caption text-ink-muted desktop:block">¿Todo cerrado? Cambia de franja con el modo demo del inicio.</p>
          </aside> : null}

          <div className="flex flex-col gap-6 desktop:gap-8">
            {vi === 0 ? (
              <>
                <div className="scroll-x -mx-4 flex gap-4 px-4 desktop:mx-0 desktop:gap-5 desktop:px-0">
                  {LISTING_CHIPS.map((c) => {
                    const on = q.chip === c.tag;
                    return (
                      <Link key={c.tag} href={href({ ...q, chip: on ? undefined : c.tag })} scroll={false} className="shrink-0">
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
                        image={`/brand/food/${r.image}.svg`}
                        initials={r.initials}
                        rating={r.rating}
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
                    <StoreMark initials={s.initials} color={s.color} />
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
                    <div key={r.name} className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <StoreMark initials={r.initials} color={r.color} dim />
                      <span className="flex min-w-0 grow flex-col gap-0.5">
                        <span className="text-body-strong font-bold text-ink-muted">{r.name}</span>
                        <span className="text-caption text-ink-muted desktop:hidden">{r.kind}</span>
                        <span className="hidden items-center gap-1 text-badge text-ink desktop:flex [&_.nm-icon]:size-4"><Icon name="clock" />{r.opens}</span>
                      </span>
                      <span className="flex items-center gap-1 rounded-pill bg-surface-tile px-2.5 py-1.5 text-badge whitespace-nowrap desktop:hidden [&_.nm-icon]:size-4">
                        <Icon name="clock" />{r.opens}
                      </span>
                    </div>
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
