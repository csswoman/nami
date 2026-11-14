import type { BrandColor } from "@/lib/demo/home";

/** Cuadro con las iniciales de una tienda (mientras no hay logos reales). */
export function StoreMark({ initials, color, size = 52, dim }: { initials: string; color: BrandColor; size?: number; dim?: boolean }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-md font-display font-black text-on-primary"
      style={{ width: size, height: size, background: `var(--${color})`, opacity: dim ? 0.55 : undefined, fontSize: size * 0.3 }}
    >
      {initials}
    </span>
  );
}
