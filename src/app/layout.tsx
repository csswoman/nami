import type { Metadata } from "next";
import { figtree, nunito } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ñami",
  description: "Comida, mercado, farmacia y tiendas en un solo lugar.",
  icons: { icon: "/brand/app-icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-VE" className={`${nunito.variable} ${figtree.variable}`}>
      <body>{children}</body>
    </html>
  );
}
