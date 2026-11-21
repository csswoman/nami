import { connection } from "next/server";
import { OG_SIZE, storeOgImage } from "@/server/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Tienda en Ñami";

/** Imagen para compartir el enlace de esta tienda. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  return storeOgImage(slug);
}
