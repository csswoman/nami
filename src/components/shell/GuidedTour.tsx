"use client";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/nami";
import { useInspector } from "@/lib/inspector";

/**
 * Recorrido guiado sobre la propia app: resalta una parte de la pantalla y explica qué pasa por detrás.
 * El paso actual se guarda en este navegador, así sobrevive a la navegación entre páginas.
 */
type Step = {
  /** Página del paso; `prefix` acepta subrutas (/seguimiento?id=…). */
  path: string;
  prefix?: boolean;
  /** Elemento a resaltar (`[data-tour=…]`). Sin él, la tarjeta va centrada. */
  target?: string;
  title: string;
  text: string;
  /** El paso siguiente llega solo cuando el visitante hace algo (p. ej. confirmar el pedido). */
  waitFor?: string;
  cta?: string;
};
const STORE = "/tienda/arepera-dona-chela";
const STEPS: Step[] = [
  { path: "/", target: "categorias", title: "Esto es Ñami", text: "Una app de delivery de Caracas hecha de punta a punta: diseño, frontend, backend y base de datos. Las tiendas abren y cierran con la hora de Caracas; cámbiala con el reloj de arriba." },
  { path: STORE, target: "menu", title: "Agrega algo al carrito", text: "El carrito vive en tu navegador (Zustand). Lo que mandes al pagar son solo ids y cantidades: los precios los vuelve a leer el servidor." },
  { path: "/checkout", target: "cupon", title: "Prueba un cupón", text: "Escribe NAMI10. El descuento no lo calcula el navegador: una Server Action lo cotiza con los precios de la base de datos." },
  { path: "/checkout", target: "pedir", title: "Haz el pedido", text: "El servidor valida con Zod, recalcula todo en una transacción y guarda la tasa Bs./$ del momento. Te dejé activado «Bajo el capó» para que lo veas.", waitFor: "/seguimiento" },
  { path: "/seguimiento", prefix: true, target: "etapas", title: "Sigue tu pedido", text: "El estado llega por polling cada 4 s y la moto se mueve sobre una ruta guardada, sin APIs pagas. Si una tienda abre su panel, ella toma el control del pedido." },
  { path: "/demo", target: "split", title: "Ahora del otro lado", text: "Cliente, tienda y repartidor en una sola pantalla. Haz un pedido a la izquierda, acéptalo en el centro y entrégalo a la derecha.", cta: "Terminar" },
];
const KEY = "nami_tour";
const EVENT = "nami:tour";
const read = (): number | null => {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === null ? null : Math.max(0, Math.min(STEPS.length - 1, Number(v) || 0));
  } catch {
    return null;
  }
};
const write = (v: number | null) => {
  try {
    if (v === null) window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, String(v));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
};
/** Dentro de los iframes de /demo no se muestra: el recorrido va en la página de afuera. */
const inFrame = () => {
  try {
    return window.parent !== window;
  } catch {
    return true;
  }
};
const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
};
/** Empieza el recorrido desde el primer paso (lo usan /bienvenida y /acerca). */
export function startTour() {
  write(0);
  useInspector.getState().setEnabled(true);
  useInspector.getState().setOpen(false);
}
const matches = (s: Step, pathname: string) => (s.prefix ? pathname.startsWith(s.path) : pathname === s.path);
/** Primer elemento visible con ese `data-tour` (la app tiene versiones móvil y escritorio de algunas secciones). */
function findTarget(name: string): HTMLElement | null {
  const all = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`));
  return all.find((el) => el.getClientRects().length > 0) ?? null;
}

export function GuidedTour() {
  const router = useRouter();
  const pathname = usePathname();
  const index = useSyncExternalStore(subscribe, () => (inFrame() ? null : read()), () => null);
  const [measured, setRect] = useState<DOMRect | null>(null);
  const step = index === null ? null : STEPS[index];
  const here = step ? matches(step, pathname) : false;
  // Paso que espera una acción: cuando el visitante llega a la página siguiente, el recorrido avanza solo.
  useEffect(() => {
    if (index === null || !step?.waitFor) return;
    if (pathname.startsWith(step.waitFor)) write(index + 1);
  }, [index, step, pathname]);
  const measure = useCallback(() => {
    if (!step?.target || !here) return;
    const el = findTarget(step.target);
    setRect(el ? el.getBoundingClientRect() : null);
  }, [step, here]);
  useEffect(() => {
    if (!step?.target || !here) return;
    let tries = 0;
    // La página puede tardar en pintar el elemento (Suspense, datos del cliente): se busca un rato.
    const timer = setInterval(() => {
      const el = findTarget(step.target!);
      if (el || ++tries > 30) {
        clearInterval(timer);
        if (el) {
          measure();
          el.scrollIntoView({ block: "center", behavior: "smooth" });
          setTimeout(measure, 400);
        }
      }
    }, 100);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      clearInterval(timer);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step, here, measure]);
  if (index === null || !step) return null;
  // Un rectángulo medido para otro paso no sirve: sin elemento en este paso, la tarjeta va centrada.
  const rect = step.target && here && measured && findTarget(step.target) ? measured : null;
  const last = index === STEPS.length - 1;
  const next = () => {
    if (last) return write(null);
    const n = STEPS[index + 1];
    write(index + 1);
    if (!matches(n, pathname)) router.push(n.path);
  };
  const back = () => {
    if (index === 0) return;
    const p = STEPS[index - 1];
    write(index - 1);
    if (!matches(p, pathname)) router.push(p.path);
  };
  if (!here) {
    return (
      <div role="status" className="fixed inset-x-4 bottom-24 z-[60] mx-auto flex max-w-md items-center gap-3 rounded-lg bg-ink p-3 text-surface shadow-card desktop:bottom-6">
        <span className="grow text-caption">Recorrido: paso {index + 1} de {STEPS.length} · {step.title}</span>
        <button type="button" onClick={() => router.push(step.path)} className="nm-btn nm-btn--primary nm-btn--sm">Ir</button>
        <button type="button" onClick={() => write(null)} aria-label="Salir del recorrido" className="text-surface"><Icon name="close" /></button>
      </div>
    );
  }
  // Tarjeta debajo del elemento si cabe; si no, arriba. Sin elemento, centrada abajo.
  const below = rect ? rect.bottom + 220 < window.innerHeight : true;
  const cardStyle = rect
    ? { top: below ? rect.bottom + 12 : undefined, bottom: below ? undefined : window.innerHeight - rect.top + 12, left: Math.max(16, Math.min(rect.left, window.innerWidth - 376)) }
    : undefined;
  return (
    <>
      {rect ? (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[59] rounded-lg transition-all duration-300"
          style={{ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12, boxShadow: "0 0 0 3px var(--primary), 0 0 0 9999px color-mix(in srgb, var(--ink) 35%, transparent)" }}
        />
      ) : null}
      <div
        role="dialog"
        aria-label={`Recorrido guiado, paso ${index + 1} de ${STEPS.length}`}
        className={`fixed z-[60] flex w-[calc(100%-32px)] max-w-90 flex-col gap-2 rounded-lg bg-surface-raised p-4 shadow-card ${rect ? "" : "inset-x-4 bottom-24 mx-auto desktop:bottom-8"}`}
        style={cardStyle}
        data-testid="tour"
      >
        <span className="text-caption font-bold text-primary-text">Paso {index + 1} de {STEPS.length}</span>
        <h2 className="font-display text-title-md">{step.title}</h2>
        <p className="text-body text-ink-muted">{step.text}</p>
        <div className="mt-1 flex items-center gap-2">
          <button type="button" onClick={() => write(null)} className="text-caption font-bold text-ink-muted">Salir</button>
          <span className="grow" />
          {index > 0 ? <button type="button" onClick={back} className="nm-btn nm-btn--secondary nm-btn--sm">Atrás</button> : null}
          {step.waitFor ? null : <button type="button" onClick={next} className="nm-btn nm-btn--primary nm-btn--sm">{step.cta ?? (last ? "Terminar" : "Siguiente")}</button>}
        </div>
      </div>
    </>
  );
}

/** Botón para empezar el recorrido. */
export function StartTourButton({ className = "nm-btn nm-btn--primary", label = "Hacer el recorrido guiado" }: { className?: string; label?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        startTour();
        router.push("/");
      }}
      data-testid="start-tour"
    >
      {label}
    </button>
  );
}
