"use client";
import { useRouter } from "next/navigation";
/** Selector "Estás viendo como…": cambia de tienda dentro del panel. */
export function StoreSwitcher({ current, stores, base = "/tienda-admin/" }: { current: string; stores: { slug: string; name: string }[]; base?: string }) {
  const router = useRouter();
  return (
    <label className="flex flex-col gap-1 text-caption font-bold">
      Cambiar de tienda
      <select value={current} onChange={(e) => router.push(`${base}${e.target.value}`)} className="min-h-11 rounded-md border border-border bg-surface px-3 text-body font-normal">
        {stores.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
      </select>
    </label>
  );
}
