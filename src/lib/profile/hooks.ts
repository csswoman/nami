"use client";
import { useEffect, useSyncExternalStore } from "react";
import { useProfileStore } from "./store";
/** Lee los favoritos guardados una sola vez (skipHydration evita el desajuste servidor/cliente). */
export function useProfileHydration() {
  useEffect(() => {
    void useProfileStore.persist.rehydrate();
  }, []);
}
/** true cuando el perfil ya leyó localStorage. */
export function useProfileReady(): boolean {
  return useSyncExternalStore(
    (cb) => useProfileStore.persist.onFinishHydration(cb),
    () => useProfileStore.persist.hasHydrated(),
    () => false,
  );
}
