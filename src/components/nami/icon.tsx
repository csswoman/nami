import { cx } from "./cx";

type IconDef = string[] | { d: string[]; r?: number };

const PATHS = {
  home: ["M3 10.5 12 3l9 7.5", "M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"],
  basket: ["M3 10h18l-1.6 9.1a2 2 0 0 1-2 1.9H6.6a2 2 0 0 1-2-1.9L3 10Z", "M8 10l4-6 4 6", "M9 14v3", "M15 14v3"],
  percent: ["M19 5 5 19", "M6.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z", "M17.5 20a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"],
  receipt: ["M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2V3Z", "M9 8h6", "M9 12h6"],
  user: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M4 21a8 8 0 0 1 16 0"],
  bell: ["M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8", "M10 20a2 2 0 0 0 4 0"],
  cart: ["M3 4h2.5l2.2 11h10.6L20.5 7H7", "M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z", "M18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"],
  search: ["M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z", "m20 20-4-4"],
  chevronDown: ["m6 9 6 6 6-6"],
  chevronRight: ["m9 6 6 6-6 6"],
  chevronLeft: ["m15 18-6-6 6-6"],
  arrowRight: ["M5 12h14", "m12 5 7-7-7-7"],
  clock: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M12 7v5l3 2"],
  moto: ["M5 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z", "M19 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z", "M8 15h6l3-6h-3", "M5 12l3-3h4"],
  star: ["M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z"],
  utensils: ["M7 3v8", "M4.5 3v5a2.5 2.5 0 0 0 5 0V3", "M7 11v10", "M17 21V3c-2.2 1.4-3.5 4-3.5 7v3H17"],
  pill: ["m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z", "m8.5 8.5 7 7"],
  bag: ["M5 8h14l-1 13H6L5 8Z", "M9 8V6a3 3 0 0 1 6 0v2"],
  repeat: ["M4 12a8 8 0 1 0 2.3-5.6", "M4 4v3.5h3.5"],
  plus: ["M12 5v14", "M5 12h14"],
  pin: ["M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z", "M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"],
  starOutline: ["M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z"],
  close: ["M18 6L6 18", "M6 6l12 12"],
  trash: ["M3 6h18", "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6", "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"],
} satisfies Record<string, IconDef>;

const FOOD_PATHS = {
  arepa: { d: ["M16.25 4.64A8.5 8.5 0 1 0 19.7 8.4A2 2 0 0 1 17.6 6.9A2 2 0 0 1 16.25 4.64Z", "M6.5 13l4.5-5", "M8.5 16.5l6-6.5", "M12.5 18l4-4.5"] },
  cachapa: { r: -30, d: ["M3 14.5a9 8.5 0 0 1 18 0c-3 1.3-6 1.8-9 1.8s-6-.5-9-1.8Z", "M7 11h.01", "M10.5 9h.01", "M14 9.5h.01", "M17 11.8h.01", "M8.8 13.3h.01", "M12.5 12.4h.01", "M15.8 13.6h.01"] },
  tequeno: ["M6 9h12a3 3 0 0 1 0 6H6a3 3 0 0 1 0-6Z", "M8 9l2 6", "M12 9l2 6", "M16 9l2 6"],
  empanada: ["M3 16a9 8 0 0 1 18 0Z", "M5.8 11.2l1.3 1", "M8.6 8.9l.7 1.4", "M12 8v1.6", "M15.4 8.9l-.7 1.4", "M18.2 11.2l-1.3 1"],
  hallaca: ["M4 6.5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z", "M12 6.5v11", "M3 12h18", "M12 12c-1-2-3-2.5-3.5-1s2 1 3.5 1Zm0 0c1-2 3-2.5 3.5-1s-2 1-3.5 1Z"],
  pabellon: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M12 3v9", "M12 12l7.8 4.5", "M12 12l-7.8 4.5", "M7.5 9.5h.01", "M9 7h.01", "M6.8 12.5h.01", "M14.5 7.5c1.8.6 2.8 2 3 3.8", "M9 17.5h6"],
  "perro-caliente": { r: -30, d: ["M6 9h12a3 3 0 0 1 0 6H6a3 3 0 0 1 0-6Z", "M6.5 9a3.5 3.5 0 0 1 3.5-3h4a3.5 3.5 0 0 1 3.5 3", "M6.5 15a3.5 3.5 0 0 0 3.5 3h4a3.5 3.5 0 0 0 3.5-3", "M7.5 12c.75-.9 1.5-.9 2.25 0s1.5.9 2.25 0 1.5-.9 2.25 0 1.5.9 2.25 0"] },
  hamburguesa: ["M4 10c0-3.3 3.6-6 8-6s8 2.7 8 6Z", "M9 7h.01", "M12 6h.01", "M15 7h.01", "M3 13c1.5-1 3 1 4.5 0s3 1 4.5 0 3 1 4.5 0 3 1 4.5 0", "M4 16h16", "M4 16v1.5A2.5 2.5 0 0 0 6.5 20h11a2.5 2.5 0 0 0 2.5-2.5V16"],
  pepito: { r: -20, d: ["M3 11c0-2.5 2-4 4.5-4h9c2.5 0 4.5 1.5 4.5 4Z", "M3.5 14c1.4-1 2.8 1 4.2 0s2.8 1 4.3 0 2.8 1 4.2 0 2.8 1 4.3 0", "M3.5 16.5h17a2.5 2.5 0 0 1-2.5 2.5H6a2.5 2.5 0 0 1-2.5-2.5Z"] },
  catalina: ["M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17Z", "M7.5 9l2.5 1.5-1 2.5", "M14 7.5l1 2 2.5.5", "M11 16l2-1 1.5 2", "M12.5 12h.01"],
  golfeado: ["M10.75 12a1.25 1.25 0 0 1 2.5 0a2.5 2.5 0 0 1-5 0a3.75 3.75 0 0 1 7.5 0a5 5 0 0 1-10 0a6.25 6.25 0 0 1 12.5 0"],
  "pan-de-jamon": ["M6 7h11a4 5 0 0 1 0 10H6", "M6 7a3 5 0 1 0 0 10 3 5 0 1 0 0-10Z", "M6 10a1.4 2 0 1 0 0 4 1.4 2 0 1 0 0-4Z", "M11 8l1 2", "M15 8l1 2", "M13 14l1 2"],
  chicha: ["M6 7h12l-1.5 13.1a1 1 0 0 1-1 .9h-7a1 1 0 0 1-1-.9L6 7Z", "M6.4 10.5h11.2", "M13 7l2-5h2", "M9 8.8h.01", "M11.5 8.8h.01", "M15.5 8.8h.01"],
  malta: ["M10 2h4v4l2 3v11a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V9l2-3V2Z", "M8 12h8", "M8 17h8"],
  cafe: ["M4 10h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-5Z", "M17 11h1.5a2.5 2.5 0 0 1 0 5H17", "M8 3c-.8 1 .8 2 0 3", "M12 3c-.8 1 .8 2 0 3"],
  papelon: { d: ["M4 8h11l-1.3 12.1a1 1 0 0 1-1 .9H6.3a1 1 0 0 1-1-.9L4 8Z", "M13.5 8a3.75 3.75 0 0 0 7.5 0Z", "M17.25 8v3.5", "M4.5 12.5h10"] },
  platano: ["M4 14c4 4.5 12 4 16-4", "M4 14c3.5 1.5 9.5.5 13-5", "M17 9l1-2.5 2 3.5", "M4 14l-1 1"],
  cuatro: { r: 35, d: ["M9.48 12.77A3.2 3.2 0 1 1 14.52 12.77 4.5 4.5 0 1 1 9.48 12.77Z", "M12 7.6V2.5", "M10.8 2.5h2.4", "M12 16.8a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6Z", "M10.5 19.2h3"] },
} satisfies Record<string, IconDef>;

const ALL: Record<string, IconDef> = { ...PATHS, ...FOOD_PATHS };

export type UiIconName = keyof typeof PATHS;
export type FoodIconName = keyof typeof FOOD_PATHS;
export type IconName = UiIconName | FoodIconName;

export const uiIcons = Object.keys(PATHS) as UiIconName[];
export const foodIcons = Object.keys(FOOD_PATHS) as FoodIconName[];

type IconProps = {
  name: IconName;
  /** Si lo pasas, el icono es informativo (role="img"); si no, decorativo. */
  label?: string;
  className?: string;
};

export function Icon({ name, label, className }: IconProps) {
  const def = ALL[name] ?? PATHS.plus;
  const d = Array.isArray(def) ? def : def.d;
  const rotate = Array.isArray(def) ? undefined : def.r;
  const paths = d.map((p, i) => <path key={i} d={p} />);
  return (
    <svg
      className={cx("nm-icon", className)}
      viewBox="0 0 24 24"
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      {rotate ? <g transform={`rotate(${rotate} 12 12)`}>{paths}</g> : paths}
    </svg>
  );
}
