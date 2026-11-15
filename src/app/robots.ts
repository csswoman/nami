import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl().origin;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/carrito",
        "/checkout",
        "/pago",
        "/seguimiento",
        "/entregado",
        "/pedidos/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
