/** Íconos sueltos que el sistema aún no trae (mismo trazo que `.nm-icon`). */
const wrap = (d: string[]) =>
  function Glyph({ className = "" }: { className?: string }) {
    return (
      <svg className={`nm-icon ${className}`} viewBox="0 0 24 24" aria-hidden="true">
        {d.map((p) => <path key={p} d={p} />)}
      </svg>
    );
  };

export const CheckIcon = wrap(["m5 12.5 4.5 4.5L19 7.5"]);
export const CopyIcon = wrap(["M9 9h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1Z", "M16 9V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"]);
export const CloseIcon = wrap(["M6 6l12 12", "M18 6 6 18"]);
