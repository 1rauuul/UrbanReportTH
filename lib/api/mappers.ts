import type { Reporte as PrismaReporte, HistorialEstatus, Evaluacion } from "@prisma/client";
import type { Estatus, TipoIncidencia } from "@/lib/mock-data";
import type { HistorialDTO, ReporteDTO, EvaluacionDTO } from "./types";

type ReporteWithRelations = PrismaReporte & {
  historial?: HistorialEstatus[];
  evaluacion?: Evaluacion | null;
};

export function toReporteDTO(r: ReporteWithRelations): ReporteDTO {
  return {
    id: r.id,
    folio: r.folio,
    tipo: r.tipo as TipoIncidencia,
    descripcion: r.descripcion,
    referencia: r.referencia,
    colonia: r.colonia,
    direccion: r.direccion,
    lat: r.lat,
    lng: r.lng,
    estatus: r.estatus as Estatus,
    dependencia: r.dependencia,
    fecha: r.createdAt.toISOString().slice(0, 10),
    ciudadano: r.ciudadanoNombre,
    fotoUrl: r.fotoUrl,
    syncStatus: "synced",
    clientRequestId: r.clientRequestId,
  };
}

export function toHistorialDTO(h: HistorialEstatus): HistorialDTO {
  return {
    estatus: h.estatus as Estatus,
    fecha: h.createdAt.toLocaleString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
    nota: h.nota,
    dependencia: h.dependencia ?? undefined,
  };
}

export function toEvaluacionDTO(e: Evaluacion): EvaluacionDTO {
  return {
    estrellas: e.estrellas,
    comentario: e.comentario,
    fecha: e.createdAt.toLocaleString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

export function generarFolioServidor(seq: number): string {
  const year = new Date().getFullYear();
  return `THC-${year}-${String(seq).padStart(5, "0")}`;
}
