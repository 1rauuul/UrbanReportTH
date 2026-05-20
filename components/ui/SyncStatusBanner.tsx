"use client";

import { useEffect, useState } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { getPendingCount, processSyncQueue, subscribeSync } from "@/lib/offline/sync-queue";
import { useAppStore } from "@/lib/store";

export default function SyncStatusBanner() {
  const online = useOnlineStatus();
  const cargarReportesCiudadano = useAppStore((s) => s.cargarReportesCiudadano);
  const ciudadano = useAppStore((s) => s.ciudadano);
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    return subscribeSync(({ syncing: s, pendingCount: c }) => {
      setSyncing(s);
      setPendingCount(c);
    });
  }, []);

  useEffect(() => {
    if (!online || !ciudadano) return;
    void (async () => {
      const { synced } = await processSyncQueue();
      if (synced > 0) await cargarReportesCiudadano();
    })();
  }, [online, ciudadano, cargarReportesCiudadano]);

  useEffect(() => {
    void getPendingCount().then(setPendingCount);
  }, []);

  if (online && pendingCount === 0 && !syncing) return null;

  return (
    <div
      className={[
        "border-b px-4 py-2 text-center text-xs font-semibold sm:text-sm",
        online ? "border-warning/30 bg-warning/10 text-warning" : "border-danger/30 bg-danger/10 text-danger",
      ].join(" ")}
      role="status"
    >
      {!online && "Sin conexión. Los reportes se guardarán y enviarán al reconectar."}
      {online && syncing && `Sincronizando ${pendingCount} reporte(s)...`}
      {online && !syncing && pendingCount > 0 && (
        <button
          type="button"
          className="underline"
          onClick={() => void processSyncQueue().then(() => cargarReportesCiudadano())}
        >
          {pendingCount} reporte(s) pendiente(s). Toca para sincronizar.
        </button>
      )}
    </div>
  );
}
