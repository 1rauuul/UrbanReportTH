export type Estatus =
  | "recibido"
  | "en_revision"
  | "asignado"
  | "en_proceso"
  | "resuelto"
  | "cerrado";

export type TipoIncidencia =
  | "bache"
  | "basura"
  | "fuga"
  | "luminaria"
  | "otro";

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
  estatus: Estatus;
  dependencia: string;
  fecha: string;
  ciudadano: string;
  lat?: number | null;
  lng?: number | null;
  fotoUrl?: string | null;
  syncStatus?: SyncStatus;
  clientRequestId?: string;
  lastError?: string;
}

export interface HistorialEstatus {
  estatus: Estatus;
  fecha: string;
  nota: string;
  dependencia?: string;
}

export const TIPOS_INCIDENCIA: {
  id: TipoIncidencia;
  label: string;
  icon: string;
}[] = [
  { id: "bache", label: "Bache", icon: "🕳️" },
  { id: "basura", label: "Basura", icon: "🗑️" },
  { id: "fuga", label: "Fuga de agua", icon: "💧" },
  { id: "luminaria", label: "Luminaria", icon: "💡" },
  { id: "otro", label: "Otro", icon: "📋" },
];

export const ESTATUS_LABELS: Record<Estatus, string> = {
  recibido: "Recibido",
  en_revision: "En revisión",
  asignado: "Canalizado",
  en_proceso: "En proceso",
  resuelto: "Resuelto",
  cerrado: "Cerrado",
};

export const SYNC_STATUS_LABELS: Record<SyncStatus, string> = {
  synced: "Enviado",
  pending_sync: "Pendiente de envío",
  syncing: "Sincronizando",
  sync_failed: "Error al enviar",
};

export const DEPENDENCIAS = [
  "Obras Públicas",
  "Servicios Públicos",
  "Alumbrado Público",
  "Protección Civil",
];

export const REPORTES_MOCK: Reporte[] = [
  {
    id: "1",
    folio: "THC-2026-00042",
    tipo: "bache",
    descripcion: "Bache grande en esquina que dificulta el paso de vehículos.",
    referencia: "Frente a la farmacia Guadalajara",
    colonia: "Centro",
    direccion: "Av. Reforma #120",
    estatus: "recibido",
    dependencia: "Sin asignar",
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
    dependencia: "Servicios Públicos",
    fecha: "2026-05-10",
    ciudadano: "Carlos Ruiz",
  },
  {
    id: "3",
    folio: "THC-2026-00031",
    tipo: "luminaria",
    descripcion: "Luminaria apagada desde hace una semana.",
    referencia: "Parque Juárez, entrada principal",
    colonia: "La Huizachera",
    direccion: "Blvd. Miguel Hidalgo",
    estatus: "resuelto",
    dependencia: "Alumbrado Público",
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
    estatus: "asignado",
    dependencia: "Servicios Públicos",
    fecha: "2026-05-08",
    ciudadano: "Pedro Méndez",
  },
];

export const HISTORIAL_MOCK: Record<string, HistorialEstatus[]> = {
  "1": [
    {
      estatus: "recibido",
      fecha: "2026-05-12 09:15",
      nota: "Reporte recibido correctamente.",
    },
  ],
  "2": [
    {
      estatus: "recibido",
      fecha: "2026-05-10 14:30",
      nota: "Reporte recibido.",
    },
    {
      estatus: "asignado",
      fecha: "2026-05-10 16:00",
      nota: "Canalizado a Servicios Públicos.",
      dependencia: "Servicios Públicos",
    },
    {
      estatus: "en_proceso",
      fecha: "2026-05-11 08:45",
      nota: "Cuadrilla en camino.",
      dependencia: "Servicios Públicos",
    },
  ],
  "3": [
    {
      estatus: "recibido",
      fecha: "2026-05-05 10:00",
      nota: "Reporte recibido.",
    },
    {
      estatus: "asignado",
      fecha: "2026-05-05 11:30",
      nota: "Asignado a Alumbrado Público.",
      dependencia: "Alumbrado Público",
    },
    {
      estatus: "en_proceso",
      fecha: "2026-05-06 09:00",
      nota: "Técnico en sitio.",
      dependencia: "Alumbrado Público",
    },
    {
      estatus: "resuelto",
      fecha: "2026-05-07 15:20",
      nota: "Luminaria reemplazada.",
      dependencia: "Alumbrado Público",
    },
  ],
};
