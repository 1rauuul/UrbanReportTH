"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useAppStore } from "@/lib/store";

export default function StoreHydration({ children }: { children: React.ReactNode }) {
  const hydrated = useSyncExternalStore(
    (onStoreChange) => {
      const unsub = useAppStore.persist.onFinishHydration(onStoreChange);
      return unsub;
    },
    () => useAppStore.persist.hasHydrated(),
    () => false
  );

  useEffect(() => {
    if (!useAppStore.persist.hasHydrated()) {
      void useAppStore.persist.rehydrate();
    }
  }, []);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-muted">
        Cargando...
      </div>
    );
  }

  return <>{children}</>;
};
