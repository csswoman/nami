import type { BrandColor } from "@/lib/demo/home";

export type StoreMarkProps = {
  initials: string;
  color: BrandColor;
  size?: number;
  dim?: boolean;
  logo?: string | null;
  slug?: string;
  className?: string;
};

/** Logo o cuadro con iniciales de la tienda. */
export function StoreMark({ initials, color, size = 52, dim, logo, slug, className }: StoreMarkProps) {
  const logoSrc = logo ?? (slug ? `/brand/stores/${slug}.jpg` : undefined);
  if (logoSrc) {
    return (
      <span
        className={`relative inline-block shrink-0 overflow-hidden rounded-md border border-border bg-surface-raised ${dim ? "opacity-55" : ""} ${className ?? ""}`}
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} alt="" className="size-full object-cover" />
      </span>
    );
  }
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-md font-display font-black text-on-primary ${className ?? ""}`}
      style={{ width: size, height: size, background: `var(--${color})`, opacity: dim ? 0.55 : undefined, fontSize: size * 0.3 }}
    >
      {initials}
    </span>
  );
}
