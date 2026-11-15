/* Mapa ilustrado de Chacao y Altamira. Colores con los tokens map-* para que siga el tema claro/oscuro. */
export const ROUTE_POINTS: [number, number][] = [[64, 392], [64, 318], [248, 318], [248, 206], [318, 206], [318, 150]];

/** Dónde recoge cada tienda del pedido: puntos sobre la misma ruta, en el orden de la parada. */
export const STORE_SPOTS: [number, number][] = [[64, 392], [150, 318], [248, 206]];

type StoreMark = { initials: string; color: string };
/** Un motorizado: su ruta completa, lo recorrido y dónde está ahora. */
export type Rider = { route: string; traveled: string; moto: [number, number] };
type Props = { riders: Rider[]; className?: string; stores?: StoreMark[] };

export function TrackingMap({ riders, className, stores = [{ initials: "DC", color: "brand-orange" }] }: Props) {
  return (
    <svg viewBox="0 0 390 470" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label="Mapa de Chacao y Altamira con la ruta del repartidor">

<rect width="390" height="470" className="fill-map-ground"/>
<rect x="9" y="79" width="46" height="22" rx="8" className="fill-map-block"/><rect x="9" y="119" width="46" height="78" rx="8" className="fill-map-block"/><rect x="9" y="215" width="46" height="94" rx="8" className="fill-map-block"/><rect x="9" y="327" width="46" height="56" rx="8" className="fill-map-block"/><rect x="9" y="401" width="46" height="60" rx="8" className="fill-map-block"/><rect x="73" y="79" width="68" height="22" rx="8" className="fill-map-block"/><rect x="73" y="119" width="68" height="78" rx="8" className="fill-map-block"/><rect x="73" y="215" width="68" height="94" rx="8" className="fill-map-block"/><rect x="73" y="327" width="68" height="56" rx="8" className="fill-map-block"/><rect x="73" y="401" width="68" height="60" rx="8" className="fill-map-block"/><rect x="159" y="79" width="80" height="22" rx="8" className="fill-map-block"/><rect x="159" y="119" width="80" height="78" rx="8" className="fill-map-block"/><rect x="159" y="215" width="80" height="94" rx="8" className="fill-map-block"/><rect x="159" y="327" width="80" height="56" rx="8" className="fill-map-block"/><rect x="159" y="401" width="80" height="60" rx="8" className="fill-map-block"/><rect x="257" y="79" width="52" height="22" rx="8" className="fill-map-block"/><rect x="257" y="119" width="52" height="78" rx="8" className="fill-map-block"/><rect x="257" y="215" width="52" height="94" rx="8" className="fill-map-block"/><rect x="257" y="327" width="52" height="56" rx="8" className="fill-map-block"/><rect x="257" y="401" width="52" height="60" rx="8" className="fill-map-block"/><rect x="327" y="79" width="54" height="22" rx="8" className="fill-map-block"/><rect x="327" y="119" width="54" height="78" rx="8" className="fill-map-block"/><rect x="327" y="215" width="54" height="94" rx="8" className="fill-map-block"/><rect x="327" y="327" width="54" height="56" rx="8" className="fill-map-block"/><rect x="327" y="401" width="54" height="60" rx="8" className="fill-map-block"/>
<line x1="64" y1="60" x2="64" y2="470" className="stroke-map-road" strokeWidth="10"/><line x1="150" y1="60" x2="150" y2="470" className="stroke-map-road" strokeWidth="10"/><line x1="318" y1="60" x2="318" y2="470" className="stroke-map-road" strokeWidth="10"/><line x1="0" y1="110" x2="390" y2="110" className="stroke-map-road" strokeWidth="10"/><line x1="0" y1="206" x2="390" y2="206" className="stroke-map-road" strokeWidth="10"/><line x1="0" y1="392" x2="390" y2="392" className="stroke-map-road" strokeWidth="10"/>
<line x1="0" y1="318" x2="390" y2="318" className="stroke-map-road" strokeWidth="18"/>
<line x1="248" y1="60" x2="248" y2="470" className="stroke-map-road" strokeWidth="16"/>
<path d="M0 0H390V64C340 84 300 50 250 70C200 90 160 58 110 76C70 90 30 66 0 80Z" className="fill-map-park"/>
<path d="M0 0H390V34C350 50 300 22 240 40C190 55 140 26 90 44C50 58 20 36 0 46Z" className="fill-map-park-deep"/>
<text x="24" y="30" fontFamily="Figtree, sans-serif" fontSize="12" fontWeight="700" className="fill-map-park-label" letterSpacing="1.5">EL ÁVILA</text>
<circle cx="292" cy="262" r="24" className="fill-map-park"/>
<text x="292" y="296" textAnchor="middle" fontFamily="Figtree, sans-serif" fontSize="10" fontWeight="600" className="fill-map-park-label">Plaza Altamira</text>
<text x="10" y="312" fontFamily="Figtree, sans-serif" fontSize="10" fontWeight="600" className="fill-map-label">Av. Francisco de Miranda</text>
<text x="256" y="440" fontFamily="Figtree, sans-serif" fontSize="10" fontWeight="600" className="fill-map-label">Av. Luis Roche</text>
<text x="96" y="460" fontFamily="Figtree, sans-serif" fontSize="11" fontWeight="700" className="fill-map-label" letterSpacing="2">CHACAO</text>
<text x="330" y="100" textAnchor="middle" fontFamily="Figtree, sans-serif" fontSize="11" fontWeight="700" className="fill-map-label" letterSpacing="2">ALTAMIRA</text>
<g><circle cx="140" cy="336" r="9" className="fill-ink"/><text x="140" y="340" textAnchor="middle" fontFamily="Figtree, sans-serif" fontSize="10" fontWeight="700" className="fill-surface">M</text><text x="153" y="340" fontFamily="Figtree, sans-serif" fontSize="10" fontWeight="600" className="fill-ink">Chacao</text></g>
<g><circle cx="268" cy="336" r="9" className="fill-ink"/><text x="268" y="340" textAnchor="middle" fontFamily="Figtree, sans-serif" fontSize="10" fontWeight="700" className="fill-surface">M</text><text x="281" y="340" fontFamily="Figtree, sans-serif" fontSize="10" fontWeight="600" className="fill-ink">Altamira</text></g>
{riders.map((r, i) => (
  <g key={i}>
    <polyline points={r.route} fill="none" className="stroke-primary" strokeOpacity="0.3" strokeWidth="6" strokeDasharray="2 10" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points={r.traveled} fill="none" className="stroke-primary" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
  </g>
))}
{stores.map((st, i) => {
  const [x, y] = STORE_SPOTS[Math.min(i, STORE_SPOTS.length - 1)];
  return <g key={i}><rect x={x - 20} y={i === 0 ? y : y - 20} width="40" height="40" rx="12" className="fill-surface-raised stroke-border"/><rect x={x - 15} y={i === 0 ? y + 5 : y - 15} width="30" height="30" rx="9" style={{ fill: `var(--${st.color})` }}/><text x={x} y={i === 0 ? y + 25 : y + 5} textAnchor="middle" fontFamily="Nunito, sans-serif" fontSize="12" fontWeight="900" className="fill-on-primary">{st.initials}</text></g>;
})}
<g><path d="M318 152c-9-10-15-17-15-25a15 15 0 0 1 30 0c0 8-6 15-15 25Z" className="fill-primary"/><circle cx="318" cy="127" r="5.5" className="fill-on-primary"/><rect x="286" y="156" width="64" height="20" rx="10" className="fill-ink"/><text x="318" y="170" textAnchor="middle" fontFamily="Figtree, sans-serif" fontSize="11" fontWeight="700" className="fill-surface">Tu casa</text></g>

{riders.map((r, i) => (
        <image key={i} href="/brand/guacamaya-moto.png" x={-40} y={-58} width="80" height="80" style={{ transform: `translate(${r.moto[0] + (i ? 14 : 0)}px, ${r.moto[1]}px)`, transition: "transform 250ms linear", filter: "drop-shadow(0 4px 5px rgba(31,26,28,0.25))" }} />
      ))}
    </svg>
  );
}
