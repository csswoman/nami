"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Address } from "@/lib/cart/store";
import {
  addAddress, cleanAddresses, cleanProducts, cleanStores, sameProduct, toggleIn,
  type FavoriteProduct, type SavedAddress,
} from "./favorites";
/** Favoritos y direcciones guardadas: viven solo en el navegador (localStorage), nunca en la BD. */
type State = {
  stores: string[];
  products: FavoriteProduct[];
  addresses: SavedAddress[];
  toggleStore: (slug: string) => void;
  toggleProduct: (p: FavoriteProduct) => void;
  saveAddress: (a: Address) => void;
  removeAddress: (id: string) => void;
  clear: () => void;
};
export const PROFILE_KEY = "nami-profile";
export const useProfileStore = create<State>()(
  persist(
    (set) => ({
      stores: [],
      products: [],
      addresses: [],
      toggleStore: (slug) => set((s) => ({ stores: toggleIn(s.stores, slug) })),
      toggleProduct: (p) => set((s) => ({ products: toggleIn(s.products, p, sameProduct) })),
      saveAddress: (a) => set((s) => ({ addresses: addAddress(s.addresses, a, crypto.randomUUID()) })),
      removeAddress: (id) => set((s) => ({ addresses: s.addresses.filter((a) => a.id !== id) })),
      clear: () => set({ stores: [], products: [], addresses: [] }),
    }),
    {
      name: PROFILE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ stores: s.stores, products: s.products, addresses: s.addresses }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Record<string, unknown>;
        return { ...current, stores: cleanStores(p.stores), products: cleanProducts(p.products), addresses: cleanAddresses(p.addresses) };
      },
    },
  ),
);
