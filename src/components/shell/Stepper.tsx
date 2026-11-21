/** Control de cantidad − n +. Presentacional: conecta `onMinus`/`onPlus` cuando haya lógica de carrito. */
export function Stepper({ qty, name, onMinus, onPlus, max }: { qty: number; name: string; onMinus?: () => void; onPlus?: () => void; /** Tope de unidades (stock): al llegar, "+" se desactiva. */ max?: number }) {
  const btn = "grid size-8 place-items-center rounded-pill bg-surface text-body-strong font-bold border border-border/70 hover:border-ink/30 active:scale-95 transition-all disabled:opacity-40 disabled:active:scale-100";
  const maxed = max != null && qty >= max;
  return (
    <div className="flex items-center gap-1 rounded-pill border border-border/70 bg-surface-raised p-0.5 shadow-xs">
      <button type="button" className={btn} aria-label={`Quitar ${name}`} onClick={onMinus}>−</button>
      <span className="min-w-6 text-center text-body-strong font-bold" aria-live="polite">{qty}</span>
      <button type="button" className={btn} aria-label={maxed ? `No quedan más ${name}` : `Agregar ${name}`} onClick={onPlus} disabled={maxed}>+</button>
    </div>
  );
}
