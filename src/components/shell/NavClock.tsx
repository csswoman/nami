"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/nami";
import { FRANJAS, isFranja, caracasNow, FRANJA_COOKIE, type Franja } from "@/lib/demo/franja";
import { FRANJA_CONTENT } from "@/lib/demo/home";

const FRANJA_HOURS: Record<Franja, string> = {
  desayuno: "6:00 a 11:00 a. m.",
  almuerzo: "11:00 a. m. a 3:00 p. m.",
  merienda: "3:00 a 6:00 p. m.",
  cena: "6:00 a 10:00 p. m.",
  noche: "10:00 p. m. a 6:00 a. m.",
};

function readCookie(): string | undefined {
  return document.cookie.split("; ").find((c) => c.startsWith(`${FRANJA_COOKIE}=`))?.split("=")[1];
}
const subscribeNoop = () => () => {};
type NavClockProps = {
  variant?: "topbar" | "header";
};

export function NavClock(props: NavClockProps) {
  return (
    <Suspense fallback={<NavClockFallback variant={props.variant} />}>
      <NavClockContent {...props} />
    </Suspense>
  );
}

function NavClockFallback({ variant }: NavClockProps) {
  if (variant === "header") {
    return (
      <button type="button" className="nm-iconbtn" aria-label="Reloj del demo">
        <Icon name="clock" />
      </button>
    );
  }
  return (
    <div className="nm-topbar__clock opacity-70">
      <Icon name="clock" />
      <span>Caracas</span>
    </div>
  );
}

function NavClockContent({ variant = "topbar" }: NavClockProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const cookieValue = useSyncExternalStore(subscribeNoop, readCookie, () => undefined);
  const param = searchParams.get("franja");
  const raw = param !== null ? param : cookieValue;
  const isManual = isFranja(raw ?? undefined);
  const real = caracasNow();
  const manual = isManual ? (raw as Franja) : undefined;
  const activeFranja: Franja = manual ?? real.franja;
  const activeHora = manual ? FRANJA_CONTENT[manual].hora : real.hora;
  const activeLabel = FRANJA_CONTENT[activeFranja].label;

  // Cerrar al hacer clic afuera o pulsar Escape
  useEffect(() => {
    if (!isOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  const selectFranja = (f: Franja) => {
    setIsOpen(false);
    // Si estamos en la home, actualizamos query param
    if (pathname === "/") {
      router.push(`/?franja=${f}`, { scroll: false });
    } else {
      router.push(`/?franja=${f}`);
    }
  };

  const resetToReal = () => {
    setIsOpen(false);
    router.push("/?franja=real", { scroll: false });
  };

  return (
    <div ref={wrapperRef} className="relative inline-flex items-center">
      {variant === "header" ? (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="nm-iconbtn relative"
          aria-label={`Simulador de hora: ${activeLabel} (${activeHora})`}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
        >
          <Icon name="clock" />
          {isManual ? <i className="nm-iconbtn__dot !bg-brand-yellow" /> : null}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="nm-topbar__clock"
          aria-label={`Simulador de hora: ${activeLabel} (${activeHora})`}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
        >
          <Icon name="clock" />
          <span className="font-bold">{activeLabel}</span>
          <span className="opacity-80">· {activeHora}</span>
          {isManual ? (
            <span className="nm-badge nm-badge--promo text-[10px] py-0 px-1.5 ml-0.5">Demo</span>
          ) : null}
          <Icon name="chevronDown" className="opacity-80" />
        </button>
      )}

      {/* Popover flotante del simulador de horario */}
      {isOpen ? (
        <div className="nm-clock-popover" role="dialog" aria-label="Simulador de horario de Caracas">
          <div className="nm-clock-popover__panel">
            {/* Header del popover */}
            <div className="nm-clock-popover__header">
              <div className="flex items-center gap-2">
                <span className="nm-clock-popover__icon">
                  <Icon name="clock" />
                </span>
                <div className="flex flex-col">
                  <span className="font-display font-extrabold text-[15px] leading-5 text-ink">
                    Simulador de horario
                  </span>
                  <span className="text-[12px] text-ink-muted">Hora de Caracas (UTC-4)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="nm-iconbtn text-ink-muted hover:text-ink"
                aria-label="Cerrar simulador"
              >
                <Icon name="close" />
              </button>
            </div>

            <p className="px-4 pt-3 text-[13px] text-ink-muted leading-relaxed">
              Las tiendas abren y cierran según la hora elegida. Prueba cómo cambia la app en cada momento del día:
            </p>

            {/* Opciones de franja horaria */}
            <div className="flex flex-col gap-1.5 p-3">
              {FRANJAS.map((f) => {
                const isSelected = f === activeFranja && isManual;
                const isCurrentReal = f === real.franja;
                const content = FRANJA_CONTENT[f];

                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => selectFranja(f)}
                    className={`flex items-center justify-between rounded-lg px-3.5 py-2.5 text-left transition-all ${
                      isSelected
                        ? "bg-primary text-on-primary font-bold shadow-sm"
                        : "bg-surface-tile hover:bg-border/60 text-ink"
                    }`}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[14px]">{content.label}</span>
                        {isCurrentReal ? (
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-pill ${
                              isSelected
                                ? "bg-on-primary/20 text-on-primary"
                                : "bg-leaf/15 text-leaf font-bold"
                            }`}
                          >
                            Hora actual
                          </span>
                        ) : null}
                      </div>
                      <span
                        className={`text-[11px] ${
                          isSelected ? "text-on-primary/80" : "text-ink-muted"
                        }`}
                      >
                        {FRANJA_HOURS[f]}
                      </span>
                    </div>

                    <span className="text-[13px] font-semibold opacity-90">
                      {content.hora}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Footer con opción de restablecer hora real */}
            <div className="border-t border-border p-3 bg-surface-tile flex flex-col gap-1.5">
              {isManual ? (
                <button
                  type="button"
                  onClick={resetToReal}
                  className="nm-btn nm-btn--secondary nm-btn--block nm-btn--sm !text-primary-text font-bold"
                >
                  ↺ Volver a la hora real ({real.hora})
                </button>
              ) : (
                <div className="text-center text-[12px] text-ink-muted py-1 flex items-center justify-center gap-1.5">
                  <span className="size-2 rounded-full bg-leaf inline-block" />
                  Sincronizado con la hora real de Caracas ({real.hora})
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
