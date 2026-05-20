import type { EstatusReporte, TipoIncidencia } from "@/lib/mock-data";
import type { EvaluacionDTO, HistorialDTO, ReporteDTO, JefeCuadrillaDTO } from "./types";

export async function fetchReportes(telefono: string): Promise<ReporteDTO[]> {
  const res = await fetch(`/api/reportes?telefono=${encodeURIComponent(telefono)}`);
  if (!res.ok) throw new Error("No se pudieron cargar los reportes");
  return res.json();
}

export async function fetchReporte(id: string): Promise<{
  reporte: ReporteDTO;
  historial: HistorialDTO[];
  evaluacion: EvaluacionDTO | null;
}> {
  const res = await fetch(`/api/reportes/${id}`);
  if (!res.ok) throw new Error("Reporte no encontrado");
  return res.json();
}

export async function fetchAllReportes(): Promise<ReporteDTO[]> {
  const res = await fetch("/api/reportes");
  if (!res.ok) throw new Error("No se pudieron cargar los reportes");
  return res.json();
}

export interface CreateReportePayload {
  clientRequestId: string;
  tipo: TipoIncidencia;
  descripcion: string;
  referencia: string;
  calle: string;
  colonia: string;
  codigoPostal: string;
  lat?: number | null;
  lng?: number | null;
  ciudadanoNombre: string;
  ciudadanoTelefono: string;
  foto?: Blob | null;
  skipAI?: boolean;
}

export async function createReporteApi(
  payload: CreateReportePayload
): Promise<ReporteDTO> {
  const form = new FormData();
  form.append("clientRequestId", payload.clientRequestId);
  form.append("tipo", payload.tipo);
  form.append("descripcion", payload.descripcion);
  form.append("referencia", payload.referencia);
  form.append("calle", payload.calle);
  form.append("colonia", payload.colonia);
  form.append("codigoPostal", payload.codigoPostal);
  form.append("ciudadanoNombre", payload.ciudadanoNombre);
  form.append("ciudadanoTelefono", payload.ciudadanoTelefono);
  if (payload.lat != null) form.append("lat", String(payload.lat));
  if (payload.lng != null) form.append("lng", String(payload.lng));
  if (payload.foto) form.append("foto", payload.foto, "evidencia.jpg");
  if (payload.skipAI) form.append("skipAI", "1");

  const res = await fetch("/api/reportes", { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Error al crear reporte");
  }
  return res.json();
}

export async function actualizarEstatusApi(
  id: string,
  estatus: EstatusReporte,
  nota: string
): Promise<ReporteDTO> {
  const res = await fetch(`/api/reportes/${id}/estatus`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estatus, nota }),
  });
  if (!res.ok) throw new Error("Error al actualizar estatus");
  return res.json();
}

export async function asignarCuadrillaApi(
  id: string,
  jefeCuadrillaId: string,
  nota: string
): Promise<ReporteDTO> {
  const res = await fetch(`/api/reportes/${id}/asignar-cuadrilla`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jefeCuadrillaId, nota }),
  });
  if (!res.ok) throw new Error("Error al asignar jefe de cuadrilla");
  return res.json();
}

export async function avanceCuadrillaApi(
  id: string,
  estatus: "en_proceso" | "solucionado_por_cuadrilla",
  nota: string,
  fotoAvance?: Blob | null
): Promise<ReporteDTO> {
  const form = new FormData();
  form.append("estatus", estatus);
  form.append("nota", nota || "");
  if (fotoAvance) form.append("fotoAvance", fotoAvance, "avance.jpg");

  const res = await fetch(`/api/reportes/${id}/avance`, {
    method: "PATCH",
    credentials: "same-origin",
    body: form,
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (res.status === 403 && data.error === "No autorizado") {
      throw new Error(
        "Sesión no válida para cuadrilla. Cierra sesión e ingresa con la cuenta del jefe de cuadrilla asignado."
      );
    }
    if (res.status === 403) {
      throw new Error(
        data.error ??
          "Este reporte no está asignado a tu cuadrilla. Usa la cuenta del jefe que lo recibió."
      );
    }
    throw new Error(data.error ?? "Error al actualizar avance");
  }
  return res.json();
}

export async function revisionCiudadanoApi(
  id: string,
  confirmar: boolean,
  comentario: string
): Promise<ReporteDTO> {
  const res = await fetch(`/api/reportes/${id}/revision-ciudadano`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirmar, comentario }),
  });
  if (!res.ok) throw new Error("Error al enviar revisión");
  return res.json();
}

export async function cierreAdminApi(
  id: string,
  nota: string
): Promise<ReporteDTO> {
  const res = await fetch(`/api/reportes/${id}/cierre-admin`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nota }),
  });
  if (!res.ok) throw new Error("Error al cerrar administrativamente");
  return res.json();
}

export async function fetchJefesCuadrilla(): Promise<JefeCuadrillaDTO[]> {
  const res = await fetch("/api/dependencia/jefes");
  if (!res.ok) throw new Error("Error al cargar jefes de cuadrilla");
  return res.json();
}

export async function evaluarReporteApi(
  id: string,
  estrellas: number,
  comentario: string
): Promise<EvaluacionDTO> {
  const res = await fetch(`/api/reportes/${id}/evaluacion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estrellas, comentario }),
  });
  if (!res.ok) throw new Error("Error al enviar evaluación");
  return res.json();
}

export async function registrarPushApi(
  telefono: string,
  subscription: PushSubscriptionJSON
): Promise<void> {
  await fetch("/api/notificaciones/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telefono, subscription }),
  });
}
