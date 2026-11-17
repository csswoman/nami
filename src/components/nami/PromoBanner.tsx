"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Icon } from "./icon";
import { cx } from "./cx";

export type PromoBannerSlide = {
  title: string;
  eyebrow?: string;
  badge?: ReactNode;
  image?: string;
  href?: string;
  ctaText?: string;
  bg?: string;
};

export type PromoBannerProps = {
  title?: string;
  eyebrow?: string;
  badge?: ReactNode;
  image?: string;
  slides?: number | PromoBannerSlide[];
  current?: number;
  className?: string;
  autoPlay?: boolean;
  intervalMs?: number;
};

const DEFAULT_SLIDES: PromoBannerSlide[] = [
  {
    eyebrow: "Ñami Delivery · Caracas",
    title: "Almuerzos criollos y comida caliente a tu puerta",
    badge: <span className="nm-badge nm-badge--surface font-bold">Envío $ 0 con Ñami+</span>,
    image: "/brand/guacamaya-moto.png",
    href: "/listado",
    ctaText: "Pedir ahora",
    bg: "linear-gradient(135deg, #E8182E 0%, #B80F22 100%)",
  },
  {
    eyebrow: "Súper, Abastos y Farmacias",
    title: "Tus compras completas en 25 minutos",
    badge: (
      <span className="inline-flex items-center gap-1.5 rounded-pill bg-black/35 px-2.5 py-1 text-badge font-bold text-white border border-white/25 backdrop-blur-xs">
        <span className="size-2 rounded-full bg-[#4CD27A]" />
        Abierto 24 horas
      </span>
    ),
    image: "/brand/guacamaya-celebra.png",
    href: "/listado?v=1",
    ctaText: "Ver mercados",
    bg: "linear-gradient(135deg, #107C41 0%, #0A4D28 100%)",
  },
  {
    eyebrow: "Promoción Especial del Día",
    title: "Arepas, cachapas y tequeños con hasta 25% off",
    badge: <span className="nm-badge nm-badge--promo">Mismo precio que en local</span>,
    image: "/brand/promo-feast.png",
    href: "/ofertas",
    ctaText: "Ver ofertas",
    bg: "linear-gradient(135deg, #E65100 0%, #C23800 100%)",
  },
];

export function PromoBanner({
  title,
  eyebrow,
  badge,
  image,
  slides,
  current: controlledCurrent,
  className,
  autoPlay = true,
  intervalMs = 4500,
}: PromoBannerProps) {
  // Construir las diapositivas
  const slideList: PromoBannerSlide[] = Array.isArray(slides)
    ? slides
    : typeof slides === "number" && slides > 1
      ? [
          {
            title: title ?? DEFAULT_SLIDES[0].title,
            eyebrow: eyebrow ?? DEFAULT_SLIDES[0].eyebrow,
            badge: badge ?? DEFAULT_SLIDES[0].badge,
            image: image ?? DEFAULT_SLIDES[0].image,
            href: "/listado",
            ctaText: DEFAULT_SLIDES[0].ctaText,
            bg: DEFAULT_SLIDES[0].bg,
          },
          DEFAULT_SLIDES[1],
          DEFAULT_SLIDES[2],
        ].slice(0, slides)
      : [
          {
            title: title ?? DEFAULT_SLIDES[0].title,
            eyebrow: eyebrow ?? DEFAULT_SLIDES[0].eyebrow,
            badge: badge ?? DEFAULT_SLIDES[0].badge,
            image: image ?? DEFAULT_SLIDES[0].image,
            href: "/listado",
            ctaText: DEFAULT_SLIDES[0].ctaText,
            bg: DEFAULT_SLIDES[0].bg,
          },
        ];

  const total = slideList.length;
  const [index, setIndex] = useState(controlledCurrent ?? 0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Sincronizar si cambia control externo
  useEffect(() => {
    if (controlledCurrent !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza con el valor externo; ya estaba así antes de activar la regla
      setIndex(controlledCurrent);
    }
  }, [controlledCurrent]);

  // Rotación automática con pausa en hover
  useEffect(() => {
    if (!autoPlay || total <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % total);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [autoPlay, total, isPaused, intervalMs]);

  const active = slideList[index] ?? slideList[0];

  const goTo = (i: number) => {
    setIndex(i);
  };

  const next = () => setIndex((prev) => (prev + 1) % total);
  const prev = () => setIndex((prev) => (prev - 1 + total) % total);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) next();
      else prev();
    }
    touchStartX.current = null;
  };

  return (
    <section
      className={cx("nm-banner group select-none transition-colors duration-500", className)}
      style={{ background: active.bg ?? "var(--primary)" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-roledescription="carousel"
      aria-label="Promociones destacadas"
    >
      {/* Iluminación sutil y profundidad para garantizar contraste sin apagar el color de fondo */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-black/20 via-black/5 to-transparent desktop:from-black/15 desktop:to-transparent"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-6 -bottom-6 size-48 rounded-full bg-white/10 blur-2xl desktop:size-64"
        aria-hidden="true"
      />

      <div key={`copy-${index}`} className="nm-banner__copy animate-in fade-in slide-in-from-left-2 duration-300">
        <div className="flex flex-wrap items-center gap-2">
          {active.badge}
          {active.eyebrow && !active.badge ? (
            <span className="nm-banner__eyebrow">
              {active.eyebrow}
            </span>
          ) : active.eyebrow && active.badge ? (
            <span className="hidden items-center gap-1.5 rounded-pill bg-black/20 px-2.5 py-0.5 text-[11px] font-semibold text-white/90 backdrop-blur-xs desktop:inline-flex">
              {active.eyebrow}
            </span>
          ) : null}
        </div>
        <h2 className="nm-banner__title font-display">{active.title}</h2>
        <i className="nm-banner__underline" aria-hidden="true" />
        {active.href ? (
          <Link
            href={active.href}
            className="group/cta mt-auto inline-flex items-center gap-2 rounded-pill bg-white px-4 py-1.5 text-caption font-bold text-ink shadow-card transition-all duration-200 hover:scale-105 hover:bg-white/95 active:scale-95 whitespace-nowrap desktop:px-5 desktop:py-2.5 desktop:text-button"
          >
            <span>{active.ctaText ?? "Ver más"}</span>
            <Icon name="arrowRight" className="size-4 text-ink transition-transform duration-200 group-hover/cta:translate-x-0.5" />
          </Link>
        ) : null}
      </div>

      {active.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`art-${index}`}
          className="nm-banner__art animate-in fade-in zoom-in-95 duration-400"
          src={active.image}
          alt=""
          loading="eager"
          decoding="async"
        />
      ) : null}

      {/* Flechas de navegación (visibles en hover exclusivamente en escritorio para no obstruir texto en móvil) */}
      {total > 1 ? (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              prev();
            }}
            aria-label="Promoción anterior"
            className="absolute left-3 top-1/2 z-20 hidden size-9 -translate-y-1/2 place-items-center rounded-pill bg-black/25 text-on-primary opacity-0 backdrop-blur-xs transition-all hover:bg-black/50 hover:scale-110 active:scale-95 group-hover:opacity-100 desktop:grid"
          >
            <Icon name="chevronLeft" className="size-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              next();
            }}
            aria-label="Promoción siguiente"
            className="absolute right-3 top-1/2 z-20 hidden size-9 -translate-y-1/2 place-items-center rounded-pill bg-black/25 text-on-primary opacity-0 backdrop-blur-xs transition-all hover:bg-black/50 hover:scale-110 active:scale-95 group-hover:opacity-100 desktop:grid"
          >
            <Icon name="chevronRight" className="size-5" />
          </button>
        </>
      ) : null}

      {/* Indicadores de diapositiva (dots) interactivos con área táctil cómoda */}
      {total > 1 ? (
        <div className="nm-banner__dots z-20" role="tablist" aria-label="Seleccionar diapositiva">
          {slideList.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Ir al banner ${i + 1}`}
              onClick={() => goTo(i)}
              className="group/dot flex h-5 items-center p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-pill"
            >
              <span
                className={`h-2 rounded-pill transition-all duration-300 ${
                  i === index ? "w-6 bg-white shadow-xs" : "w-2 bg-white/45 group-hover/dot:bg-white/75"
                }`}
              />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
