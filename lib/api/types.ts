import type { Estatus, TipoIncidencia } from "@/lib/mock-data";

export type SyncStatus =
  | "synced"
  | "pending_sync"
  | "syncing"
  | "sync_failed";

export interface ReporteDTO {
  id: string;
  folio: string;
  tipo: TipoIncidencia;
  descripcion: string;
  referencia: string;
  colonia: string;
  direccion: string;
  lat?: number | null;
  lng?: number | null;
  estatus: Estatus;
  dependencia: string;
  fecha: string;
  ciudadano: string;
  fotoUrl?: string | null;
  syncStatus?: SyncStatus;
  clientRequestId?: string;
}

export interface HistorialDTO {
  estatus: Estatus;
  fecha: string;
  nota: string;
  dependencia?: string;
}

export interface EvaluacionDTO {
  estrellas: number;
  comentario: string;
  fecha: string;
}
