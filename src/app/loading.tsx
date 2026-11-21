/* eslint-disable @next/next/no-img-element */
import { AppShell } from "@/components/shell/AppShell";

const block = "animate-pulse rounded-xl bg-surface-tile";

/** Skeleton de carga general: bloques con la forma del inicio y el aviso de la guacamaya. */
export default function Loading() {
  return (
    <AppShell address="Cargando dirección…">
      <div className="page-x relative flex flex-col gap-6 pt-4 desktop:gap-12 desktop:pt-7" aria-busy="true" aria-live="polite">
        <div className="grid gap-6 desktop:grid-cols-[2fr_1fr]">
          <div className={`${block} h-42 desktop:h-70`} />
          <div className={`${block} hidden desktop:block`} />
        </div>
        <div className="grid grid-cols-2 gap-3 desktop:grid-cols-6 desktop:gap-4">
          {Array.from({ length: 6 }, (_, i) => <div key={i} className={`${block} h-44 desktop:h-26 ${i > 1 ? "max-desktop:hidden" : ""}`} />)}
        </div>
        <div className="grid gap-4 desktop:grid-cols-3 desktop:gap-6">
          <div className={`${block} h-48 desktop:h-100`} />
          <div className={`${block} hidden h-100 desktop:block`} />
          <div className={`${block} hidden h-100 desktop:block`} />
        </div>
        <div role="status" className="sticky bottom-28 z-10 mx-auto flex w-full max-w-md items-center gap-3 rounded-pill bg-ink py-1.5 pr-6 pl-4 text-body-strong font-bold text-surface desktop:bottom-8">
          <img src="/brand/guacamaya-moto.png" alt="" className="h-12 w-auto" />
          Buscando lo que está abierto en Caracas...
        </div>
      </div>
    </AppShell>
  );
}
