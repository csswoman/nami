import Link from "next/link";
import { Suspense } from "react";
import { Icon } from "@/components/nami";
import { AppShell } from "@/components/shell/AppShell";
import { BackIcon, RoundLink } from "@/components/shell/ScreenBar";
import { ROUTE_POINTS, TrackingMap } from "@/components/tracking/TrackingMap";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { DEMO_CART, DEMO_ADDRESS } from "@/lib/demo/catalog";

export const metadata = { title: "Seguimiento del pedido · Ñami" };

const STEPS = [
  ["Recibido", "7:52 a. m."], ["Preparando", "7:54 a. m."], ["Buscando motorizado", "8:03 a. m."], ["En camino", "8:06 a. m."], ["Llegó", "8:17 a. m."],
] as const;
const HEAD = [
  ["Recibimos tu pedido", "La tienda lo está revisando."],
  ["Preparando tu pedido", "Ya están preparando tu pedido."],
  ["Buscando motorizado", "Estamos asignando a alguien cerca de Chacao."],
  ["Tu pedido va en camino", "Carlos va por la Av. Francisco de Miranda."],
  ["¡Llegó tu pedido!", "Sal a recibirlo: Carlos te espera frente a la panadería La Reina."],
] as const;

/** Punto sobre la ruta (Manhattan) a la fracción `t` y la polilínea recorrida hasta ahí. */
function along(t: number) {
  const seg = ROUTE_POINTS.slice(1).map((p, i) => Math.abs(p[0] - ROUTE_POINTS[i][0]) + Math.abs(p[1] - ROUTE_POINTS[i][1]));
  const len = seg.reduce((a, b) => a + b, 0);
  let d = Math.max(0, Math.min(1, t)) * len;
  const out: [number, number][] = [ROUTE_POINTS[0]];
  for (let i = 0; i < seg.length; i++) {
    if (d >= seg[i]) { out.push(ROUTE_POINTS[i + 1]); d -= seg[i]; continue; }
    const a = ROUTE_POINTS[i], b = ROUTE_POINTS[i + 1], k = d / seg[i];
    out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]);
    break;
  }
  return out;
}

export default function SeguimientoPage({ searchParams }: PageProps<"/seguimiento">) {
  return (
    <Suspense fallback={<AppShell mobileHeader={false} bottomNav={false}><div className="min-h-dvh" aria-busy="true" /></AppShell>}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({ searchParams }: { searchParams: PageProps<"/seguimiento">["searchParams"] }) {
  const sp = await searchParams;
  // Demo: ?estado=0..4 fija la etapa. La lógica real la derivará del pedido (estado + hora de inicio de la ruta).
  const raw = Number(typeof sp.estado === "string" ? sp.estado : 3);
  const st = Number.isInteger(raw) && raw >= 0 && raw <= 4 ? raw : 3;
  const t = st < 3 ? 0 : st === 4 ? 1 : 0.35;
  const path = along(t);
  const pos = path[path.length - 1];
  const mins = [24, 20, 16, Math.max(1, Math.round(1 + (1 - t) * 11)), 0][st];
  const done = st === 4;

  const lines = DEMO_CART;
  const shipping = 120;
  const tip = 100;

  return (
    <AppShell mobileHeader={false} bottomNav={false}>
      <div className="mx-auto w-full desktop:grid desktop:max-w-300 desktop:grid-cols-[600px_minmax(0,1fr)] desktop:items-start desktop:gap-10 desktop:pt-7">
        <div className="relative h-85 overflow-hidden bg-surface-tile desktop:sticky desktop:top-6 desktop:h-180.75 desktop:rounded-xl desktop:shadow-card">
          <TrackingMap
            className="size-full"
            traveled={path.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")}
            moto={pos}
          />
          <div className="absolute inset-x-4 top-4 flex items-center justify-between desktop:inset-x-5 desktop:top-5">
            <span className="desktop:hidden"><RoundLink href="/" label="Volver" onTile><BackIcon /></RoundLink></span>
            <Link href="/" className="hidden min-h-11 items-center gap-1 rounded-pill bg-surface-raised pr-4 pl-2.5 text-button text-ink shadow-card desktop:flex [&_.nm-icon]:size-5"><BackIcon />Volver al inicio</Link>
            <Link href="/acerca" className="flex min-h-11 items-center rounded-pill bg-surface-raised px-5 text-button text-ink shadow-card desktop:hidden">Ayuda</Link>
          </div>
        </div>

        <div className="relative -mt-6 flex flex-col gap-5 rounded-t-xl bg-surface px-4 pt-3 pb-10 desktop:mt-0 desktop:gap-5.5 desktop:rounded-none desktop:px-0 desktop:pt-0">
          <span className="mx-auto h-1 w-10 rounded-pill bg-border desktop:hidden" aria-hidden="true" />
          <div className="flex flex-col gap-1.5">
            <span className="text-caption font-bold text-ink-muted">
              {done ? "Entregado a las 8:17 a. m." : `Llega en ${mins} min · entre 8:14 y 8:20 a. m.`}
            </span>
            <h1 className="font-display text-[28px] leading-8 font-extrabold desktop:text-[36px] desktop:leading-10">{HEAD[st][0]}</h1>
            <p className="text-body text-ink-muted">{HEAD[st][1]}</p>
            <div className="mt-2 grid grid-cols-5 gap-1.5" aria-hidden="true">
              {STEPS.map((_, i) => (
                <span key={i} className={`h-1.5 rounded-pill ${i < st || done ? "bg-primary" : i === st ? "bg-promo" : "bg-border"}`} />
              ))}
            </div>
          </div>

          <ol className="flex flex-col">
            {STEPS.map(([label, time], i) => {
              const isDone = i < st || done;
              const cur = i === st && !done;
              return (
                <li key={label} className="flex min-h-12 gap-3.5" aria-current={cur ? "step" : undefined}>
                  <span className="flex w-6 shrink-0 flex-col items-center">
                    <span className={`box-border grid size-6 place-items-center rounded-pill text-badge text-on-primary ${isDone ? "bg-primary" : cur ? "border-[7px] border-primary bg-surface-raised" : "border-2 border-border bg-surface"}`}>
                      {isDone ? "✓" : ""}
                    </span>
                    {i < STEPS.length - 1 ? <span className={`min-h-5 w-0.5 grow ${i < st ? "bg-primary" : "bg-border"}`} /> : null}
                  </span>
                  <span className="flex grow justify-between gap-2 pt-px">
                    <span className={`text-body ${cur ? "font-bold" : "font-medium"} ${isDone || cur ? "text-ink" : "text-ink-muted"}`}>{label}</span>
                    <span className="text-caption text-ink-muted">{isDone || cur ? time : ""}</span>
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="flex items-center gap-3 rounded-lg bg-surface-tile p-3.5">
            <span className="grid size-13 shrink-0 place-items-center rounded-pill bg-ink font-display text-[17px] font-black text-surface">CM</span>
            <div className="flex min-w-0 grow flex-col gap-0.5">
              <span className="text-body-strong font-bold">Carlos Mendoza</span>
              <span className="flex items-center gap-1 text-caption text-ink-muted [&_.nm-icon]:size-4"><Icon name="star" />4,9 · Moto negra · AB2C34D</span>
            </div>
            <button type="button" aria-label="Llamar a Carlos" className="grid size-11 place-items-center rounded-pill bg-surface-raised text-ink">
              <svg className="nm-icon size-5" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /></svg>
            </button>
            <button type="button" aria-label="Escribirle a Carlos" className="grid size-11 place-items-center rounded-pill bg-surface-raised text-ink">
              <svg className="nm-icon size-5" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4V5Z" /></svg>
            </button>
          </div>

          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-pill bg-primary-tint text-primary-text [&_.nm-icon]:size-5"><Icon name="pin" /></span>
            <div className="flex flex-col gap-0.5">
              <span className="text-body-strong font-semibold">{DEMO_ADDRESS.line}</span>
              <span className="text-caption text-ink-muted">{DEMO_ADDRESS.reference}</span>
            </div>
          </div>

          <OrderSummary fallback={{ code: "ÑM-2048", store: "Arepera Doña Chela", lines: lines.map((l) => ({ key: l.id, name: l.name, qty: l.qty, unitCents: l.unitCents })), shippingCents: shipping, tipCents: tip }} />

          <div className="flex flex-col gap-2.5 rounded-lg border border-dashed border-border p-4">
            <span className="text-caption font-bold text-ink-muted">Modo demo · El repartidor avanza solo</span>
            {done ? <Link href="/entregado" className="nm-btn nm-btn--primary nm-btn--block">Confirmar que lo recibí</Link> : null}
            <Link href={done ? "/seguimiento?estado=0" : `/seguimiento?estado=${st + 1}`} replace scroll={false} className="nm-btn nm-btn--secondary nm-btn--block">
              <Icon name={done ? "repeat" : "chevronRight"} />{done ? "Reiniciar simulación" : "Avanzar al siguiente estado"}
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
