"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import IncidenciaIcon from "@/components/ui/IncidenciaIcon";
import { ESTATUS_LABELS, TIPOS_INCIDENCIA } from "@/lib/mock-data";
import {
  fetchAllReportes,
  asignarCuadrillaApi,
  cierreAdminApi,
  fetchJefesCuadrilla,
} from "@/lib/api/client";
import type { ReporteDTO, JefeCuadrillaDTO } from "@/lib/api/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default function DependenciaReportePage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const [reporte, setReporte] = useState<ReporteDTO | null>(null);
  const [jefes, setJefes] = useState<JefeCuadrillaDTO[]>([]);
  const [historial, setHistorial] = useState<{ estatus: string; nota: string; fecha: string; dependencia?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [jefeSel, setJefeSel] = useState("");
  const [notaAsig, setNotaAsig] = useState("");
  const [asignando, setAsignando] = useState(false);

  const [notaCierre, setNotaCierre] = useState("");
  const [cerrando, setCerrando] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    async function cargar() {
      try {
        const [reportesData, jefesData, detRes] = await Promise.all([
          fetchAllReportes(),
          fetchJefesCuadrilla(),
          fetch(`/api/reportes/${id}`).then((r) => r.json()),
        ]);
        const r = reportesData.find((x) => x.id === id) ?? null;
        setReporte(r);
        setJefes(jefesData);
        if (detRes.historial) setHistorial(detRes.historial);
        if (r?.jefeCuadrillaId) {
          setJefeSel(r.jefeCuadrillaId);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar");
      } finally {
        setLoading(false);
      }
    }
    void cargar();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-muted">Cargando...</div>;
  }

  if (!reporte) {
    return (
      <section className="p-8 text-center text-muted">
        Reporte no encontrado.{" "}
        <Link href="/dependencia/dashboard" className="text-primary">
          Volver
        </Link>
      </section>
    );
  }

  const tipo = TIPOS_INCIDENCIA.find((t) => t.id === reporte.tipo);
  const puedeAsignar =
    reporte.estatus === "asignado_a_dependencia" ||
    reporte.estatus === "reabierto_por_ciudadano";

  const puedeCerrar =
    reporte.estatus === "reabierto_por_ciudadano" ||
    reporte.estatus === "asignado_a_jefe_cuadrilla";

  async function handleAsignarJefe() {
    if (!jefeSel) {
      setError("Selecciona un jefe de cuadrilla.");
      return;
    }
    setAsignando(true);
    setError("");
    try {
      const updated = await asignarCuadrillaApi(id, jefeSel, notaAsig);
      setReporte(updated);
      setTimeout(() => router.push("/dependencia/dashboard"), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al asignar.");
    } finally {
      setAsignando(false);
    }
  }

  async function handleCierreAdmin() {
    if (!notaCierre.trim()) {
      setError("Agrega una nota de justificación.");
      return;
    }
    setCerrando(true);
    setError("");
    try {
      const updated = await cierreAdminApi(id, notaCierre);
      setReporte(updated);
      setTimeout(() => router.push("/dependencia/dashboard"), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cerrar.");
    } finally {
      setCerrando(false);
    }
  }

  return (
    <div className="p-4 md:p-8">
      <Link
        href="/dependencia/dashboard"
        className="mb-4 inline-flex items-center gap-1 text-base font-bold text-primary"
      >
        ← Volver a bandeja
      </Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-primary">{reporte.folio}</h1>
          <div className="mt-1 flex items-center gap-2 text-lg font-semibold">
            {tipo && <IncidenciaIcon icon={tipo.icon} className="h-5 w-5 text-muted" />}
            {tipo?.label}
          </div>
        </div>
        <Badge estatus={reporte.estatus} />
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Info */}
        <div className="flex flex-col gap-4">
          <Card>
            <h2 className="mb-3 text-base font-bold">Información del reporte</h2>
            <p className="text-base">{reporte.descripcion}</p>
            <p className="mt-3 text-sm text-muted">
              <span className="font-semibold">Referencia:</span> {reporte.referencia}
            </p>
            <p className="mt-1 text-sm text-muted">
              <span className="font-semibold">Ubicación:</span> {reporte.direccion},{" "}
              {reporte.colonia}
            </p>
            {reporte.fotoUrl && (
              <div className="mt-4 overflow-hidden rounded border border-input-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={reporte.fotoUrl}
                  alt="Evidencia"
                  className="h-36 w-full object-cover"
                />
              </div>
            )}
          </Card>

          {/* Historial */}
          <Card>
            <h2 className="mb-3 text-base font-bold">Historial</h2>
            {historial.length === 0 ? (
              <p className="text-sm text-muted">Sin movimientos.</p>
            ) : (
              <ol className="flex flex-col gap-1">
                {historial.map((item, i) => (
                  <li key={i} className="border-l-2 border-border pl-3 pb-2">
                    <p className="text-sm font-semibold">
                      {ESTATUS_LABELS[item.estatus as keyof typeof ESTATUS_LABELS] ?? item.estatus}
                    </p>
                    <p className="text-xs text-muted">{item.fecha}</p>
                    <p className="mt-0.5 text-sm">{item.nota}</p>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-4">
          {puedeAsignar && (
            <Card>
              <h2 className="mb-3 text-base font-bold">
                {reporte.estatus === "reabierto_por_ciudadano"
                  ? "Reasignar a cuadrilla"
                  : "Asignar a jefe de cuadrilla"}
              </h2>
              {reporte.estatus === "reabierto_por_ciudadano" && (
                <div className="mb-3 rounded bg-primary/10 p-3 text-sm text-primary">
                  El ciudadano indicó que el problema no fue resuelto. Asigna nuevamente para revisión.
                </div>
              )}
              {jefes.length === 0 ? (
                <p className="text-sm text-muted">No hay jefes de cuadrilla disponibles.</p>
              ) : (
                <>
                  <label className="mb-1 block text-sm font-semibold">
                    Jefe de cuadrilla
                  </label>
                  <select
                    className="mb-4 min-h-12 w-full rounded-lg border-2 border-border bg-white px-4 text-base font-semibold"
                    value={jefeSel}
                    onChange={(e) => setJefeSel(e.target.value)}
                  >
                    <option value="">— Seleccionar —</option>
                    {jefes.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.nombre}
                      </option>
                    ))}
                  </select>
                  <label className="mb-1 block text-sm font-semibold">Nota (opcional)</label>
                  <textarea
                    className="mb-4 min-h-20 w-full rounded-lg border-2 border-border p-3 text-sm"
                    placeholder="Instrucciones para el jefe de cuadrilla..."
                    value={notaAsig}
                    onChange={(e) => setNotaAsig(e.target.value)}
                  />
                  <Button fullWidth onClick={handleAsignarJefe} disabled={asignando}>
                    {asignando ? "Asignando…" : "Confirmar asignación"}
                  </Button>
                </>
              )}
            </Card>
          )}

          {puedeCerrar && (
            <Card>
              <h2 className="mb-3 text-base font-bold">Cierre administrativo</h2>
              <p className="mb-3 text-sm text-muted">
                Cierra este ticket con una justificación sin pasar por el flujo de cuadrilla.
              </p>
              <textarea
                className="mb-4 min-h-20 w-full rounded-lg border-2 border-border p-3 text-sm"
                placeholder="Motivo del cierre administrativo..."
                value={notaCierre}
                onChange={(e) => setNotaCierre(e.target.value)}
              />
              <Button
                variant="secondary"
                fullWidth
                onClick={handleCierreAdmin}
                disabled={cerrando}
              >
                {cerrando ? "Cerrando…" : "Cerrar administrativamente"}
              </Button>
            </Card>
          )}

          {!puedeAsignar && !puedeCerrar && (
            <Card>
              <p className="text-sm text-muted">
                Este reporte está en estatus{" "}
                <span className="font-semibold">
                  {ESTATUS_LABELS[reporte.estatus] ?? reporte.estatus}
                </span>
                . No hay acciones disponibles en este momento.
              </p>
            </Card>
          )}

          {error && (
            <p className="text-sm font-medium text-danger">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
