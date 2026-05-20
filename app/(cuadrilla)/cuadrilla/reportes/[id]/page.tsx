"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import IncidenciaIcon from "@/components/ui/IncidenciaIcon";
import PhotoUpload from "@/components/ui/PhotoUpload";
import { ESTATUS_LABELS, TIPOS_INCIDENCIA } from "@/lib/mock-data";
import { fetchAllReportes, avanceCuadrillaApi } from "@/lib/api/client";
import type { ReporteDTO } from "@/lib/api/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default function CuadrillaReportePage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const [reporte, setReporte] = useState<ReporteDTO | null>(null);
  const [historial, setHistorial] = useState<{ estatus: string; nota: string; fecha: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [nota, setNota] = useState("");
  const [fotoAvance, setFotoAvance] = useState<Blob | null>(null);
  const [fotoAvancePreview, setFotoAvancePreview] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargar() {
      try {
        const [meRes, reportesData, detRes] = await Promise.all([
          fetch("/api/auth/staff-me"),
          fetchAllReportes(),
          fetch(`/api/reportes/${id}`).then((r) => r.json()),
        ]);
        const me = await meRes.json();
        if (!meRes.ok || me.rol !== "JEFE_CUADRILLA") {
          setError(
            "Debes iniciar sesión como jefe de cuadrilla (no como dependencia ni mesa de control)."
          );
          return;
        }
        const r = reportesData.find((x) => x.id === id) ?? null;
        if (!r) {
          setError("Este reporte no está asignado a tu cuadrilla.");
          return;
        }
        setReporte(r);
        if (detRes.historial) setHistorial(detRes.historial);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar");
      } finally {
        setLoading(false);
      }
    }
    void cargar();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-muted">Cargando...</div>;

  if (!reporte) {
    return (
      <div className="p-8 text-center text-muted">
        {error || "Reporte no encontrado."}{" "}
        <Link href="/cuadrilla/dashboard" className="text-primary">
          Volver
        </Link>
        {error && (
          <p className="mt-4">
            <Link href="/staff/login?from=cuadrilla" className="font-bold text-primary underline">
              Ir al login de cuadrilla
            </Link>
          </p>
        )}
      </div>
    );
  }

  const tipo = TIPOS_INCIDENCIA.find((t) => t.id === reporte.tipo);
  const puedeIniciar = reporte.estatus === "asignado_a_jefe_cuadrilla";
  const puedeSolver = reporte.estatus === "en_proceso";

  async function cambiarEstatus(nuevoEstatus: "en_proceso" | "solucionado_por_cuadrilla") {
    setGuardando(true);
    setError("");
    try {
      const updated = await avanceCuadrillaApi(id, nuevoEstatus, nota, fotoAvance);
      setReporte(updated);
      if (nuevoEstatus === "solucionado_por_cuadrilla") {
        setTimeout(() => router.push("/cuadrilla/dashboard"), 1200);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al actualizar.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="p-4 md:p-8">
      <Link
        href="/cuadrilla/dashboard"
        className="mb-4 inline-flex items-center gap-1 text-base font-bold text-primary"
      >
        ← Volver
      </Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-primary">{reporte.folio}</h1>
          <div className="mt-1 flex items-center gap-2 text-lg font-semibold">
            {tipo && <IncidenciaIcon icon={tipo.icon} className="h-5 w-5 text-muted" />}
            {tipo?.label} · {reporte.colonia}
          </div>
        </div>
        <Badge estatus={reporte.estatus} />
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Card>
            <h2 className="mb-3 text-base font-bold">Descripción</h2>
            <p>{reporte.descripcion}</p>
            <p className="mt-3 text-sm text-muted">
              <span className="font-semibold">Referencia:</span> {reporte.referencia}
            </p>
            <p className="mt-1 text-sm text-muted">
              <span className="font-semibold">Dirección:</span> {reporte.direccion},{" "}
              {reporte.colonia}
            </p>
            {reporte.fotoUrl && (
              <div className="mt-4 overflow-hidden rounded border border-input-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={reporte.fotoUrl}
                  alt="Evidencia ciudadano"
                  className="h-36 w-full object-cover"
                />
                {reporte.fotoVerificacion && (
                  <div
                    className={[
                      "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold",
                      reporte.fotoVerificacion === "verificada"
                        ? "bg-success/10 text-success"
                        : reporte.fotoVerificacion === "con_dudas"
                          ? "bg-yellow-50 text-yellow-700"
                          : "bg-danger/10 text-danger",
                    ].join(" ")}
                  >
                    {reporte.fotoVerificacion === "verificada" && "IA: Imagen verificada"}
                    {reporte.fotoVerificacion === "con_dudas" && "IA: Imagen con dudas"}
                    {reporte.fotoVerificacion === "no_corresponde" && "IA: No corresponde al tipo de reporte"}
                  </div>
                )}
              </div>
            )}
            {reporte.fotoAvance && (
              <div className="mt-4 overflow-hidden rounded border border-input-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={reporte.fotoAvance}
                  alt="Evidencia de avance"
                  className="h-36 w-full object-cover"
                />
                <div className="flex items-center gap-1.5 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
                  Foto de avance (cuadrilla)
                </div>
              </div>
            )}
          </Card>

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

        <div>
          <Card>
            <h2 className="mb-3 text-base font-bold">Actualizar avance</h2>
            {!puedeIniciar && !puedeSolver && (
              <p className="text-sm text-muted">
                Estatus actual:{" "}
                <span className="font-semibold">
                  {ESTATUS_LABELS[reporte.estatus] ?? reporte.estatus}
                </span>
                . Sin acciones disponibles.
              </p>
            )}
            {(puedeIniciar || puedeSolver) && (
              <>
                <label className="mb-1 block text-sm font-semibold">
                  Nota de avance (opcional)
                </label>
                <textarea
                  className="mb-4 min-h-24 w-full rounded-lg border-2 border-border p-3 text-sm"
                  placeholder="Describe el avance o la acción realizada..."
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                />
                <PhotoUpload
                  value={fotoAvance}
                  previewUrl={fotoAvancePreview}
                  onChange={(blob, preview) => {
                    setFotoAvance(blob);
                    setFotoAvancePreview(preview);
                  }}
                />
                {error && <p className="mb-2 text-sm text-danger">{error}</p>}
                <div className="flex flex-col gap-3">
                  {puedeIniciar && (
                    <Button
                      fullWidth
                      onClick={() => cambiarEstatus("en_proceso")}
                      disabled={guardando}
                    >
                      Iniciar atención (En proceso)
                    </Button>
                  )}
                  {puedeSolver && (
                    <Button
                      variant="accent"
                      fullWidth
                      onClick={() => cambiarEstatus("solucionado_por_cuadrilla")}
                      disabled={guardando}
                    >
                      {guardando ? "Guardando…" : "Marcar como solucionado"}
                    </Button>
                  )}
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
