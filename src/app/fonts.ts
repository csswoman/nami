import { Figtree, Nunito } from "next/font/google";

// Nunito: solo títulos, banners y el nombre "Ñami". Figtree: todo lo demás.
export const nunito = Nunito({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
});

export const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-figtree",
  display: "swap",
});
