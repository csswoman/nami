"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { favoritesInfo, deleteMyDemoData } from "@/app/perfil/actions";
import { deliveryFor } from "@/app/direccion/actions";
import { Icon } from "@/components/nami";
import { CurrencyToggle } from "@/components/shell/CurrencyToggle";
import { StoreMark } from "@/components/shell/StoreMark";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { useCartStore } from "@/lib/cart/store";
import { formatMoney, type Currency } from "@/lib/money";
import { clearLocationCookie, reloadHome, setLocationCookie } from "@/lib/profile/browser";
import { useProfileReady } from "@/lib/profile/hooks";
import { PROFILE_KEY, useProfileStore } from "@/lib/profile/store";
import type { BrandColor } from "@/lib/demo/home";
import type { FavoriteProductInfo, FavoriteStore } from "@/server/profile";
const CART_KEY = "nami-guest";
const section = "flex flex-col gap-3 rounded-xl border border-border p-4 desktop:p-6";
const row = "flex items-center justify-between gap-4 border-b border-border py-3 last:border-0";
export function PerfilView({ money }: { money: { currency: Currency; rate: number } }) {
  const ready = useProfileReady();
  const favStores = useProfileStore((s) => s.stores);
  const favProducts = useProfileStore((s) => s.products);
  const addresses = useProfileStore((s) => s.addresses);
  const removeAddress = useProfileStore((s) => s.removeAddress);
  const toggleStore = useProfileStore((s) => s.toggleStore);
  const toggleProduct = useProfileStore((s) => s.toggleProduct);
  const current = useCartStore((s) => s.address);
  const setAddress = useCartStore((s) => s.setAddress);
  const groups = useCartStore((s) => s.groups);
  const setStoreFees = useCartStore((s) => s.setStoreFees);
  const [info, setInfo] = useState<{ stores: FavoriteStore[]; products: FavoriteProductInfo[] } | null>(null);
  const [used, setUsed] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const storesKey = favStores.join(",");
  const productsKey = favProducts.map((p) => `${p.store}/${p.id}`).join(",");
  // Nombres y precios de hoy de los favoritos (en el navegador solo están los slugs).
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    favoritesInfo({ stores: favStores, products: favProducts }).then((r) => !cancelled && setInfo(r)).catch(() => !cancelled && setInfo({ stores: [], products: [] }));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, storesKey, productsKey]);
  async function applySaved(a: (typeof addresses)[number]) {
    setAddress({ name: a.name, line: a.line, reference: a.reference, lat: a.lat, lng: a.lng });
    setLocationCookie(a.lat, a.lng);
    // El envío de cada tienda del carrito se pone al día con las rutas de la nueva dirección.
    const quote = await deliveryFor(a.lat, a.lng, groups.map((g) => g.store.slug)).catch(() => null);
    if (quote?.stores.length) setStoreFees(Object.fromEntries(quote.stores.map((x) => [x.slug, x.feeCents])));
    setUsed(a.id);
  }
  async function wipe() {
    setBusy(true);
    try {
      const { orders } = await deleteMyDemoData();
      try {
        localStorage.removeItem(CART_KEY);
        localStorage.removeItem(PROFILE_KEY);
      } catch { /* sin almacenamiento: no hay nada que borrar */ }
      clearLocationCookie();
      setDone(`Listo: borramos ${orders} ${orders === 1 ? "pedido" : "pedidos"} y lo guardado en este navegador.`);
      // Recarga completa para que el carrito y el perfil arranquen vacíos sin volver a escribir lo borrado.
      window.setTimeout(reloadHome, 1200);
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }
  return (
    <div className="grid gap-6 desktop:grid-cols-2 desktop:items-start">
      <section aria-labelledby="p-dir" className={section}>
        <h2 id="p-dir" className="font-display text-title-lg">Mis direcciones</h2>
        {!ready || addresses.length === 0 ? (
          <p className="text-body text-ink-muted">Aún no guardas ninguna. En <Link href="/direccion" className="font-bold text-primary-text underline">Elegir dirección</Link> marca «Guardar esta dirección en mi perfil».</p>
        ) : (
          <ul>
            {addresses.map((a) => (
              <li key={a.id} className={row}>
                <span className="flex min-w-0 flex-col">
                  <b className="text-body-strong">{a.name}</b>
                  <span className="text-caption text-ink-muted">{a.line}</span>
                  {current.lat === a.lat && current.lng === a.lng ? <span className="text-badge text-success">En uso</span> : null}
                  {used === a.id ? <span role="status" className="text-badge text-success">Ahora entregamos aquí.</span> : null}
                </span>
                <span className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => void applySaved(a)} className="nm-btn nm-btn--secondary nm-btn--sm">Usar</button>
                  <button type="button" onClick={() => removeAddress(a.id)} aria-label={`Quitar ${a.name}`} className="nm-btn nm-btn--ghost nm-btn--sm">Quitar</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="p-pref" className={section}>
        <h2 id="p-pref" className="font-display text-title-lg">Preferencias</h2>
        <div className={row}>
          <span className="flex flex-col"><b className="text-body-strong">Moneda</b><span className="text-caption text-ink-muted">Precios en {money.currency === "USD" ? "dólares ($)" : "bolívares (Bs.)"}. Tasa de demo: Bs. {money.rate.toString().replace(".", ",")} por $.</span></span>
          <CurrencyToggle />
        </div>
        <div className={row}>
          <span className="flex flex-col"><b className="text-body-strong">Tema</b><span className="text-caption text-ink-muted">Claro u oscuro. Se guarda en este navegador.</span></span>
          <ThemeToggle />
        </div>
      </section>

      <section aria-labelledby="p-fav" className={`${section} desktop:col-span-2`}>
        <h2 id="p-fav" className="font-display text-title-lg">Favoritos</h2>
        <p className="text-caption text-ink-muted">Se guardan solo en este navegador. Marca la estrella en una tienda o en un producto.</p>
        {!ready || !info || (info.stores.length === 0 && info.products.length === 0) ? (
          <p className="text-body text-ink-muted">{ready && info ? "Todavía no tienes favoritos." : "Cargando…"}</p>
        ) : (
          <div className="grid gap-6 desktop:grid-cols-2">
            <div>
              <h3 className="pb-2 text-body-strong font-bold">Tiendas ({info.stores.length})</h3>
              <ul>
                {info.stores.map((s) => (
                  <li key={s.slug} className={row}>
                    <Link href={s.href} className="flex min-w-0 items-center gap-3">
                      <StoreMark initials={s.initials} color={s.color as BrandColor} slug={s.slug} size={48} />
                      <span className="flex min-w-0 flex-col"><b className="text-body-strong">{s.name}</b><span className="truncate text-caption text-ink-muted">{s.description}</span></span>
                    </Link>
                    <button type="button" onClick={() => toggleStore(s.slug)} aria-label={`Quitar ${s.name} de favoritos`} className="nm-btn nm-btn--ghost nm-btn--sm">Quitar</button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="pb-2 text-body-strong font-bold">Productos ({info.products.length})</h3>
              <ul>
                {info.products.map((p) => (
                  <li key={`${p.store}/${p.id}`} className={row}>
                    <Link href={p.href} className="flex min-w-0 flex-col">
                      <b className="text-body-strong">{p.name}</b>
                      <span className="text-caption text-ink-muted">{p.storeName} · {formatMoney(p.priceCents, money.currency, money.rate)}{p.soldOut ? " · Agotado" : ""}</span>
                    </Link>
                    <button type="button" onClick={() => toggleProduct({ store: p.store, id: p.id })} aria-label={`Quitar ${p.name} de favoritos`} className="nm-btn nm-btn--ghost nm-btn--sm">Quitar</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="p-demo" className={section}>
        <h2 id="p-demo" className="font-display text-title-lg">Demo</h2>
        <Link href="/tienda-admin" className="flex items-center gap-3 py-2">
          <span className="flex grow flex-col"><b className="text-body-strong">Panel de tienda</b><span className="text-caption text-ink-muted">Atiende pedidos, agota productos y cambia horarios. Sin login.</span></span>
          <Icon name="chevronRight" className="size-5 text-ink-muted" />
        </Link>
        <Link href="/repartidor" className="flex items-center gap-3 py-2">
          <span className="flex grow flex-col"><b className="text-body-strong">App del repartidor</b><span className="text-caption text-ink-muted">Toma pedidos listos y entrégalos. Sin login.</span></span>
          <Icon name="chevronRight" className="size-5 text-ink-muted" />
        </Link>
        <Link href="/acerca" className="flex items-center gap-3 py-2">
          <span className="flex grow flex-col"><b className="text-body-strong">Acerca del proyecto</b><span className="text-caption text-ink-muted">Qué es Ñami y cómo probarlo en 2 minutos.</span></span>
          <Icon name="chevronRight" className="size-5 text-ink-muted" />
        </Link>
      </section>

      <section aria-labelledby="p-borrar" className={section}>
        <h2 id="p-borrar" className="font-display text-title-lg">Borrar mis datos de demo</h2>
        <p className="text-body text-ink-muted">Elimina tus pedidos del servidor y, en este navegador, el carrito, las direcciones guardadas y los favoritos. La moneda y el tema se conservan.</p>
        {done ? <p role="status" className="text-body-strong text-success">{done}</p> : confirming ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void wipe()} disabled={busy} className="nm-btn nm-btn--primary">Sí, borrar todo</button>
            <button type="button" onClick={() => setConfirming(false)} disabled={busy} className="nm-btn nm-btn--secondary">Cancelar</button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className="nm-btn nm-btn--secondary self-start">Borrar mis datos de demo</button>
        )}
      </section>
    </div>
  );
}
