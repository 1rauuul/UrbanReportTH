import Dexie, { type EntityTable } from "dexie";
import type { TipoIncidencia } from "@/lib/mock-data";

export type PendingSyncStatus = "pending_sync" | "syncing" | "sync_failed";

export interface PendingPhoto {
  id?: number;
  pendingReportId: string;
  blob: Blob;
  mimeType: string;
  name: string;
}

export interface PendingReport {
  clientRequestId: string;
  folioTemporal: string;
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
  status: PendingSyncStatus;
  retryCount: number;
  lastError?: string;
  createdAt: number;
}

class OfflineDB extends Dexie {
  pendingReports!: EntityTable<PendingReport, "clientRequestId">;
  pendingPhotos!: EntityTable<PendingPhoto, "id">;

  constructor() {
    super("SIMACOffline");
    this.version(1).stores({
      pendingReports: "clientRequestId, status, createdAt",
      pendingPhotos: "++id, pendingReportId",
    });
  }
}

export const offlineDb = new OfflineDB();

export const MAX_PENDING_REPORTS = 20;
export const MAX_PHOTOS_PER_REPORT = 3;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
