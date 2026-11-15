import { NextResponse } from "next/server";
import { z } from "zod";
import { searchCatalog } from "@/server/catalog";
import { getMoneyPrefs } from "@/server/prefs";
import { caracasMinutes, isOpenAt, hoursText, opensText } from "@/lib/catalog";
import { search as fallbackSearch } from "@/lib/demo/busqueda";

const querySchema = z.string().trim().max(100);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse(searchParams.get("q") ?? "");
  const q = parsed.success ? parsed.data : "";

  if (!q) {
    return NextResponse.json({ stores: [], products: [] });
  }

  try {
    const [{ stores, products }, money] = await Promise.all([
      searchCatalog(q, { stores: 4, products: 6 }),
      getMoneyPrefs(),
    ]);

    const minutes = caracasMinutes();

    const formattedStores = stores.map((s) => {
      const open = isOpenAt(s, minutes);
      const hours = hoursText(s);
      const statusText = open
        ? (hours.startsWith("Hasta") ? `Abierto · ${hours}` : hours)
        : `Cerrado · ${opensText(s, minutes)}`;

      return {
        slug: s.slug,
        name: s.name,
        kind: s.kind,
        category: s.category,
        description: s.description,
        initials: s.initials,
        color: s.color,
        rating: s.rating,
        time: s.time,
        isOpen: open,
        statusText,
      };
    });

    const formattedProducts = products.map((p) => ({
      id: p.id,
      name: p.name,
      priceCents: p.priceCents,
      icon: p.icon,
      image: p.image,
      soldOut: p.soldOut,
      store: {
        slug: p.store.slug,
        name: p.store.name,
        kind: p.store.kind,
      },
    }));

    return NextResponse.json(
      {
        stores: formattedStores,
        products: formattedProducts,
        currency: money.currency,
        rate: money.rate,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
        },
      }
    );
  } catch {
    // Respaldo elegante con catálogo demo si la BD no está disponible
    const demo = fallbackSearch(q);
    return NextResponse.json({
      stores: demo.stores.slice(0, 4).map((s) => ({
        slug: s.slug,
        name: s.name,
        kind: "restaurante",
        category: "comida",
        description: s.meta,
        initials: s.initials,
        color: s.color,
        rating: "4,8",
        time: "20–30 min",
        isOpen: s.open,
        statusText: s.status,
      })),
      products: demo.products.slice(0, 6).map((p) => ({
        id: p.id,
        name: p.name,
        priceCents: p.priceCents,
        icon: p.icon,
        soldOut: Boolean(p.soldOut),
        store: {
          slug: p.storeSlug,
          name: p.store,
          kind: "restaurante",
        },
      })),
      currency: "USD",
      rate: 36.6,
    });
  }
}
