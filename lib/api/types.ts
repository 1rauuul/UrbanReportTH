import type { EstatusReporte, TipoIncidencia } from "@/lib/mock-data";

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
  estatus: EstatusReporte;
  dependencia: string;
  dependenciaId?: string | null;
  fecha: string;
  ciudadano: string;
  fotoUrl?: string | null;
  fotoVerificacion?: "verificada" | "con_dudas" | "no_corresponde" | null;
  fotoAvance?: string | null;
  syncStatus?: SyncStatus;
  clientRequestId?: string;
  jefeCuadrillaId?: string | null;
}

export interface HistorialDTO {
  estatus: EstatusReporte;
  fecha: string;
  nota: string;
  dependencia?: string;
  actor?: string;
}

export interface EvaluacionDTO {
  estrellas: number;
  comentario: string;
  fecha: string;
}

export interface JefeCuadrillaDTO {
  id: string;
  nombre: string;
  email: string;
  dependenciaId: string;
}
