/** Opciones de personalización de un producto (demo). Montos en centavos de USD. */
export type OptionGroup = {
  id: string;
  title: string;
  hint: string;
  kind: "one" | "many";
  required: boolean;
  max?: number;
  options: { id: string; label: string; priceCents: number }[];
  defaults: string[];
};

const AREPA_GROUPS: OptionGroup[] = [
  { id: "masa", title: "Masa", hint: "Elige 1", kind: "one", required: true, defaults: ["blanca"], options: [
    { id: "blanca", label: "Blanca", priceCents: 0 },
    { id: "amarilla", label: "Amarilla", priceCents: 0 },
    { id: "integral", label: "Integral", priceCents: 30 },
  ] },
  { id: "coccion", title: "¿Cómo la quieres?", hint: "Elige 1", kind: "one", required: true, defaults: ["budare"], options: [
    { id: "budare", label: "Asada en budare", priceCents: 0 },
    { id: "frita", label: "Frita", priceCents: 20 },
  ] },
  { id: "extras", title: "Extras", hint: "Hasta 3", kind: "many", required: false, max: 3, defaults: ["aguacate"], options: [
    { id: "amarillo", label: "Queso amarillo rallado", priceCents: 50 },
    { id: "aguacate", label: "Aguacate extra", priceCents: 70 },
    { id: "tocineta", label: "Tocineta", priceCents: 90 },
    { id: "mano", label: "Queso de mano", priceCents: 100 },
  ] },
];

const DRINK_GROUPS: OptionGroup[] = [
  { id: "tamano", title: "Tamaño", hint: "Elige 1", kind: "one", required: true, defaults: ["normal"], options: [
    { id: "normal", label: "Normal", priceCents: 0 },
    { id: "grande", label: "Grande", priceCents: 50 },
  ] },
];

/** Grupos según la sección del menú; el resto de productos solo lleva nota. */
export function optionGroupsFor(sectionId: string): OptionGroup[] {
  if (sectionId === "arepas") return AREPA_GROUPS;
  if (sectionId === "bebidas") return DRINK_GROUPS;
  return [];
}
