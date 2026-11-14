"use client";

import { useState, type FormEvent } from "react";
import { cx } from "./cx";
import { Icon } from "./icon";

type SearchBarProps = {
  placeholder?: string;
  defaultValue?: string;
  onSearch?: (q: string) => void;
  className?: string;
};

export function SearchBar({ placeholder = "Restaurantes, platos y productos", defaultValue, onSearch, className }: SearchBarProps) {
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q");
    onSearch?.(typeof q === "string" ? q : "");
  }
  return (
    <form className={cx("nm-search", className)} role="search" onSubmit={submit}>
      <input name="q" type="search" placeholder={placeholder} aria-label="Buscar" defaultValue={defaultValue} />
      <button className="nm-search__btn" type="submit" aria-label="Buscar"><Icon name="search" /></button>
    </form>
  );
}

export type TabItem = string | { label: string; initials?: string; color?: string };

type TabsProps = {
  items: TabItem[];
  active?: number;
  onChange?: (index: number) => void;
  className?: string;
};

export function Tabs({ items, active = 0, onChange, className }: TabsProps) {
  const [current, setCurrent] = useState(active);
  return (
    <div className={cx("nm-tabs", className)} role="tablist">
      {items.map((it, i) => {
        const o = typeof it === "string" ? { label: it } : it;
        return (
          <button
            key={i}
            className="nm-tab"
            role="tab"
            aria-selected={i === current}
            onClick={() => {
              setCurrent(i);
              onChange?.(i);
            }}
          >
            {"initials" in o && o.initials ? (
              <span className="nm-tab__logo" style={o.color ? { background: o.color } : undefined}>{o.initials}</span>
            ) : null}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
