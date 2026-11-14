"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CloseIcon } from "@/components/shell/glyphs";
import { useCartReady } from "@/lib/cart/hooks";
import { useCartStore } from "@/lib/cart/store";

const LABELS = ["Toca una estrella", "No me gustó", "Podría mejorar", "Estuvo bien", "Muy buena", "¡Espectacular!"];
const TAGS = ["Llegó rápido", "Muy amable", "Bien empacado", "Llegó caliente"];

/** Confeti de la ilustración: posiciones del diseño (viewBox 390×340). */
function Confetti() {
  return (
    <svg className="absolute inset-0 size-full" viewBox="0 0 390 340" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <circle cx="195" cy="270" r="160" className="fill-promo opacity-35" />
      <rect x="40" y="60" width="12" height="6" rx="3" className="fill-brand" transform="rotate(30 46 63)" />
      <rect x="320" y="70" width="14" height="6" rx="3" className="fill-brand-blue" transform="rotate(-20 327 73)" />
      <rect x="90" y="30" width="10" height="5" rx="2.5" className="fill-brand-green" transform="rotate(-40 95 32)" />
      <rect x="270" y="36" width="12" height="5" rx="2.5" className="fill-brand-orange" transform="rotate(50 276 38)" />
      <circle cx="70" cy="140" r="5" className="fill-brand-orange" />
      <circle cx="330" cy="150" r="6" className="fill-brand" />
      <circle cx="180" cy="40" r="4" className="fill-brand-blue" />
      <rect x="355" y="120" width="10" height="5" rx="2.5" className="fill-promo" transform="rotate(20 360 122)" />
      <rect x="20" y="200" width="12" height="5" rx="2.5" className="fill-brand-blue" transform="rotate(-25 26 202)" />
    </svg>
  );
}

type Props = { storeName: string; deliveredAt: string; earlyMin: number; courier: string };

/** Pedido entregado: calificación local (estrellas, etiquetas y comentario); el envío real lo conecta la lógica. */
export function EntregadoView({ storeName: demoStore, deliveredAt, earlyMin, courier }: Props) {
  const router = useRouter();
  const order = useCartStore((st) => st.order);
  const add = useCartStore((st) => st.add);
  const ready = useCartReady();
  const storeName = ready && order ? order.store.name : demoStore;
  const repeat = () => {
    if (order) for (const l of order.lines) add(order.store, { productId: l.productId, name: l.name, unitCents: l.unitCents, icon: l.icon, note: l.note, qty: l.qty });
    router.push("/carrito");
  };
  const [food, setFood] = useState(5);
  const [tags, setTags] = useState<number[]>([0, 2]);
  const [sent, setSent] = useState(false);

  const toggle = (i: number) => setTags((t) => (t.includes(i) ? t.filter((x) => x !== i) : [...t, i]));
  const short = storeName.split(" ").slice(-2).join(" ");

  return (
    <div className="mx-auto flex w-full flex-col desktop:max-w-390 desktop:flex-row desktop:overflow-hidden desktop:rounded-3xl desktop:shadow-card desktop:my-10 desktop:min-h-170 desktop:w-[calc(100%-4rem)]">
      <div className="relative flex h-85 shrink-0 items-end justify-center overflow-hidden bg-surface-warm desktop:h-auto desktop:w-[44%]">
        <Confetti />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/guacamaya-celebra.png" alt="La guacamaya de Ñami celebrando la entrega" className="relative -mb-2 h-65 w-auto desktop:h-[78%]" />
        <Link href="/" aria-label="Cerrar y volver al inicio" className="absolute top-4 right-4 grid size-11 place-items-center rounded-pill bg-surface-raised text-ink [&_.nm-icon]:size-5 desktop:hidden">
          <CloseIcon />
        </Link>
      </div>

      <div className="flex grow flex-col gap-6 bg-surface px-5 pt-6 pb-8 desktop:justify-center desktop:px-12 desktop:py-12">
        <div className="flex flex-col items-center gap-1.5 text-center desktop:items-start desktop:text-left">
          <span className="rounded-pill bg-success-tint px-3 py-1 text-badge font-bold text-ink">Entregado a las {deliveredAt}</span>
          <h1 className="mt-1 font-display text-[30px] leading-8.5 font-extrabold desktop:text-[52px] desktop:leading-14">¡Buen provecho!</h1>
          <p className="text-body text-ink-muted">Tu pedido de {storeName} llegó {earlyMin} minutos antes de lo estimado.</p>
        </div>

        <section className="flex flex-col items-center gap-2 rounded-lg bg-surface-tile p-4.5 desktop:p-6">
          <h2 className="text-body-strong font-bold">¿Qué tal la comida?</h2>
          <div role="radiogroup" aria-label="Calificación de la comida" className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={n === food} aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`} onClick={() => setFood(n)} className="grid size-12 place-items-center">
                <svg viewBox="0 0 24 24" className={`size-9 stroke-2 ${n <= food ? "fill-promo stroke-ink" : "fill-none stroke-border"}`} strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" />
                </svg>
              </button>
            ))}
          </div>
          <span className="text-caption font-medium text-ink-muted" aria-live="polite">{LABELS[food]}</span>
        </section>

        <section className="flex flex-col gap-2.5">
          <h2 className="text-body-strong font-bold">¿Y la entrega de {courier}?</h2>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((t, i) => {
              const on = tags.includes(i);
              return (
                <button key={t} type="button" aria-pressed={on} onClick={() => toggle(i)} className={`min-h-10 rounded-pill px-3.5 text-caption font-bold ${on ? "bg-ink text-surface" : "border border-border bg-surface text-ink"}`}>{t}</button>
              );
            })}
          </div>
          <label htmlFor="coment" className="mt-1.5 text-body-strong font-semibold">Comentario (opcional)</label>
          <textarea id="coment" rows={2} placeholder={`Cuéntale a ${short.replace("Arepera ", "")} qué te pareció`} className="resize-none rounded-md border border-border bg-surface px-4 py-3 text-body text-ink" />
        </section>

        {sent ? <p role="status" className="rounded-md bg-success-tint px-4 py-3 text-center text-caption font-bold">¡Gracias por calificar!</p> : null}
        <div className="mt-auto flex flex-col gap-2 desktop:mt-0 desktop:flex-row">
          <button type="button" onClick={() => setSent(true)} className="nm-btn nm-btn--primary desktop:grow">Enviar calificación</button>
          <button type="button" onClick={repeat} className="nm-btn nm-btn--secondary">Repetir pedido</button>
        </div>
      </div>
    </div>
  );
}
