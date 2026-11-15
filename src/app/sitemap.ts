import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";
import { getStores } from "@/server/catalog";

const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "daily", priority: 1.0 },
  { path: "/listado", changeFrequency: "daily", priority: 0.9 },
  { path: "/ofertas", changeFrequency: "daily", priority: 0.9 },
  { path: "/busqueda", changeFrequency: "weekly", priority: 0.7 },
  { path: "/acerca", changeFrequency: "monthly", priority: 0.8 },
  { path: "/bienvenida", changeFrequency: "monthly", priority: 0.6 },
  { path: "/sistema", changeFrequency: "monthly", priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const all = await getStores();
  const baseUrl = getSiteUrl().origin;
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const storeEntries: MetadataRoute.Sitemap = all.filter((s) => s.kind === "restaurante").map((s) => ({
    url: `${baseUrl}/tienda/${s.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const marketEntries: MetadataRoute.Sitemap = all.filter((s) => s.kind === "mercado").map((s) => ({
    url: `${baseUrl}/mercado/${s.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticEntries, ...storeEntries, ...marketEntries];
}
