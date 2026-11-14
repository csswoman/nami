import type { Metadata } from "next";
import Script from "next/script";
import { CartProvider } from "@/components/cart/CartProvider";
import { figtree, nunito } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ñami",
  description: "Comida, mercado, farmacia y tiendas en un solo lugar.",
  icons: { icon: "/brand/app-icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-VE" data-theme="light" suppressHydrationWarning className={`${nunito.variable} ${figtree.variable}`}>
      <body>
        {/* Aplica el tema guardado antes de hidratar. Sin elección previa, claro (no sigue al sistema). */}
        <Script id="nami-theme" strategy="beforeInteractive">
          {`try{var t=localStorage.getItem("nami-theme");document.documentElement.dataset.theme=t==="dark"?"dark":"light"}catch(e){}`}
        </Script>
        <CartProvider />
        {children}
      </body>
    </html>
  );
}
