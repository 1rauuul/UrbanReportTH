import type { Estatus, TipoIncidencia } from "@/lib/mock-data";
import type { EvaluacionDTO, HistorialDTO, ReporteDTO } from "./types";

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
  colonia: string;
  lat?: number | null;
  lng?: number | null;
  ciudadanoNombre: string;
  ciudadanoTelefono: string;
  foto?: Blob | null;
}

export async function createReporteApi(
  payload: CreateReportePayload
): Promise<ReporteDTO> {
  const form = new FormData();
  form.append("clientRequestId", payload.clientRequestId);
  form.append("tipo", payload.tipo);
  form.append("descripcion", payload.descripcion);
  form.append("referencia", payload.referencia);
  form.append("colonia", payload.colonia);
  form.append("ciudadanoNombre", payload.ciudadanoNombre);
  form.append("ciudadanoTelefono", payload.ciudadanoTelefono);
  if (payload.lat != null) form.append("lat", String(payload.lat));
  if (payload.lng != null) form.append("lng", String(payload.lng));
  if (payload.foto) form.append("foto", payload.foto, "evidencia.jpg");

  const res = await fetch("/api/reportes", { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Error al crear reporte");
  }
  return res.json();
}

export async function asignarDependenciaApi(
  id: string,
  dependencia: string,
  nota: string
): Promise<ReporteDTO> {
  const res = await fetch(`/api/reportes/${id}/asignar`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dependencia, nota }),
  });
  if (!res.ok) throw new Error("Error al asignar dependencia");
  return res.json();
}

export async function actualizarEstatusApi(
  id: string,
  estatus: Estatus,
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
