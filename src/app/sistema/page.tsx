import {
  AppHeader, Badge, BottomNav, Button, CategoryTile, CuisineChip, OrderCard, ProductCard,
  PromoBanner, RestaurantCard, SectionHeader, StoreLogo, Tabs, TopBar, foodIcons, uiIcons, Icon,
} from "@/components/nami";

export const metadata = { title: "Sistema de diseño · Ñami" };

export default function SistemaPage() {
  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-10 pb-24 text-ink">
      <div className="desktop:hidden"><AppHeader address="Av. Francisco de Miranda, Caracas" placeholder="Arepas, perros, harina de maíz…" unread /></div>
      <div className="hidden desktop:block"><TopBar address="Av. Francisco de Miranda, Caracas" /></div>

      <div className="flex flex-col gap-10 px-4 desktop:px-8">
        <PromoBanner eyebrow="Hasta las 11:00 a. m." title="Desayunos criollos con envío gratis" image="/brand/guacamaya-moto.png" slides={3} />

        <section className="flex flex-col gap-4">
          <SectionHeader title="Botones y badges" />
          <div className="flex flex-wrap items-center gap-3">
            <Button>Pedir ahora</Button>
            <Button variant="secondary" icon="repeat">Repetir</Button>
            <Button variant="ghost">Cancelar</Button>
            <Button size="sm">Agregar</Button>
            <Badge>3x2</Badge>
            <Badge tone="plus" />
            <Badge tone="success">Entregado</Badge>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeader title="Verticales" action="Ver todo" />
          <div className="flex flex-wrap gap-3">
            <CategoryTile title="Restaurantes" icon="utensils" />
            <CategoryTile title="Súper" icon="basket" tone="green" />
            <CategoryTile title="Farmacias" icon="pill" tone="blue" />
            <CategoryTile title="Tiendas" icon="bag" tone="dark" />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeader title="¿Qué se te antoja?" />
          <div className="flex flex-wrap gap-3">
            {(["arepa", "empanada", "tequeno", "cafe", "cachapa"] as const).map((n, i) => (
              <CuisineChip key={n} icon={n} label={n} selected={i === 0} />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeader title="Mercados de confianza" action="Ver todo" />
          <div className="flex flex-wrap gap-3">
            <StoreLogo name="Ñami Market" logo="/brand/stores/nami-market.jpg" initials="Ñ" color="var(--color-primary)" featured />
            <StoreLogo name="Abasto El Samán" logo="/brand/stores/abasto-el-saman.jpg" initials="AS" color="var(--color-leaf)" />
            <StoreLogo name="Bodegón La Candelaria" logo="/brand/stores/bodegon-la-candelaria.jpg" initials="BC" color="var(--color-ink)" />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeader title="Promociones del día" />
          <Tabs items={[{ label: "Ñami Market", logo: "/brand/stores/nami-market.jpg", initials: "Ñ" }, { label: "Abasto El Samán", logo: "/brand/stores/abasto-el-saman.jpg", initials: "AS" }]} />
          <div className="grid grid-cols-2 gap-4 desktop:grid-cols-5">
            <ProductCard name="Harina de maíz precocida 1 kg" price="$ 1,15" oldPrice="$ 1,35" unit="1 kg · Bs. 42,09" badges={<Badge>DSCTO</Badge>} />
            <ProductCard name="Queso blanco llanero 500 g" price="$ 3,90" unit="500 g · Bs. 142,74" />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeader title="Restaurantes y pedidos" />
          <div className="grid gap-4 desktop:grid-cols-3">
            <RestaurantCard name="Arepera Doña Chela" initials="DC" rating="4,8" time="20–30 min" fee="$ 1,20" plusFree />
            <RestaurantCard name="Empanadas El Puerto" initials="EP" rating="4,6" time="15–25 min" fee="$ 0,90" />
            <OrderCard store="Ñami Market" date="12 nov" total="$ 14,60" initials="Ñ" items={["1", "2", "3"]} />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeader title="Iconos" />
          <div className="flex flex-wrap gap-4 text-ink">
            {[...uiIcons, ...foodIcons].map((n) => (
              <span key={n} className="flex w-20 flex-col items-center gap-1 text-caption text-ink-muted">
                <Icon name={n} />{n}
              </span>
            ))}
          </div>
        </section>
      </div>

      <div className="desktop:hidden"><BottomNav /></div>
    </main>
  );
}
