"use client";

import { useState, useEffect, useRef, useCallback, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { cx } from "./cx";
import { Icon, type IconName } from "./icon";
import { StoreMark } from "@/components/shell/StoreMark";
import { formatMoney, type Currency } from "@/lib/money";

type SearchStoreItem = {
  slug: string;
  name: string;
  kind: "restaurante" | "mercado";
  category: string;
  description: string;
  initials: string;
  color: any;
  rating: string | null;
  time: string;
  isOpen: boolean;
  statusText: string;
};

type SearchProductItem = {
  id: string;
  name: string;
  priceCents: number;
  icon: IconName | null;
  image: string | null;
  soldOut: boolean;
  store: {
    slug: string;
    name: string;
    kind: "restaurante" | "mercado";
  };
};

type SearchResponse = {
  stores: SearchStoreItem[];
  products: SearchProductItem[];
  currency?: Currency;
  rate?: number;
};

type SearchBarProps = {
  placeholder?: string;
  defaultValue?: string;
  onSearch?: (q: string) => void;
  className?: string;
  autoFocus?: boolean;
};

const POPULAR_SEARCHES = ["Arepas", "Empanadas", "Tequeños", "Cachapas", "Hamburguesas", "Harina P.A.N.", "Farmacia", "Bodegón"];
const RECENT_KEY = "nami-recent-searches";

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const normText = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const normQ = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const idx = normText.indexOf(normQ);
  if (idx === -1) return <>{text}</>;

  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + normQ.length);
  const after = text.slice(idx + normQ.length);

  return (
    <>
      {before}
      <strong className="text-primary-text font-black underline decoration-primary/40 underline-offset-2">{match}</strong>
      {after}
    </>
  );
}

export function SearchBar({
  placeholder = "Restaurantes, platos y productos",
  defaultValue = "",
  onSearch,
  className,
  autoFocus,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cargar búsquedas recientes guardadas en localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setRecent(parsed.slice(0, 5));
      }
    } catch {
      // Ignorar errores de localStorage
    }
  }, []);

  const saveRecent = useCallback((term: string) => {
    const clean = term.trim();
    if (!clean) return;
    setRecent((prev) => {
      const next = [clean, ...prev.filter((x) => x.toLowerCase() !== clean.toLowerCase())].slice(0, 5);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // Ignorar
      }
      return next;
    });
  }, []);

  const removeRecent = useCallback((term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecent((prev) => {
      const next = prev.filter((x) => x !== term);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // Ignorar
      }
      return next;
    });
  }, []);

  const clearAllRecent = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setRecent([]);
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {
      // Ignorar
    }
  }, []);

  // Búsqueda en vivo con debounce y cancelación de peticiones previas
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults(null);
      setIsLoading(false);
      setActiveIndex(-1);
      return;
    }

    setIsLoading(true);
    setActiveIndex(-1);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data: SearchResponse = await res.json();
          setResults(data);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setResults(null);
        }
      } finally {
        setIsLoading(false);
      }
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Cerrar al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  function handleNavigate(path: string, term?: string) {
    if (term) saveRecent(term);
    setIsOpen(false);
    inputRef.current?.blur();
    router.push(path);
  }

  function executeSearch(searchTerm: string) {
    const q = searchTerm.trim();
    if (!q) return;
    saveRecent(q);
    setIsOpen(false);
    inputRef.current?.blur();
    if (onSearch) {
      onSearch(q);
    } else {
      router.push(`/busqueda?q=${encodeURIComponent(q)}`);
    }
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    executeSearch(query);
  }

  function handleClear() {
    setQuery("");
    setResults(null);
    inputRef.current?.focus();
  }

  // Lista plana de elementos para navegación por teclado
  const stores = results?.stores ?? [];
  const products = results?.products ?? [];
  const hasMatches = stores.length > 0 || products.length > 0;
  const isTyping = query.trim().length > 0;

  // Total de elementos navegables
  // 0: "Buscar '{query}'"
  // 1 .. stores.length: Tiendas
  // stores.length + 1 .. stores.length + products.length: Productos
  // último: "Ver todos los resultados" si hay resultados
  const totalItems = isTyping ? 1 + stores.length + products.length + (hasMatches ? 1 : 0) : 0;

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (totalItems > 0) {
        setActiveIndex((prev) => (prev + 1 < totalItems ? prev + 1 : 0));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (totalItems > 0) {
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
      }
    } else if (e.key === "Enter") {
      if (activeIndex === -1 || activeIndex === 0) {
        // Búsqueda general
        e.preventDefault();
        executeSearch(query);
      } else {
        // Seleccionó un elemento específico
        e.preventDefault();
        const storeIdx = activeIndex - 1;
        if (storeIdx < stores.length) {
          const s = stores[storeIdx];
          const path = s.kind === "mercado" ? `/mercado/${s.slug}` : `/tienda/${s.slug}`;
          handleNavigate(path, s.name);
          return;
        }
        const prodIdx = storeIdx - stores.length;
        if (prodIdx < products.length) {
          const p = products[prodIdx];
          const path = p.store.kind === "mercado" ? `/mercado/${p.store.slug}` : `/tienda/${p.store.slug}/${p.id}`;
          handleNavigate(path, p.name);
          return;
        }
        // Footer: Ver todos
        executeSearch(query);
      }
    }
  }

  const currency = results?.currency ?? "USD";
  const rate = results?.rate ?? 36.6;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Overlay translúcido en móvil para dar foco al buscador */}
      {isOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px] desktop:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <form
        className={cx("nm-search", isOpen ? "nm-search--active" : "", className)}
        role="search"
        onSubmit={submit}
      >
        <input
          ref={inputRef}
          name="q"
          type="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          placeholder={placeholder}
          aria-label="Buscar en Ñami"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />

        {query.length > 0 ? (
          <button
            type="button"
            className="nm-search__clear"
            onClick={handleClear}
            aria-label="Limpiar búsqueda"
            title="Limpiar"
          >
            <Icon name="close" />
          </button>
        ) : null}

        <button
          className="nm-search__btn"
          type="submit"
          aria-label="Buscar"
          title="Buscar"
        >
          {isLoading ? (
            <span className="inline-block size-4.5 animate-spin rounded-full border-2 border-on-primary border-t-transparent" />
          ) : (
            <Icon name="search" />
          )}
        </button>
      </form>

      {/* Popover desplegable con sugerencias y resultados en vivo */}
      {isOpen ? (
        <div
          className="nm-search__popover"
          role="listbox"
          aria-label="Sugerencias de búsqueda"
        >
          {/* CASO 1: Cuando el usuario está escribiendo */}
          {isTyping ? (
            <div className="flex flex-col py-1.5">
              {/* Opción 0: Buscar texto tal cual */}
              <button
                type="button"
                className={cx(
                  "flex items-center gap-3.5 px-4 py-3 text-left transition-colors",
                  activeIndex === 0 ? "bg-surface-tile text-primary-text" : "hover:bg-surface-tile text-ink"
                )}
                onClick={() => executeSearch(query)}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-tint text-primary-text">
                  <Icon name="search" className="size-4.5" />
                </span>
                <span className="min-w-0 flex-1 truncate text-body font-semibold">
                  Buscar «<span className="text-primary-text font-bold">{query}</span>»
                </span>
                <span className="hidden text-caption font-bold text-ink-muted desktop:inline-block rounded-xs bg-surface-tile px-1.5 py-0.5 border border-border/60">
                  ↵ Enter
                </span>
              </button>

              {/* Sección Tiendas */}
              {stores.length > 0 ? (
                <div className="mt-1 border-t border-border/60 pt-2">
                  <div className="px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                    Tiendas y restaurantes
                  </div>
                  <ul>
                    {stores.map((s, idx) => {
                      const itemIdx = 1 + idx;
                      const isHighlighted = activeIndex === itemIdx;
                      const storeUrl = s.kind === "mercado" ? `/mercado/${s.slug}` : `/tienda/${s.slug}`;
                      return (
                        <li key={s.slug}>
                          <button
                            type="button"
                            className={cx(
                              "flex w-full items-center gap-3.5 px-4 py-2.5 text-left transition-colors",
                              isHighlighted ? "bg-surface-tile" : "hover:bg-surface-tile"
                            )}
                            onClick={() => handleNavigate(storeUrl, s.name)}
                          >
                            <StoreMark
                              initials={s.initials}
                              color={s.color}
                              slug={s.slug}
                              size={40}
                              dim={!s.isOpen}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-body-strong font-bold text-ink">
                                  <Highlight text={s.name} query={query} />
                                </span>
                                {s.rating ? (
                                  <span className="flex items-center gap-0.5 text-caption font-bold text-ink-muted">
                                    <Icon name="star" className="size-3 text-promo fill-promo" />
                                    {s.rating}
                                  </span>
                                ) : null}
                              </div>
                              <div className="flex items-center gap-2 text-caption text-ink-muted truncate">
                                <span>{s.description.split(" · ")[0]}</span>
                                <span>·</span>
                                <span>{s.time}</span>
                              </div>
                            </div>
                            <span
                              className={cx(
                                "shrink-0 text-caption font-semibold",
                                s.isOpen ? "text-success" : "text-ink-muted"
                              )}
                            >
                              {s.isOpen ? "Abierto" : "Cerrado"}
                            </span>
                            <Icon name="chevronRight" className="size-4 shrink-0 text-ink-muted" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}

              {/* Sección Platos y Productos */}
              {products.length > 0 ? (
                <div className="mt-1 border-t border-border/60 pt-2">
                  <div className="px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                    Platos y productos
                  </div>
                  <ul>
                    {products.map((p, idx) => {
                      const itemIdx = 1 + stores.length + idx;
                      const isHighlighted = activeIndex === itemIdx;
                      const prodUrl =
                        p.store.kind === "mercado"
                          ? `/mercado/${p.store.slug}`
                          : `/tienda/${p.store.slug}/${p.id}`;
                      return (
                        <li key={`${p.store.slug}-${p.id}`}>
                          <button
                            type="button"
                            className={cx(
                              "flex w-full items-center gap-3.5 px-4 py-2.5 text-left transition-colors",
                              isHighlighted ? "bg-surface-tile" : "hover:bg-surface-tile",
                              p.soldOut ? "opacity-60" : ""
                            )}
                            onClick={() => handleNavigate(prodUrl, p.name)}
                          >
                            <span className="grid size-11 shrink-0 place-items-center rounded-md bg-surface-tile border border-border/60 overflow-hidden">
                              {p.image ? (
                                <img src={p.image} alt="" className="size-full object-cover" />
                              ) : (
                                <Icon name={p.icon ?? "basket"} className="size-5 text-ink-muted" />
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <span className="block truncate text-body-strong font-bold text-ink">
                                <Highlight text={p.name} query={query} />
                              </span>
                              <span className="block truncate text-caption text-ink-muted">
                                {p.store.name}
                              </span>
                            </div>
                            <div className="shrink-0 text-right">
                              <b className="text-price font-bold text-ink">
                                {formatMoney(p.priceCents, currency, rate)}
                              </b>
                              {p.soldOut ? (
                                <span className="block text-[11px] font-bold text-danger">Agotado</span>
                              ) : null}
                            </div>
                            <Icon name="chevronRight" className="size-4 shrink-0 text-ink-muted" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}

              {/* Estado vacío si no hubo coincidencias */}
              {!hasMatches && !isLoading ? (
                <div className="px-6 py-7 text-center">
                  <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-surface-tile text-ink-muted">
                    <Icon name="search" className="size-6" />
                  </div>
                  <p className="text-body-strong font-bold text-ink">
                    No encontramos resultados para «{query}»
                  </p>
                  <p className="mt-1 text-caption text-ink-muted">
                    Prueba buscando por plato (arepa, cachapa), tienda o ingredientes.
                  </p>
                  <button
                    type="button"
                    className="nm-btn nm-btn--secondary mt-4 py-2 text-caption font-bold shadow-xs"
                    onClick={() => executeSearch(query)}
                  >
                    Buscar de todos modos
                  </button>
                </div>
              ) : null}

              {/* Botón Ver todos al final */}
              {hasMatches ? (
                <div className="mt-2 border-t border-border/60 p-2">
                  <button
                    type="button"
                    className={cx(
                      "flex w-full items-center justify-center gap-2 rounded-md py-2.5 text-center text-button font-bold text-primary-text transition-colors",
                      activeIndex === totalItems - 1 ? "bg-primary-tint" : "hover:bg-primary-tint"
                    )}
                    onClick={() => executeSearch(query)}
                  >
                    <span>Ver todos los resultados para «{query}»</span>
                    <Icon name="arrowRight" className="size-4" />
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            /* CASO 2: Cuando el buscador tiene foco pero no se ha escrito nada */
            <div className="flex flex-col gap-4 p-4">
              {/* Búsquedas recientes */}
              {recent.length > 0 ? (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                      Búsquedas recientes
                    </span>
                    <button
                      type="button"
                      onClick={clearAllRecent}
                      className="text-caption font-bold text-ink-muted hover:text-primary-text transition-colors"
                    >
                      Borrar todo
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recent.map((item) => (
                      <span
                        key={item}
                        className="group inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface-tile py-1 pl-3 pr-2 text-caption font-semibold text-ink transition-colors hover:border-ink-muted hover:bg-surface cursor-pointer"
                        onClick={() => {
                          setQuery(item);
                          executeSearch(item);
                        }}
                      >
                        <Icon name="clock" className="size-3.5 text-ink-muted group-hover:text-ink" />
                        <span>{item}</span>
                        <button
                          type="button"
                          className="grid size-4 place-items-center rounded-full text-ink-muted hover:bg-border hover:text-ink"
                          onClick={(e) => removeRecent(item, e)}
                          aria-label={`Eliminar ${item}`}
                          title="Eliminar"
                        >
                          <Icon name="close" className="size-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Populares en Caracas */}
              <div>
                <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  Populares en Caracas
                </div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCHES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface-tile px-3.5 py-1.5 text-caption font-semibold text-ink transition-all hover:border-primary hover:bg-primary-tint hover:text-primary-text"
                      onClick={() => {
                        setQuery(item);
                        executeSearch(item);
                      }}
                    >
                      <Icon name="search" className="size-3 text-ink-muted" />
                      <span>{item}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export type TabItem = string | { label: string; initials?: string; color?: string; logo?: string };

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
            {"logo" in o && o.logo ? (
              <span className="nm-tab__logo overflow-hidden border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={o.logo} alt="" className="size-full object-cover" />
              </span>
            ) : "initials" in o && o.initials ? (
              <span className="nm-tab__logo" style={o.color ? { background: o.color } : undefined}>{o.initials}</span>
            ) : null}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
