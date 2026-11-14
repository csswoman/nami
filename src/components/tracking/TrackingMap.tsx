/* Mapa ilustrado de Chacao y Altamira. Generado a partir del diseño; los colores son de ilustración, no de UI. */
export const ROUTE_POINTS: [number, number][] = [[64, 392], [64, 318], [248, 318], [248, 206], [318, 206], [318, 150]];

type Props = { traveled: string; moto: [number, number]; className?: string };

export function TrackingMap({ traveled, moto, className }: Props) {
  return (
    <svg viewBox="0 0 390 470" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label="Mapa de Chacao y Altamira con la ruta del repartidor">

<rect width="390" height="470" fill="#F4EEE6"/>
<rect x="9" y="79" width="46" height="22" rx="8" fill="#EDE5DA"/><rect x="9" y="119" width="46" height="78" rx="8" fill="#EDE5DA"/><rect x="9" y="215" width="46" height="94" rx="8" fill="#EDE5DA"/><rect x="9" y="327" width="46" height="56" rx="8" fill="#EDE5DA"/><rect x="9" y="401" width="46" height="60" rx="8" fill="#EDE5DA"/><rect x="73" y="79" width="68" height="22" rx="8" fill="#EDE5DA"/><rect x="73" y="119" width="68" height="78" rx="8" fill="#EDE5DA"/><rect x="73" y="215" width="68" height="94" rx="8" fill="#EDE5DA"/><rect x="73" y="327" width="68" height="56" rx="8" fill="#EDE5DA"/><rect x="73" y="401" width="68" height="60" rx="8" fill="#EDE5DA"/><rect x="159" y="79" width="80" height="22" rx="8" fill="#EDE5DA"/><rect x="159" y="119" width="80" height="78" rx="8" fill="#EDE5DA"/><rect x="159" y="215" width="80" height="94" rx="8" fill="#EDE5DA"/><rect x="159" y="327" width="80" height="56" rx="8" fill="#EDE5DA"/><rect x="159" y="401" width="80" height="60" rx="8" fill="#EDE5DA"/><rect x="257" y="79" width="52" height="22" rx="8" fill="#EDE5DA"/><rect x="257" y="119" width="52" height="78" rx="8" fill="#EDE5DA"/><rect x="257" y="215" width="52" height="94" rx="8" fill="#EDE5DA"/><rect x="257" y="327" width="52" height="56" rx="8" fill="#EDE5DA"/><rect x="257" y="401" width="52" height="60" rx="8" fill="#EDE5DA"/><rect x="327" y="79" width="54" height="22" rx="8" fill="#EDE5DA"/><rect x="327" y="119" width="54" height="78" rx="8" fill="#EDE5DA"/><rect x="327" y="215" width="54" height="94" rx="8" fill="#EDE5DA"/><rect x="327" y="327" width="54" height="56" rx="8" fill="#EDE5DA"/><rect x="327" y="401" width="54" height="60" rx="8" fill="#EDE5DA"/>
<line x1="64" y1="60" x2="64" y2="470" stroke="#FFFFFF" strokeWidth="10"/><line x1="150" y1="60" x2="150" y2="470" stroke="#FFFFFF" strokeWidth="10"/><line x1="318" y1="60" x2="318" y2="470" stroke="#FFFFFF" strokeWidth="10"/><line x1="0" y1="110" x2="390" y2="110" stroke="#FFFFFF" strokeWidth="10"/><line x1="0" y1="206" x2="390" y2="206" stroke="#FFFFFF" strokeWidth="10"/><line x1="0" y1="392" x2="390" y2="392" stroke="#FFFFFF" strokeWidth="10"/>
<line x1="0" y1="318" x2="390" y2="318" stroke="#FFFFFF" strokeWidth="18"/>
<line x1="248" y1="60" x2="248" y2="470" stroke="#FFFFFF" strokeWidth="16"/>
<path d="M0 0H390V64C340 84 300 50 250 70C200 90 160 58 110 76C70 90 30 66 0 80Z" fill="#CFE3C8"/>
<path d="M0 0H390V34C350 50 300 22 240 40C190 55 140 26 90 44C50 58 20 36 0 46Z" fill="#B7D6AE"/>
<text x="24" y="30" fontFamily="Figtree, sans-serif" fontSize="12" fontWeight="700" fill="#2F5A2A" letterSpacing="1.5">EL ÁVILA</text>
<circle cx="292" cy="262" r="24" fill="#CFE3C8"/>
<text x="292" y="296" textAnchor="middle" fontFamily="Figtree, sans-serif" fontSize="10" fontWeight="600" fill="#2F5A2A">Plaza Altamira</text>
<text x="10" y="312" fontFamily="Figtree, sans-serif" fontSize="10" fontWeight="600" fill="#8A7F77">Av. Francisco de Miranda</text>
<text x="256" y="440" fontFamily="Figtree, sans-serif" fontSize="10" fontWeight="600" fill="#8A7F77">Av. Luis Roche</text>
<text x="96" y="460" fontFamily="Figtree, sans-serif" fontSize="11" fontWeight="700" fill="#8A7F77" letterSpacing="2">CHACAO</text>
<text x="330" y="100" textAnchor="middle" fontFamily="Figtree, sans-serif" fontSize="11" fontWeight="700" fill="#8A7F77" letterSpacing="2">ALTAMIRA</text>
<g><circle cx="140" cy="336" r="9" fill="#1F1A1C"/><text x="140" y="340" textAnchor="middle" fontFamily="Figtree, sans-serif" fontSize="10" fontWeight="700" fill="#FFFFFF">M</text><text x="153" y="340" fontFamily="Figtree, sans-serif" fontSize="10" fontWeight="600" fill="#1F1A1C">Chacao</text></g>
<g><circle cx="268" cy="336" r="9" fill="#1F1A1C"/><text x="268" y="340" textAnchor="middle" fontFamily="Figtree, sans-serif" fontSize="10" fontWeight="700" fill="#FFFFFF">M</text><text x="281" y="340" fontFamily="Figtree, sans-serif" fontSize="10" fontWeight="600" fill="#1F1A1C">Altamira</text></g>
<polyline points="64,392 64,318 248,318 248,206 318,206 318,150" fill="none" stroke="#E8182E" strokeOpacity="0.3" strokeWidth="6" strokeDasharray="2 10" strokeLinecap="round" strokeLinejoin="round"/>
<polyline points={traveled} fill="none" stroke="#E8182E" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
<g><rect x="44" y="392" width="40" height="40" rx="12" fill="#FFFFFF" stroke="#E8E2DC"/><rect x="49" y="397" width="30" height="30" rx="9" fill="#FF7A00"/><text x="64" y="417" textAnchor="middle" fontFamily="Nunito, sans-serif" fontSize="12" fontWeight="900" fill="#FFFFFF">DC</text></g>
<g><path d="M318 152c-9-10-15-17-15-25a15 15 0 0 1 30 0c0 8-6 15-15 25Z" fill="#E8182E"/><circle cx="318" cy="127" r="5.5" fill="#FFFFFF"/><rect x="286" y="156" width="64" height="20" rx="10" fill="#1F1A1C"/><text x="318" y="170" textAnchor="middle" fontFamily="Figtree, sans-serif" fontSize="11" fontWeight="700" fill="#FFFFFF">Tu casa</text></g>

      <image href="/brand/guacamaya-moto.png" x={moto[0] - 40} y={moto[1] - 58} width="80" height="80" style={{ filter: "drop-shadow(0 4px 5px rgba(31,26,28,0.25))" }} />
    </svg>
  );
}
