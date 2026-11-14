import type { BrandColor } from "@/lib/demo/home";

/** Pedidos de ejemplo para "Mis pedidos" y el detalle. Montos en centavos de USD. */
export type PastOrder = {
  id: string;
  store: string;
  initials: string;
  color: BrandColor;
  status: "delivered" | "cancelled";
  date: string;
  totalCents: number;
};


export const PAST_ORDERS: PastOrder[] = [
  { id: "ÑM-2031", store: "Perros El Gocho", initials: "EG", color: "ink", status: "delivered", date: "Ayer, 10:42 p. m.", totalCents: 640 },
  { id: "ÑM-2019", store: "Abasto El Samán", initials: "AS", color: "leaf", status: "delivered", date: "24 sep.", totalCents: 1875 },
  { id: "ÑM-2007", store: "Pollos en Brasa El Rey", initials: "ER", color: "brand-orange", status: "cancelled", date: "20 sep.", totalCents: 1130 },
  { id: "ÑM-1992", store: "Farmacia San Onofre", initials: "FS", color: "plus", status: "delivered", date: "15 sep.", totalCents: 720 },
];

/** Detalle de un pedido entregado (el mismo del seguimiento). */
export const ORDER_DETAIL = {
  id: "ÑM-2048",
  store: "Arepera Doña Chela",
  initials: "DC",
  color: "brand-orange" as BrandColor,
  date: "28 sep. · 7:52 a. m.",
  prepMin: 11,
  rideMin: 11,
  km: "2,4 km",
  route: "Chacao → Altamira",
  steps: [
    ["Recibido", "7:52 a. m."],
    ["Preparando", "7:54 a. m."],
    ["Buscando motorizado", "8:03 a. m."],
    ["En camino", "8:06 a. m."],
    ["Llegó", "8:17 a. m."],
  ] as const,
  courier: "Te lo llevó Carlos Mendoza · Moto negra · AB2C34D",
  lines: [
    { id: "reina", qty: 2, name: "Arepa reina pepiada", unitCents: 350, note: "Masa blanca · Asada en budare" },
    { id: "guayoyo", qty: 1, name: "Guayoyo", unitCents: 100, note: undefined as string | undefined },
  ],
  shippingCents: 120,
  tipCents: 100,
  payment: "Pago móvil · Banco del Ávila",
  paymentRef: "Ref. 004821 · Verificado a las 7:52 a. m.",
  address: "Av. Luis Roche, Edif. Los Samanes, apto. 4B, Altamira",
  reference: "Frente a la panadería La Reina",
};
