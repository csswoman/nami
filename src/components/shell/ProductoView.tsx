"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon, type IconName } from "@/components/nami";
import { FavoriteButton } from "@/components/shell/FavoriteButton";
import { CheckIcon, CloseIcon } from "@/components/shell/glyphs";
import type { OptionGroup } from "@/lib/catalog";
import { useCart } from "@/lib/cart/hooks";
import { groupOf, useCartStore, type CartStore } from "@/lib/cart/store";
import { formatUsd, formatVes } from "@/lib/money";

type Props = {
  store: CartStore;
  productId: string;
  name: string;
  desc: string;
  icon: IconName;
  image?: string;
  priceCents: number;
  rate: number;
  storeName: string;
  storeArea: string;
  backHref: string;
  groups: OptionGroup[];
  /** Unidades que quedan; tope de la cantidad (descontando lo que ya llevas en el carrito). */
  stock?: number;
  /** true = se abre encima de la tienda (ruta interceptada): capa fija, cierra con Esc o clic fuera. */
  modal?: boolean;
};

const SCATTER: { icon: IconName; x: number; y: number; s: number }[] = [
  { icon: "hamburguesa", x: 8, y: 14, s: 34 },
  { icon: "pepito", x: 28, y: 10, s: 34 },
  { icon: "empanada", x: 48, y: 16, s: 30 },
  { icon: "tequeno", x: 34, y: 38, s: 36 },
  { icon: "empanada", x: 12, y: 62, s: 30 },
  { icon: "pabellon", x: 26, y: 72, s: 34 },
  { icon: "hamburguesa", x: 48, y: 66, s: 34 },
];

/** Detalle de producto: opciones, nota, cantidad y total. Estado local; agregar al carrito lo conecta la lógica. */
export function ProductoView({ store, productId, name, desc, icon, image, priceCents, rate, storeName, storeArea, backHref, groups, stock, modal = false }: Props) {
  const { groups: cartGroups } = useCart();
  const inCart = (groupOf(cartGroups, store.slug)?.lines ?? []).filter((l) => l.productId === productId).reduce((n, l) => n + l.qty, 0);
  const maxQty = Math.max(1, Math.min(20, stock != null ? stock - inCart : 20));
  const noneLeft = stock != null && stock - inCart <= 0;
  const [picked, setPicked] = useState<Record<string, string[]>>(() => Object.fromEntries(groups.map((g) => [g.id, g.defaults])));
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const router = useRouter();
  const add = useCartStore((st) => st.add);

  // Como modal, "cerrar" vuelve atrás (la tienda ya está debajo); sin historial previo, va a la tienda.
  const close = () => (window.history.length > 1 ? router.back() : router.push(backHref));
  const closeProps = modal ? { onClick: (e: React.MouseEvent) => { e.preventDefault(); close(); } } : {};
  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modal]);
  const onBackdrop = modal ? (e: React.MouseEvent) => { if (e.target === e.currentTarget) close(); } : undefined;

  const toggle = (g: OptionGroup, id: string) =>
    setPicked((p) => {
      const cur = p[g.id] ?? [];
      if (g.kind === "one") return { ...p, [g.id]: [id] };
      if (cur.includes(id)) return { ...p, [g.id]: cur.filter((x) => x !== id) };
      if (g.max && cur.length >= g.max) return p;
      return { ...p, [g.id]: [...cur, id] };
    });

  const extras = groups.reduce((n, g) => n + g.options.filter((o) => picked[g.id]?.includes(o.id)).reduce((a, o) => a + o.priceCents, 0), 0);
  const total = (priceCents + extras) * qty;

  function addToCart() {
    const chosen = groups.flatMap((g) => g.options.filter((o) => picked[g.id]?.includes(o.id)).map((o) => o.label));
    const text = [...chosen, note.trim()].filter(Boolean).join(" · ");
    add(store, { productId, name, unitCents: priceCents + extras, icon, image, note: text || undefined, options: groups.length ? picked : undefined, userNote: note.trim() || undefined, qty: Math.min(qty, maxQty), stock });
    router.push(backHref);
  }

  const hero = image ? (
    <div className="relative h-72 overflow-hidden rounded-xl bg-surface-tile desktop:h-86">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" className="size-full object-cover" />
    </div>
  ) : (
    <div className="relative h-72 overflow-hidden rounded-xl bg-brand-orange text-on-primary desktop:h-86">
      <div className="absolute inset-y-0 right-0 aspect-square h-full translate-x-[8%] rounded-pill bg-on-primary/10" />
      {SCATTER.map((d, i) => (
        <span key={i} className="absolute opacity-35 [&_.nm-icon]:size-full" style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.s, height: d.s }}><Icon name={d.icon} /></span>
      ))}
      <span className="absolute top-1/2 right-[18%] size-36 -translate-y-1/2 desktop:right-[10%] desktop:size-44 [&_.nm-icon]:size-full [&_.nm-icon]:stroke-1"><Icon name={icon} /></span>
    </div>
  );

  const titleBlock = (
    <div className="flex flex-col gap-2">
      <h1 className="font-display text-[32px] leading-9 font-extrabold desktop:text-[40px] desktop:leading-11">{name}</h1>
      <p className="text-body text-ink-muted">{desc}</p>
      <div className="flex items-baseline gap-3">
        <span className="text-[28px] leading-8 font-extrabold">{formatUsd(priceCents)}</span>
        <span className="text-body text-ink-muted">{formatVes(priceCents, rate)}</span>
      </div>
      <span className="hidden text-caption text-ink-muted desktop:block">{storeName} · {storeArea}</span>
      <span className="self-start pt-1"><FavoriteButton variant="pill" target={{ kind: "product", product: { store: store.slug, id: productId } }} name={name} /></span>
    </div>
  );

  const options = (scope: string) => (
    <div className="flex flex-col gap-6 desktop:gap-4">
      {groups.map((g) => {
        const sel = picked[g.id] ?? [];
        const ready = !g.required || sel.length > 0;
        const hid = `${scope}-g-${g.id}`;
        return (
          <section key={g.id} aria-labelledby={hid}>
            <div className="flex items-center justify-between gap-3 bg-surface-tile px-4 py-3.5 desktop:rounded-lg desktop:px-6">
              <div className="flex flex-col">
                <h2 id={hid} className="font-display text-title-md">{g.title}</h2>
                <span className="text-caption text-ink-muted">{g.hint}</span>
              </div>
              <span className={`rounded-pill px-3 py-1.5 text-badge font-bold ${g.required && ready ? "bg-success-tint text-ink" : g.required ? "bg-primary-tint text-primary-text" : "bg-surface-raised text-ink-muted"}`}>
                {g.required ? (ready ? "Listo" : "Obligatorio") : "Opcional"}
              </span>
            </div>
            <ul role={g.kind === "one" ? "radiogroup" : "group"} aria-labelledby={hid}>
              {g.options.map((o) => {
                const on = sel.includes(o.id);
                return (
                  <li key={o.id} className="border-b border-border">
                    <button
                      type="button"
                      role={g.kind === "one" ? "radio" : "checkbox"}
                      aria-checked={on}
                      onClick={() => toggle(g, o.id)}
                      className="flex min-h-14 w-full items-center gap-3.5 px-4 text-left desktop:px-6"
                    >
                      {g.kind === "one" ? (
                        <span className={`box-border size-6 shrink-0 rounded-pill ${on ? "border-[7px] border-primary bg-surface" : "border-2 border-border"}`} />
                      ) : (
                        <span className={`box-border grid size-6 shrink-0 place-items-center rounded-sm text-on-primary [&_.nm-icon]:size-4 ${on ? "bg-primary" : "border-2 border-border"}`}>{on ? <CheckIcon /> : null}</span>
                      )}
                      <span className="grow text-body">{o.label}</span>
                      {o.priceCents ? <span className="text-body text-ink-muted">+ {formatUsd(o.priceCents)}</span> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      <div className="flex flex-col gap-2 px-4 desktop:px-0">
        <label htmlFor={`${scope}-nota`} className="font-display text-title-md">Nota para la cocina</label>
        <textarea id={`${scope}-nota`} rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Por ejemplo: sin cebolla, por favor" className="resize-none rounded-md border border-border bg-surface px-4 py-3 text-body text-ink" />
      </div>
    </div>
  );

  const bar = (
    <div className="flex items-center gap-3 border-t border-border bg-surface p-4 desktop:px-6">
      <div className="flex items-center gap-1 rounded-pill bg-surface-tile p-1">
        <button type="button" aria-label="Quitar una unidad" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid size-11 place-items-center rounded-pill bg-surface-raised text-ink shadow-card disabled:opacity-50">
          <svg className="nm-icon size-5" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" /></svg>
        </button>
        <span className="w-8 text-center text-body-strong font-bold" aria-live="polite">{qty}</span>
        <button type="button" aria-label={qty >= maxQty ? "No quedan más unidades" : "Agregar una unidad"} disabled={qty >= maxQty} onClick={() => setQty((q) => Math.min(maxQty, q + 1))} className="grid size-11 place-items-center rounded-pill bg-surface-raised text-ink shadow-card disabled:opacity-50">
          <Icon name="plus" className="size-5" />
        </button>
      </div>
      <button type="button" onClick={addToCart} disabled={noneLeft} className="nm-btn nm-btn--primary grow">{noneLeft ? "Ya tienes todas las unidades" : `Agregar · ${formatUsd(total)}`}</button>
    </div>
  );

  return (
    <>
      {/* Móvil: hoja */}
      <div
        role={modal ? "dialog" : undefined}
        aria-modal={modal || undefined}
        aria-label={modal ? name : undefined}
        onClick={onBackdrop}
        className={modal ? "fixed inset-0 z-50 flex flex-col justify-end overflow-y-auto bg-ink/60 pt-13 desktop:hidden" : "flex min-h-dvh flex-col bg-ink/60 pt-13 desktop:hidden"}
      >
        <div className="relative flex grow flex-col rounded-t-3xl bg-surface">
          <span className="mx-auto mt-2 h-1 w-10 rounded-pill bg-border" aria-hidden="true" />
          <div className="relative px-4 pt-3">
            {hero}
            <Link href={backHref} {...closeProps} aria-label="Cerrar" className="absolute top-6 right-7grid size-11 place-items-center rounded-pill bg-surface-raised text-ink shadow-card [&_.nm-icon]:size-5"><CloseIcon /></Link>
          </div>
          <div className="px-4 pt-5 pb-5">{titleBlock}</div>
          <div className="grow pb-28">{options("m")}</div>
          <div className="fixed inset-x-0 bottom-0 z-20">{bar}</div>
        </div>
      </div>

      {/* Escritorio: modal */}
      <div
        role={modal ? "dialog" : undefined}
        aria-modal={modal || undefined}
        aria-label={modal ? name : undefined}
        onClick={onBackdrop}
        className={modal ? "fixed inset-0 z-50 hidden overflow-y-auto bg-ink/50 px-8 py-10 desktop:block" : "hidden bg-ink/50 px-8 py-10 desktop:block"}
      >
        <div className="relative mx-auto grid max-w-250 grid-cols-[minmax(0,5fr)_minmax(0,6fr)] overflow-hidden rounded-3xl bg-surface shadow-card">
          <div className="flex flex-col gap-6 p-9">
            {hero}
            {titleBlock}
          </div>
          <div className="flex max-h-[calc(100dvh-10rem)] min-h-0 flex-col">
            <div className="flex justify-end p-6 pb-0">
              <Link href={backHref} {...closeProps} aria-label="Cerrar" className="grid size-11 place-items-center rounded-pill bg-surface-tile text-ink [&_.nm-icon]:size-5"><CloseIcon /></Link>
            </div>
            <div className="grow overflow-y-auto px-6 pt-2 pb-6">{options("d")}</div>
            {bar}
          </div>
        </div>
      </div>
    </>
  );
}
