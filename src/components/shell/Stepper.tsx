/** Control de cantidad − n +. Presentacional: conecta `onMinus`/`onPlus` cuando haya lógica de carrito. */
export function Stepper({ qty, name, onMinus, onPlus }: { qty: number; name: string; onMinus?: () => void; onPlus?: () => void }) {
  const btn = "grid size-8 place-items-center rounded-pill bg-surface-raised text-body-strong font-bold";
  return (
    <div className="flex items-center gap-0.5 rounded-pill bg-surface-tile p-0.75">
      <button type="button" className={btn} aria-label={`Quitar ${name}`} onClick={onMinus}>−</button>
      <span className="min-w-6 text-center text-body-strong font-bold" aria-live="polite">{qty}</span>
      <button type="button" className={btn} aria-label={`Agregar ${name}`} onClick={onPlus}>+</button>
    </div>
  );
}
