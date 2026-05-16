"use client";

import { useEffect } from "react";
import { processSyncQueue } from "@/lib/offline/sync-queue";
import { useAppStore } from "@/lib/store";

export default function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const ciudadano = useAppStore((s) => s.ciudadano);
  const cargarReportesCiudadano = useAppStore((s) => s.cargarReportesCiudadano);
  const cargarReportesGobierno = useAppStore((s) => s.cargarReportesGobierno);

  useEffect(() => {
    function onOnline() {
      void processSyncQueue().then(({ synced }) => {
        if (synced > 0 && ciudadano) void cargarReportesCiudadano();
      });
    }

    function onVisible() {
      if (document.visibilityState === "visible" && navigator.onLine) {
        onOnline();
      }
    }

    function onSwMessage(event: MessageEvent) {
      if (event.data?.type === "SYNC_REPORTS" && ciudadano) {
        void processSyncQueue().then(() => cargarReportesCiudadano());
      }
    }

    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    navigator.serviceWorker?.addEventListener("message", onSwMessage);
    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
      navigator.serviceWorker?.removeEventListener("message", onSwMessage);
    };
  }, [ciudadano, cargarReportesCiudadano]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const path = window.location.pathname;
    if (path.startsWith("/gobierno") || path.startsWith("/dependencia")) {
      void cargarReportesGobierno();
    }
  }, [cargarReportesGobierno]);

  return <>{children}</>;
}
