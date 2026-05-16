"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Estatus, HistorialEstatus, Reporte } from "@/lib/mock-data";
import {
  fetchAllReportes,
  fetchReportes,
  asignarDependenciaApi,
  actualizarEstatusApi,
  evaluarReporteApi,
} from "@/lib/api/client";
import { fechaLocal, normalizarTelefono } from "@/lib/utils";
import type { PendingReport } from "@/lib/offline/db";
import { getPendingReports } from "@/lib/offline/sync-queue";
import { esFolioPendiente } from "@/lib/offline/folio";

export interface Ciudadano {
  nombre: string;
  telefono: string;
}

export interface Evaluacion {
  estrellas: number;
  comentario: string;
  fecha: string;
}

interface AppState {
  ciudadano: Ciudadano | null;
  reportes: Reporte[];
  historial: Record<string, HistorialEstatus[]>;
  evaluaciones: Record<string, Evaluacion>;
  ultimoReporteId: string | null;
  ultimoFolio: string | null;
  ultimoEsPendiente: boolean;
  dependenciaActiva: string;
  loading: boolean;
  error: string | null;

  registrarCiudadano: (nombre: string, telefono: string) => void;
  loginCiudadano: (telefono: string) => boolean;
  logoutCiudadano: () => void;
  setDependenciaActiva: (dependencia: string) => void;
  cargarReportesCiudadano: () => Promise<void>;
  cargarReportesGobierno: () => Promise<void>;
  cargarDetalleReporte: (id: string) => Promise<void>;
  setUltimoReporte: (id: string, folio: string, esPendiente: boolean) => void;
  asignarDependencia: (id: string, dependencia: string, nota: string) => Promise<void>;
  actualizarEstatus: (id: string, estatus: Estatus, nota: string) => Promise<void>;
  evaluarReporte: (id: string, estrellas: number, comentario: string) => Promise<void>;
  mergeReporte: (reporte: Reporte) => void;
  resetDemo: () => void;
}

function pendingToReporte(p: PendingReport): Reporte {
  return {
    id: p.clientRequestId,
    folio: p.folioTemporal,
    tipo: p.tipo,
    descripcion: p.descripcion,
    referencia: p.referencia,
    colonia: p.colonia,
    direccion:
      p.lat != null && p.lng != null
        ? `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`
        : p.referencia,
    lat: p.lat,
    lng: p.lng,
    estatus: "recibido",
    dependencia: "Sin asignar",
    fecha: new Date(p.createdAt).toISOString().slice(0, 10),
    ciudadano: p.ciudadanoNombre,
    syncStatus: p.status,
    clientRequestId: p.clientRequestId,
    lastError: p.lastError,
  };
}

async function mergeWithPending(
  server: Reporte[],
  telefono: string
): Promise<Reporte[]> {
  const pending = await getPendingReports();
  const pendingReportes = pending
    .filter((p) => p.ciudadanoTelefono === telefono)
    .map(pendingToReporte);
  const serverIds = new Set(server.map((r) => r.clientRequestId).filter(Boolean));
  const onlyPending = pendingReportes.filter(
    (p) => !serverIds.has(p.clientRequestId ?? "")
  );
  return [...onlyPending, ...server.map((r) => ({ ...r, syncStatus: "synced" as const }))];
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ciudadano: null,
      reportes: [],
      historial: {},
      evaluaciones: {},
      ultimoReporteId: null,
      ultimoFolio: null,
      ultimoEsPendiente: false,
      dependenciaActiva: "Servicios Públicos",
      loading: false,
      error: null,

      registrarCiudadano: (nombre, telefono) => {
        const tel = normalizarTelefono(telefono);
        set({
          ciudadano: { nombre: nombre.trim(), telefono: tel },
        });
      },

      loginCiudadano: (telefono) => {
        const tel = normalizarTelefono(telefono);
        const { ciudadano } = get();
        if (ciudadano?.telefono === tel) return true;
        set({
          ciudadano: {
            nombre: ciudadano?.nombre ?? "Ciudadano",
            telefono: tel,
          },
        });
        return true;
      },

      logoutCiudadano: () => set({ ciudadano: null, reportes: [] }),

      setDependenciaActiva: (dependencia) => set({ dependenciaActiva: dependencia }),

      setUltimoReporte: (id, folio, esPendiente) =>
        set({ ultimoReporteId: id, ultimoFolio: folio, ultimoEsPendiente: esPendiente }),

      cargarReportesCiudadano: async () => {
        const { ciudadano } = get();
        if (!ciudadano) return;
        set({ loading: true, error: null });
        try {
          const server = await fetchReportes(ciudadano.telefono);
          const merged = await mergeWithPending(server, ciudadano.telefono);
          set({ reportes: merged, loading: false });
        } catch (e) {
          const pending = await getPendingReports();
          const onlyPending = pending
            .filter((p) => p.ciudadanoTelefono === ciudadano.telefono)
            .map(pendingToReporte);
          set({
            reportes: onlyPending,
            loading: false,
            error: e instanceof Error ? e.message : "Error de conexión",
          });
        }
      },

      cargarReportesGobierno: async () => {
        set({ loading: true, error: null });
        try {
          const reportes = await fetchAllReportes();
          set({
            reportes: reportes.filter((r) => !esFolioPendiente(r.folio)),
            loading: false,
          });
        } catch (e) {
          set({
            loading: false,
            error: e instanceof Error ? e.message : "Error al cargar",
          });
        }
      },

      cargarDetalleReporte: async (id) => {
        if (esFolioPendiente(id) || id.includes("-")) {
          const pending = await getPendingReports();
          const p = pending.find((x) => x.clientRequestId === id);
          if (p) {
            set({
              historial: {
                ...get().historial,
                [id]: [
                  {
                    estatus: "recibido",
                    fecha: new Date(p.createdAt).toLocaleString("es-MX"),
                    nota:
                      p.status === "sync_failed"
                        ? `Error: ${p.lastError ?? "Reintenta la sincronización"}`
                        : "En cola local. Se enviará al recuperar conexión.",
                  },
                ],
              },
            });
          }
          return;
        }
        try {
          const res = await fetch(`/api/reportes/${id}`);
          if (!res.ok) return;
          const data = await res.json();
          set({
            historial: { ...get().historial, [id]: data.historial },
            evaluaciones: data.evaluacion
              ? {
                  ...get().evaluaciones,
                  [id]: data.evaluacion,
                }
              : get().evaluaciones,
          });
        } catch {
          /* offline detail uses cached historial */
        }
      },

      mergeReporte: (reporte) => {
        const { reportes } = get();
        const idx = reportes.findIndex(
          (r) => r.id === reporte.id || r.clientRequestId === reporte.clientRequestId
        );
        if (idx >= 0) {
          const next = [...reportes];
          next[idx] = reporte;
          set({ reportes: next });
        } else {
          set({ reportes: [reporte, ...reportes] });
        }
      },

      asignarDependencia: async (id, dependencia, nota) => {
        const updated = await asignarDependenciaApi(id, dependencia, nota);
        const ahora = fechaLocal();
        const { reportes, historial } = get();
        const entrada: HistorialEstatus = {
          estatus: "asignado",
          fecha: ahora,
          nota: nota.trim() || `Canalizado a ${dependencia}.`,
          dependencia,
        };
        set({
          reportes: reportes.map((r) =>
            r.id === id ? { ...updated, syncStatus: "synced" } : r
          ),
          historial: { ...historial, [id]: [...(historial[id] ?? []), entrada] },
        });
      },

      actualizarEstatus: async (id, estatus, nota) => {
        const updated = await actualizarEstatusApi(id, estatus, nota);
        const ahora = fechaLocal();
        const { reportes, historial } = get();
        const reporte = reportes.find((r) => r.id === id);
        const entrada: HistorialEstatus = {
          estatus,
          fecha: ahora,
          nota: nota.trim() || `Estatus actualizado a ${estatus}.`,
          dependencia: reporte?.dependencia,
        };
        set({
          reportes: reportes.map((r) =>
            r.id === id ? { ...updated, syncStatus: "synced" } : r
          ),
          historial: { ...historial, [id]: [...(historial[id] ?? []), entrada] },
        });
      },

      evaluarReporte: async (id, estrellas, comentario) => {
        const ev = await evaluarReporteApi(id, estrellas, comentario);
        set({
          evaluaciones: {
            ...get().evaluaciones,
            [id]: ev,
          },
        });
      },

      resetDemo: () =>
        set({
          ciudadano: null,
          reportes: [],
          historial: {},
          evaluaciones: {},
          ultimoReporteId: null,
          ultimoFolio: null,
          ultimoEsPendiente: false,
        }),
    }),
    {
      name: "urbareport-session",
      partialize: (s) => ({
        ciudadano: s.ciudadano,
        dependenciaActiva: s.dependenciaActiva,
      }),
    }
  )
);

export function useReportesCiudadano() {
  const ciudadano = useAppStore((s) => s.ciudadano);
  const reportes = useAppStore((s) => s.reportes);
  if (!ciudadano) return [];
  return reportes;
}

export function useReportesDependencia() {
  const dependencia = useAppStore((s) => s.dependenciaActiva);
  const reportes = useAppStore((s) => s.reportes);
  return reportes.filter(
    (r) => r.dependencia === dependencia && r.syncStatus !== "pending_sync"
  );
}

export function useStatsGobierno() {
  const reportes = useAppStore((s) => s.reportes);
  return {
    total: reportes.length,
    sinAsignar: reportes.filter((r) => r.dependencia === "Sin asignar").length,
    enProceso: reportes.filter(
      (r) => r.estatus === "en_proceso" || r.estatus === "asignado"
    ).length,
    resueltos: reportes.filter(
      (r) => r.estatus === "resuelto" || r.estatus === "cerrado"
    ).length,
  };
}
