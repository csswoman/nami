/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";
import { cx } from "./cx";
import { Badge, Button } from "./controls";
import { Icon, type IconName } from "./icon";

export function PromoBanner({ title, eyebrow, badge, image, slides, current = 0, className }: {
  title: string; eyebrow?: string; badge?: ReactNode; image?: string; slides?: number; current?: number; className?: string;
}) {
  return (
    <section className={cx("nm-banner", className)}>
      <div className="nm-banner__copy">
        {badge}
        {eyebrow ? <span className="nm-banner__eyebrow">{eyebrow}</span> : null}
        <h2 className="nm-banner__title">{title}</h2>
        <i className="nm-banner__underline" />
      </div>
      {image ? <img className="nm-banner__art" src={image} alt="" /> : null}
      {slides ? (
        <div className="nm-banner__dots" aria-hidden="true">
          {Array.from({ length: slides }, (_, i) => <i key={i} className={i === current ? "on" : ""} />)}
        </div>
      ) : null}
    </section>
  );
}

export function CategoryTile({ title, size = "sm", tone = "red", icon = "utensils", image, badge, onClick, className }: {
  title: string; size?: "sm" | "lg"; tone?: "red" | "green" | "blue" | "dark" | (string & {}); icon?: IconName; image?: string; badge?: ReactNode; onClick?: () => void; className?: string;
}) {
  return (
    <button type="button" className={cx("nm-cat", `nm-cat--${size}`, className)} onClick={onClick}>
      {badge}
      <span className="nm-cat__art">
        {image ? <img src={image} alt="" /> : <span className={cx("nm-cat__glyph", `nm-cat__glyph--${tone}`)}><Icon name={icon} /></span>}
      </span>
      <span className="nm-cat__title">{title}</span>
    </button>
  );
}

export function StoreLogo({ name, href = "#", logo, initials, color, featured, showName = true, badge }: {
  name: string; href?: string; logo?: string; initials?: string; color?: string; featured?: boolean; showName?: boolean; badge?: ReactNode;
}) {
  return (
    <a className="nm-store" href={href}>
      <span className={cx("nm-store__tile", featured && "nm-store__tile--brand")}>
        {badge}
        {logo ? <img src={logo} alt="" /> : <span className="nm-store__mark" style={color ? { background: color } : undefined}>{initials ?? name.slice(0, 2)}</span>}
      </span>
      {showName ? <span className="nm-store__name">{name}</span> : null}
    </a>
  );
}

/** `price`, `oldPrice` y `unit` llegan ya formateados según la moneda elegida. */
export function ProductCard({ name, price, oldPrice, unit, image, badges, onAdd, className }: {
  name: string; price: string; oldPrice?: string; unit?: string; image?: string; badges?: ReactNode; onAdd?: () => void; className?: string;
}) {
  const sale = oldPrice != null;
  return (
    <article className={cx("nm-product", className)}>
      <div className="nm-product__img">
        {image ? <img src={image} alt="" /> : null}
        {badges ? <div className="nm-product__badges">{badges}</div> : null}
        <button className="nm-product__add" type="button" aria-label={`Agregar ${name}`} onClick={onAdd}><Icon name="plus" /></button>
      </div>
      <div className={cx("nm-product__price", sale && "nm-product__price--sale")}>
        {price}
        {sale ? <span className="nm-product__old">{oldPrice}</span> : null}
      </div>
      <div className="nm-product__name">{name}</div>
      {unit ? <div className="nm-product__unit">{unit}</div> : null}
    </article>
  );
}

export function RestaurantCard({ name, time, fee, rating, image, logo, initials, badges, plusFree, sponsored, className }: {
  name: string; time: string; fee: string; rating?: string; image?: string; logo?: string; initials?: string; badges?: ReactNode; plusFree?: boolean; sponsored?: boolean; className?: string;
}) {
  return (
    <article className={cx("nm-rest", className)}>
      <div className="nm-rest__img">
        {image ? <img src={image} alt="" /> : null}
        {badges ? <div className="nm-rest__badges">{badges}</div> : null}
      </div>
      <div className="nm-rest__body">
        <span className="nm-rest__logo">{logo ? <img src={logo} alt="" /> : (initials ?? name.slice(0, 2))}</span>
        <div className="nm-rest__info">
          <div className="nm-rest__top">
            <span className="nm-rest__name">{name}</span>
            {rating ? <span className="nm-rest__rating"><Icon name="star" />{rating}</span> : null}
          </div>
          <div className="nm-rest__meta"><Icon name="clock" />{time}</div>
          <div className="nm-rest__meta">
            <Icon name="moto" />{fee}
            {plusFree ? <> · <span className="nm-rest__free">Gratis con</span> <Badge tone="plus" /></> : null}
          </div>
          {sponsored ? <span className="nm-rest__ad">Anuncio</span> : null}
        </div>
      </div>
    </article>
  );
}

export function OrderCard({ store, date, total, status = "delivered", initials, color, items, className }: {
  store: string; date: string; total: string; status?: "delivered" | "cancelled"; initials?: string; color?: string; items?: ReactNode[]; className?: string;
}) {
  const cancelled = status === "cancelled";
  return (
    <article className={cx("nm-order", className)}>
      <div className="nm-order__head">
        <span className="nm-order__logo" style={color ? { background: color } : undefined}>{initials ?? store.slice(0, 2)}</span>
        <div className="nm-order__info">
          <div className="nm-order__status"><b className={cancelled ? "is-cancel" : ""}>{cancelled ? "Cancelado" : "Entregado"}</b> {date}</div>
          <div className="nm-order__store">{store}</div>
        </div>
        <span className="nm-order__total">{total}</span>
      </div>
      {items ? <div className="nm-order__items">{items.map((it, i) => <span key={i} className="nm-order__thumb">{it}</span>)}</div> : null}
      <div className="nm-order__actions">
        {cancelled ? null : <Button variant="secondary" icon="starOutline">Opinar</Button>}
        <Button variant="secondary" icon="repeat">Repetir</Button>
      </div>
    </article>
  );
}
