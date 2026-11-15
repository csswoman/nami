import type { ReactNode } from "react";
import { cx } from "./cx";
import { Icon, type IconName } from "./icon";

type ButtonProps = {
  variant?: "primary" | "secondary" | "ghost" | "dark";
  size?: "sm";
  block?: boolean;
  icon?: IconName;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
};

export function Button({ variant = "primary", size, block, icon, type = "button", className, children, ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={cx("nm-btn", `nm-btn--${variant}`, size === "sm" && "nm-btn--sm", block && "nm-btn--block", className)}
      {...rest}
    >
      {icon ? <Icon name={icon} /> : null}
      {children}
    </button>
  );
}

type BadgeProps = {
  tone?: "promo" | "plus" | "success" | "primary" | "brand" | "surface" | "neutral" | "danger" | (string & {});
  icon?: IconName;
  className?: string;
  children?: ReactNode;
};

export function Badge({ tone = "promo", icon, className, children }: BadgeProps) {
  if (tone === "plus" && !children) {
    return (
      <span className="nm-badge nm-badge--plus">
        <b>Ñami+</b>
      </span>
    );
  }
  return (
    <span className={cx("nm-badge", `nm-badge--${tone}`, className)}>
      {icon ? <Icon name={icon} /> : null}
      {children}
    </span>
  );
}

type CuisineChipProps = {
  icon: IconName;
  label: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
};

export function CuisineChip({ icon, label, selected, onClick, className }: CuisineChipProps) {
  return (
    <button type="button" className={cx("nm-cuisine", selected && "is-on", className)} aria-pressed={!!selected} onClick={onClick}>
      <span className="nm-cuisine__disc"><Icon name={icon} /></span>
      <span className="nm-cuisine__label">{label}</span>
    </button>
  );
}

type SectionHeaderProps = {
  title: string;
  action?: string;
  /** Si lo pasas, la acción es un enlace en vez de un botón. */
  href?: string;
  onAction?: () => void;
  as?: "h1" | "h2" | "h3";
  className?: string;
};

export function SectionHeader({ title, action, href, onAction, as: Tag = "h2", className }: SectionHeaderProps) {
  return (
    <div className={cx("nm-section", className)}>
      <Tag className="nm-section__title">{title}</Tag>
      {action && href ? (
        <a className="nm-section__action" href={href}>{action}</a>
      ) : action ? (
        <button className="nm-section__action" type="button" onClick={onAction}>{action}</button>
      ) : null}
    </div>
  );
}
