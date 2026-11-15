/** Mapa ilustrado del recorrido de un pedido entregado (solo escritorio en el detalle). Usa los tokens map-*, como TrackingMap. */
export function RouteMiniMap({ className }: { className?: string }) {
  const top = [0, 1, 2, 3, 4];
  return (
    <svg className={className} viewBox="0 0 900 490" role="img" aria-label="Recorrido del pedido hasta tu casa" preserveAspectRatio="xMidYMid slice">
      <rect width="900" height="490" className="fill-map-ground" />
      {top.map((i) => (
        <rect key={`a${i}`} x={20 + i * 178} y="0" width={i === 3 ? 100 : 140} height="140" rx="22" className="fill-map-block" />
      ))}
      {top.map((i) => (
        <rect key={`b${i}`} x={20 + i * 178} y="180" width={i === 3 ? 100 : 140} height="260" rx="22" className="fill-map-block" />
      ))}
      <circle cx="590" cy="270" r="54" className="fill-map-park" />
      <text x="590" y="360" textAnchor="middle" fontFamily="Nunito, sans-serif" fontSize="26" fontWeight="800" className="fill-map-park-label">Plaza Altamira</text>
      <text x="40" y="415" fontFamily="Figtree, sans-serif" fontSize="26" fontWeight="700" className="fill-map-label">Av. Francisco de Miranda</text>
      <path d="M130 470H475V180H690V0" fill="none" className="stroke-primary" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="640" y="26" width="140" height="44" rx="22" className="fill-ink" />
      <text x="710" y="57" textAnchor="middle" fontFamily="Figtree, sans-serif" fontSize="24" fontWeight="700" className="fill-surface">Tu casa</text>
    </svg>
  );
}
