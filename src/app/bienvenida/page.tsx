/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Icon, type IconName } from "@/components/nami";

export const metadata = { title: "Bienvenida · Ñami" };

const POINTS: { icon: IconName; text: string }[] = [
  { icon: "bag", text: "Ñami es una simulación: explora tiendas, arma tu pedido y sigue a la guacamaya hasta tu puerta, sin pagos reales." },
  { icon: "clock", text: "Las tiendas abren y cierran con la hora de Caracas. Si todo está cerrado, usa el modo demo para cambiar de franja." },
  { icon: "user", text: "Entras como invitado: no necesitas cuenta. Guardamos tu pedido en este navegador para que puedas seguirlo." },
];

export default function BienvenidaPage() {
  return (
    <main className="flex min-h-dvh flex-col bg-surface desktop:grid desktop:grid-cols-2">
      <div className="relative flex h-82.5 shrink-0 items-end justify-center overflow-hidden bg-surface-warm desktop:h-auto">
        <img src="/brand/nami-logo.png" alt="Ñami" className="absolute top-9 left-1/2 h-8 w-auto -translate-x-1/2 desktop:top-9 desktop:left-9 desktop:translate-x-0" />
        <span className="absolute -bottom-12 size-75 rounded-pill bg-promo/35 desktop:size-[min(88%,34rem)] desktop:-bottom-24" aria-hidden="true" />
        <span className="absolute top-27 left-12 size-7 rounded-pill bg-brand-orange/60" aria-hidden="true" />
        <span className="absolute top-22 right-18 size-3.5 rounded-pill bg-brand/60" aria-hidden="true" />
        <span className="absolute top-37 right-9 size-3.5 rounded-pill bg-brand-blue/50" aria-hidden="true" />
        <img src="/brand/guacamaya.png" alt="La guacamaya de Ñami saluda" className="relative h-60 w-auto desktop:h-[78%]" />
      </div>

      <div className="flex grow flex-col justify-center gap-6 px-5 pt-6 pb-8 desktop:px-16 desktop:py-12">
        <div className="flex flex-col items-start gap-3">
          <span className="rounded-pill bg-promo px-3 py-1.5 text-badge font-bold text-ink">Demo de portafolio</span>
          <h1 className="font-display text-[36px] leading-10 font-extrabold desktop:text-[56px] desktop:leading-16">Pide como si estuvieras en Caracas</h1>
        </div>
        <ul className="flex flex-col gap-5">
          {POINTS.map((p) => (
            <li key={p.icon} className="flex items-start gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-pill bg-primary-tint text-primary-text [&_.nm-icon]:size-5"><Icon name={p.icon} /></span>
              <span className="text-body desktop:text-[18px] desktop:leading-7">{p.text}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex flex-col gap-2 desktop:flex-row desktop:items-center desktop:gap-6">
          <Link href="/" className="nm-btn nm-btn--primary">Empezar</Link>
          <Link href="/acerca" className="min-h-12 text-center text-button leading-12 text-primary-text">Acerca del proyecto</Link>
        </div>
      </div>
    </main>
  );
}
