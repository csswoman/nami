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
    badge: <span className="nm-badge nm-badge--brand">Envío $ 0 con Ñami+</span>,
    image: "/brand/guacamaya-moto.png",
    href: "/listado",
    ctaText: "Pedir ahora",
    bg: "var(--primary)",
  },
  {
    eyebrow: "Súper, Abastos y Farmacias",
    title: "Tus compras completas en 25 minutos",
    badge: <span className="nm-badge nm-badge--success">Abierto 24 horas</span>,
    image: "/brand/guacamaya-celebra.png",
    href: "/listado?v=1",
    ctaText: "Ver mercados",
    bg: "linear-gradient(135deg, #167a4d 0%, #0d4a2e 100%)",
  },
  {
    eyebrow: "Promoción Especial del Día",
    title: "Arepas, cachapas y tequeños con hasta 25% off",
    badge: <span className="nm-badge nm-badge--brand">Mismo precio que en local</span>,
    image: "/brand/promo-feast.png",
    href: "/ofertas",
    ctaText: "Ver ofertas",
    bg: "linear-gradient(135deg, #d9531e 0%, #99340b 100%)",
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
            bg: "var(--primary)",
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
            bg: "var(--primary)",
          },
        ];

  const total = slideList.length;
  const [index, setIndex] = useState(controlledCurrent ?? 0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Sincronizar si cambia control externo
  useEffect(() => {
    if (controlledCurrent !== undefined) {
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
      <div key={`copy-${index}`} className="nm-banner__copy animate-in fade-in slide-in-from-left-2 duration-300">
        {active.badge}
        {active.eyebrow ? <span className="nm-banner__eyebrow">{active.eyebrow}</span> : null}
        <h2 className="nm-banner__title font-display">{active.title}</h2>
        <i className="nm-banner__underline" />
        {active.href ? (
          <Link
            href={active.href}
            className="mt-2 inline-flex items-center gap-1.5 rounded-pill bg-surface px-4 py-1.5 text-button font-bold text-ink shadow-card transition-transform hover:scale-105 active:scale-95"
          >
            <span>{active.ctaText ?? "Ver más"}</span>
            <Icon name="arrowRight" className="size-4" />
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
        />
      ) : null}

      {/* Flechas de navegación (visibles en hover en pantallas con puntero) */}
      {total > 1 ? (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              prev();
            }}
            aria-label="Promoción anterior"
            className="absolute left-2 top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-pill bg-black/25 text-on-primary opacity-0 backdrop-blur-sm transition-all hover:bg-black/45 hover:scale-110 active:scale-90 group-hover:opacity-100"
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
            className="absolute right-2 top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-pill bg-black/25 text-on-primary opacity-0 backdrop-blur-sm transition-all hover:bg-black/45 hover:scale-110 active:scale-90 group-hover:opacity-100"
          >
            <Icon name="chevronRight" className="size-5" />
          </button>
        </>
      ) : null}

      {/* Indicadores de diapositiva (dots) interactivos */}
      {total > 1 ? (
        <div className="nm-banner__dots" role="tablist" aria-label="Seleccionar diapositiva">
          {slideList.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Ir al banner ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-2 rounded-pill transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface ${
                i === index ? "w-6 bg-on-primary" : "w-2 bg-on-primary/45 hover:bg-on-primary/75"
              }`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
