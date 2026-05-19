import type {
  Reporte as PrismaReporte,
  HistorialEstatus,
  Evaluacion,
  JefeDeCuadrilla,
  Usuario,
} from "@prisma/client";
import type { EstatusReporte, TipoIncidencia } from "@/lib/mock-data";
import type { HistorialDTO, ReporteDTO, EvaluacionDTO, JefeCuadrillaDTO } from "./types";

type ReporteWithRelations = PrismaReporte & {
  historial?: HistorialEstatus[];
  evaluacion?: Evaluacion | null;
  asignacion?: { jefeCuadrillaId: string } | null;
};

type JefeWithUsuario = JefeDeCuadrilla & { usuario: Usuario };

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
    estatus: r.estatus as EstatusReporte,
    dependencia: r.dependencia,
    dependenciaId: r.dependenciaId ?? null,
    fecha: r.createdAt.toISOString().slice(0, 10),
    ciudadano: r.ciudadanoNombre,
    fotoUrl: r.fotoUrl,
    syncStatus: "synced",
    clientRequestId: r.clientRequestId,
    jefeCuadrillaId: r.asignacion?.jefeCuadrillaId ?? null,
  };
}

export function toHistorialDTO(h: HistorialEstatus): HistorialDTO {
  return {
    estatus: h.estatus as EstatusReporte,
    fecha: h.createdAt.toLocaleString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
    nota: h.nota,
    dependencia: h.dependencia ?? undefined,
    actor: (h as HistorialEstatus & { actor?: string | null }).actor ?? undefined,
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

export function toJefeDTO(j: JefeWithUsuario): JefeCuadrillaDTO {
  return {
    id: j.id,
    nombre: j.usuario.nombre,
    email: j.usuario.email,
    dependenciaId: j.dependenciaId,
  };
}

export function generarFolioServidor(seq: number): string {
  const year = new Date().getFullYear();
  return `THC-${year}-${String(seq).padStart(5, "0")}`;
}
