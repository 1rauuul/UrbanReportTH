export type EstatusReporte =
  | "creado"
  | "asignado_a_dependencia"
  | "asignado_a_jefe_cuadrilla"
  | "en_proceso"
  | "solucionado_por_cuadrilla"
  | "pendiente_revision_ciudadana"
  | "reabierto_por_ciudadano"
  | "cerrado"
  | "cerrado_administrativamente";

/** Alias para compatibilidad con código legacy */
export type Estatus = EstatusReporte;

export type TipoIncidencia =
  | "bache"
  | "basura"
  | "fuga"
  | "alumbrado";

export type SyncStatus =
  | "synced"
  | "pending_sync"
  | "syncing"
  | "sync_failed";

export interface Reporte {
  id: string;
  folio: string;
  tipo: TipoIncidencia;
  descripcion: string;
  referencia: string;
  colonia: string;
  direccion: string;
  estatus: EstatusReporte;
  dependencia: string;
  dependenciaId?: string | null;
  fecha: string;
  ciudadano: string;
  lat?: number | null;
  lng?: number | null;
  fotoUrl?: string | null;
  fotoVerificacion?: "verificada" | "con_dudas" | "no_corresponde" | null;
  fotoAvance?: string | null;
  syncStatus?: SyncStatus;
  clientRequestId?: string;
  lastError?: string;
  jefeCuadrillaId?: string | null;
}

export interface HistorialEstatus {
  estatus: EstatusReporte;
  fecha: string;
  nota: string;
  dependencia?: string;
  actor?: string;
}

export const TIPOS_INCIDENCIA: {
  id: TipoIncidencia;
  label: string;
  icon: string;
}[] = [
  { id: "bache", label: "Bache", icon: "road" },
  { id: "basura", label: "Basura", icon: "trash" },
  { id: "fuga", label: "Fuga de agua", icon: "droplet" },
  { id: "alumbrado", label: "Alumbrado", icon: "zap" },
];

export const ESTATUS_LABELS: Record<EstatusReporte, string> = {
  creado: "Recibido",
  asignado_a_dependencia: "Asignado",
  asignado_a_jefe_cuadrilla: "En cuadrilla",
  en_proceso: "En proceso",
  solucionado_por_cuadrilla: "Solucionado",
  pendiente_revision_ciudadana: "Pendiente tu revisión",
  reabierto_por_ciudadano: "Reabierto",
  cerrado: "Cerrado",
  cerrado_administrativamente: "Cerrado (admin)",
};

export const SYNC_STATUS_LABELS: Record<SyncStatus, string> = {
  synced: "Enviado",
  pending_sync: "Pendiente de envío",
  syncing: "Sincronizando",
  sync_failed: "Error al enviar",
};

export const DEPENDENCIAS = [
  "Obra Pública",
  "OOSAPAT",
  "OOSELITE",
  "Protección Civil",
];

export const DEPENDENCIAS_SLUGS: Record<string, string> = {
  "obra-publica": "Obra Pública",
  "oosapat": "OOSAPAT",
  "ooselite": "OOSELITE",
  "proteccion-civil": "Protección Civil",
};

export const REPORTES_MOCK: Reporte[] = [
  {
    id: "1",
    folio: "THC-2026-00042",
    tipo: "bache",
    descripcion: "Bache grande en esquina que dificulta el paso de vehículos.",
    referencia: "Frente a la farmacia Guadalajara",
    colonia: "Centro",
    direccion: "Av. Reforma #120",
    estatus: "asignado_a_dependencia",
    dependencia: "Obra Pública",
    fecha: "2026-05-12",
    ciudadano: "María López",
  },
  {
    id: "2",
    folio: "THC-2026-00038",
    tipo: "basura",
    descripcion: "Acumulación de basura en banqueta sin recolección.",
    referencia: "Calle 5 de Mayo entre 2 y 4 Norte",
    colonia: "San Sebastián",
    direccion: "Calle 5 de Mayo #45",
    estatus: "en_proceso",
    dependencia: "OOSELITE",
    fecha: "2026-05-10",
    ciudadano: "Carlos Ruiz",
  },
  {
    id: "3",
    folio: "THC-2026-00031",
    tipo: "alumbrado",
    descripcion: "Luminaria apagada desde hace una semana.",
    referencia: "Parque Juárez, entrada principal",
    colonia: "La Huizachera",
    direccion: "Blvd. Miguel Hidalgo",
    estatus: "cerrado",
    dependencia: "Obra Pública",
    fecha: "2026-05-05",
    ciudadano: "Ana García",
  },
  {
    id: "4",
    folio: "THC-2026-00027",
    tipo: "fuga",
    descripcion: "Fuga de agua potable en la calle.",
    referencia: "Esquina con Av. Independencia",
    colonia: "Centro",
    direccion: "Calle 3 Sur #88",
    estatus: "asignado_a_jefe_cuadrilla",
    dependencia: "OOSAPAT",
    fecha: "2026-05-08",
    ciudadano: "Pedro Méndez",
  },
];
