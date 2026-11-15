import { formatRating } from "@/lib/reviews";
import type { StoreReview } from "@/server/reviews";
const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);
const day = (ms: number) => new Date(ms).toLocaleDateString("es-VE", { day: "numeric", month: "short" });
/** Reseñas que los clientes dejaron a la tienda al recibir su pedido. */
export function ReviewsPanel({ reviews, count, sum }: { reviews: StoreReview[]; count: number; sum: number }) {
  if (count === 0) return <p className="rounded-lg bg-surface-tile p-6 text-center text-body text-ink-muted">Todavía no hay reseñas. Aparecen cuando un cliente califica un pedido entregado.</p>;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-body-strong font-bold">Promedio de las reseñas en Ñami: {formatRating(sum / count)} ({count})</p>
      <ul className="flex flex-col gap-3">
        {reviews.map((r, i) => (
          <li key={i} className="flex flex-col gap-1.5 rounded-lg border border-border p-4">
            <div className="flex items-center gap-2">
              <span aria-label={`${r.rating} de 5 estrellas`} className="text-title-md text-ink">{stars(r.rating)}</span>
              <span className="grow" />
              <span className="text-caption text-ink-muted">{day(r.createdAt)}</span>
            </div>
            {r.tags.length ? <p className="text-caption text-ink-muted">{r.tags.join(" · ")}</p> : null}
            {r.comment ? <p className="text-body">{r.comment}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
