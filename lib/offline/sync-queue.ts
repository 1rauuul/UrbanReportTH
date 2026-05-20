"use client";

import { createReporteApi } from "@/lib/api/client";
import {
  offlineDb,
  MAX_PENDING_REPORTS,
  type PendingReport,
} from "./db";
import { generarFolioPendiente } from "./folio";
import type { TipoIncidencia } from "@/lib/mock-data";

export type SyncListener = (detail: {
  syncing: boolean;
  pendingCount: number;
}) => void;

const listeners = new Set<SyncListener>();
let syncing = false;

function notify() {
  void offlineDb.pendingReports
    .where("status")
    .anyOf(["pending_sync", "sync_failed", "syncing"])
    .count()
    .then((pendingCount) => {
      listeners.forEach((fn) => fn({ syncing, pendingCount }));
    });
}

export function subscribeSync(listener: SyncListener): () => void {
  listeners.add(listener);
  notify();
  return () => listeners.delete(listener);
}

export interface EnqueueInput {
  tipo: TipoIncidencia;
  descripcion: string;
  referencia: string;
  calle: string;
  colonia: string;
  codigoPostal: string;
  lat: number | null;
  lng: number | null;
  ciudadanoNombre: string;
  ciudadanoTelefono: string;
  foto?: Blob | null;
}

export async function enqueueReport(input: EnqueueInput): Promise<{
  clientRequestId: string;
  folioTemporal: string;
}> {
  const count = await offlineDb.pendingReports.count();
  if (count >= MAX_PENDING_REPORTS) {
    throw new Error("Límite de reportes pendientes alcanzado (20). Sincroniza antes de crear más.");
  }

  const clientRequestId = crypto.randomUUID();
  const folioTemporal = generarFolioPendiente();

  const pending: PendingReport = {
    clientRequestId,
    folioTemporal,
    tipo: input.tipo,
    descripcion: input.descripcion,
    referencia: input.referencia,
    calle: input.calle,
    colonia: input.colonia || "Sin especificar",
    codigoPostal: input.codigoPostal || "",
    lat: input.lat,
    lng: input.lng,
    ciudadanoNombre: input.ciudadanoNombre,
    ciudadanoTelefono: input.ciudadanoTelefono,
    status: "pending_sync",
    retryCount: 0,
    createdAt: Date.now(),
  };

  await offlineDb.pendingReports.add(pending);

  if (input.foto) {
    await offlineDb.pendingPhotos.add({
      pendingReportId: clientRequestId,
      blob: input.foto,
      mimeType: input.foto.type || "image/jpeg",
      name: "evidencia.jpg",
    });
  }

  notify();
  return { clientRequestId, folioTemporal };
}

export async function getPendingReports(): Promise<PendingReport[]> {
  return offlineDb.pendingReports.orderBy("createdAt").toArray();
}

export async function getPendingCount(): Promise<number> {
  return offlineDb.pendingReports
    .where("status")
    .anyOf(["pending_sync", "sync_failed", "syncing"])
    .count();
}

async function uploadOne(pending: PendingReport): Promise<void> {
  const photos = await offlineDb.pendingPhotos
    .where("pendingReportId")
    .equals(pending.clientRequestId)
    .toArray();
  const foto = photos[0]?.blob ?? null;

  await offlineDb.pendingReports.update(pending.clientRequestId, {
    status: "syncing",
  });
  notify();

  await createReporteApi({
    clientRequestId: pending.clientRequestId,
    tipo: pending.tipo,
    descripcion: pending.descripcion,
    referencia: pending.referencia,
    calle: pending.calle,
    colonia: pending.colonia,
    codigoPostal: pending.codigoPostal,
    lat: pending.lat,
    lng: pending.lng,
    ciudadanoNombre: pending.ciudadanoNombre,
    ciudadanoTelefono: pending.ciudadanoTelefono,
    foto,
    skipAI: true,
  });

  await offlineDb.pendingReports.delete(pending.clientRequestId);
  await offlineDb.pendingPhotos
    .where("pendingReportId")
    .equals(pending.clientRequestId)
    .delete();
}

const MAX_RETRIES = 3;

export async function processSyncQueue(): Promise<{ synced: number; failed: number }> {
  if (syncing || !navigator.onLine) return { synced: 0, failed: 0 };

  syncing = true;
  notify();

  let synced = 0;
  let failed = 0;

  try {
    const queue = await offlineDb.pendingReports
      .where("status")
      .anyOf(["pending_sync", "sync_failed"])
      .sortBy("createdAt");

    for (const item of queue) {
      if (!navigator.onLine) break;
      try {
        await uploadOne(item);
        synced++;
      } catch (err) {
        const retryCount = item.retryCount + 1;
        const message = err instanceof Error ? err.message : "Error de sincronización";
        if (retryCount >= MAX_RETRIES) {
          await offlineDb.pendingReports.update(item.clientRequestId, {
            status: "sync_failed",
            retryCount,
            lastError: message,
          });
        } else {
          await offlineDb.pendingReports.update(item.clientRequestId, {
            status: "pending_sync",
            retryCount,
            lastError: message,
          });
        }
        failed++;
      }
    }
  } finally {
    syncing = false;
    notify();
  }

  return { synced, failed };
}

export async function retryFailed(clientRequestId: string): Promise<void> {
  await offlineDb.pendingReports.update(clientRequestId, {
    status: "pending_sync",
    retryCount: 0,
    lastError: undefined,
  });
  notify();
  await processSyncQueue();
}
