/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge, Icon, type IconName } from "@/components/nami";
import { cx } from "@/components/nami/cx";
import type { StoreSummary } from "@/lib/catalog";
import { formatUsd } from "@/lib/money";

/**
 * Bloques del Inicio con la estética "geométrica": esquinas asimétricas (una muy redonda),
 * paneles de color y distribuciones distintas por sección para que el scroll no sea monótono.
 * Todos son Server Components: reciben datos ya leídos por la página.
 */

const logoOf = (slug: string) => `/brand/stores/${slug}.jpg`;

/** Tarjeta amarilla con píldora oscura de tiempo y la guacamaya asomando. */
export function FlashCard({ pill, title, text, cta, href, image }: { pill: string; title: string; text: string; cta: string; href: string; image: string }) {
  return (
    <Link href={href} className="nm-geo-flash group">
      <span className="nm-geo-flash__pill">{pill}</span>
      <span className="relative z-[1] flex max-w-[62%] flex-col gap-1">
        <span className="font-display text-title-md text-on-promo">{title}</span>
        <span className="text-caption text-on-promo/80">{text}</span>
        <span className="mt-3 inline-flex items-center gap-1 text-body-strong font-bold text-on-promo">
          {cta}
          <Icon name="arrowRight" className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </span>
      <img src={image} alt="" className="nm-geo-flash__art" />
    </Link>
  );
}

export type GeoBanner = { title: string; text: string; tag?: string; href: string; image: string; tone: "primary" | "leaf" | "plus" | "ink" };

/** Carrusel de banners secundarios: color sólido + foto recortada con esquina curva. */
export function BannerRail({ banners }: { banners: GeoBanner[] }) {
  return (
    <div className="scroll-x -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 px-4 desktop:mx-0 desktop:grid desktop:auto-cols-fr desktop:grid-flow-col desktop:gap-5 desktop:px-0">
      {banners.map((b) => (
        <Link key={b.title} href={b.href} className={cx("nm-geo-banner snap-start", `nm-geo-banner--${b.tone}`)}>
          <span className="relative z-[1] flex max-w-[58%] flex-col gap-1">
            {b.tag ? <span className="nm-geo-banner__tag">{b.tag}</span> : null}
            <span className="font-display text-[20px] leading-[24px] font-black">{b.title}</span>
            <span className="text-caption opacity-90">{b.text}</span>
          </span>
          <span className="nm-geo-banner__art"><img src={b.image} alt="" /></span>
        </Link>
      ))}
    </div>
  );
}

/** "Los más populares": foto cuadrada con el logo centrado encima. */
export function PopularTiles({ stores, badgeOf }: { stores: StoreSummary[]; badgeOf?: (s: StoreSummary) => ReactNode }) {
  return (
    <div className="scroll-x -mx-4 flex gap-3 px-4 py-1 desktop:mx-0 desktop:grid desktop:grid-cols-6 desktop:gap-4 desktop:px-0">
      {stores.map((s) => (
        <Link key={s.slug} href={`/tienda/${s.slug}`} className="nm-geo-pop group">
          <span className="nm-geo-pop__img">
            {s.imageUrl ? <img src={s.imageUrl} alt="" /> : null}
            <span className="nm-geo-pop__logo"><img src={logoOf(s.slug)} alt="" /></span>
            {badgeOf?.(s) ? <span className="absolute left-2 top-2">{badgeOf(s)}</span> : null}
          </span>
          <span className="truncate text-body-strong font-bold text-ink group-hover:text-primary-text">{s.name}</span>
          <span className="flex items-center gap-1 text-caption text-ink-muted [&_.nm-icon]:size-3.5">
            <Icon name="star" className="fill-ink stroke-none" />{s.rating ?? "Nuevo"} · {s.time}
          </span>
        </Link>
      ))}
    </div>
  );
}

/** Tarjeta de tienda en panel: foto arriba y datos en una placa blanca. */
function PanelCard({ s }: { s: StoreSummary }) {
  return (
    <Link href={`/tienda/${s.slug}`} className="nm-geo-card group">
      <span className="nm-geo-card__img">
        {s.imageUrl ? <img src={s.imageUrl} alt="" /> : null}
        <span className="nm-geo-card__logo"><img src={logoOf(s.slug)} alt="" /></span>
      </span>
      {/* El logo cuelga 20px bajo la foto: pt-8 deja aire entre él y el nombre. */}
      <span className="flex flex-col gap-0.5 px-3 pb-3 pt-8">
        <span className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-body-strong font-bold text-ink group-hover:text-primary-text">{s.name}</span>
          {s.rating ? <span className="flex items-center gap-0.5 text-caption font-bold text-ink [&_.nm-icon]:size-3.5"><Icon name="star" className="fill-ink stroke-none" />{s.rating}</span> : null}
        </span>
        <span className="flex items-center gap-1 text-caption text-ink-muted [&_.nm-icon]:size-4"><Icon name="clock" />{s.time}</span>
        <span className="flex items-center gap-1 text-caption text-ink-muted [&_.nm-icon]:size-4">
          <Icon name="moto" />{formatUsd(s.feeCents)}
          {s.plusFree ? <> · <span className="font-bold text-plus">Gratis con</span> <Badge tone="plus" /></> : null}
        </span>
      </span>
    </Link>
  );
}

/** Panel gris con la esquina superior derecha muy redonda y un carrusel de tiendas dentro. */
export function ThemedPanel({ icon, eyebrow, title, href, stores }: { icon: IconName; eyebrow: string; title: string; href: string; stores: StoreSummary[] }) {
  return (
    <section className="nm-geo-panel">
      <div className="flex items-end justify-between gap-3 px-4 desktop:px-6">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-caption font-semibold text-ink-muted [&_.nm-icon]:size-4"><Icon name={icon} />{eyebrow}</span>
          <h2 className="font-display text-title-lg text-ink">{title}</h2>
        </div>
        <Link href={href} className="shrink-0 text-body-strong font-bold text-primary-text">Ver todo</Link>
      </div>
      <div className="scroll-x flex gap-3 scroll-px-4 px-4 pb-1 desktop:grid desktop:grid-cols-3 desktop:gap-5 desktop:px-6">
        {stores.map((s) => <PanelCard key={s.slug} s={s} />)}
      </div>
    </section>
  );
}

/** "Descubre estas opciones": foto grande 2:1 con la siguiente asomando. */
export function DiscoverRail({ stores }: { stores: StoreSummary[] }) {
  return (
    <div className="scroll-x -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 px-4 desktop:mx-0 desktop:grid desktop:grid-cols-2 desktop:gap-6 desktop:px-0">
      {stores.map((s, i) => (
        <Link key={s.slug} href={`/tienda/${s.slug}`} className="nm-geo-discover group snap-start">
          <span className={cx("nm-geo-discover__img", i % 2 === 1 && "nm-geo-discover__img--alt")}>
            {s.imageUrl ? <img src={s.imageUrl} alt="" /> : null}
            {s.plusFree ? <span className="absolute left-3 top-3"><Badge tone="promo">Envío $ 0 con Ñami+</Badge></span> : null}
          </span>
          <span className="flex items-start gap-3">
            <span className="nm-rest__logo"><img src={logoOf(s.slug)} alt="" /></span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-body-strong font-bold text-ink group-hover:text-primary-text">{s.name}</span>
                {s.rating ? <span className="nm-rest__rating"><Icon name="star" />{s.rating}</span> : null}
              </span>
              <span className="truncate text-caption text-ink-muted">{s.description}</span>
              <span className="flex items-center gap-1 text-caption text-ink-muted [&_.nm-icon]:size-4"><Icon name="clock" />{s.time} · <Icon name="moto" />{formatUsd(s.feeCents)}</span>
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
