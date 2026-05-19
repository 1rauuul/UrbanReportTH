"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import IncidenciaIcon from "@/components/ui/IncidenciaIcon";
import { ESTATUS_LABELS, TIPOS_INCIDENCIA } from "@/lib/mock-data";
import { useAppStore } from "@/lib/store";
import { cierreAdminApi } from "@/lib/api/client";
import { useState } from "react";

interface Props {
  params: Promise<{ id: string }>;
}

export default function GobiernoReporteDetallePage({ params }: Props) {
  const { id } = use(params);
  const reportes = useAppStore((s) => s.reportes);
  const historial = useAppStore((s) => s.historial);
  const cargarDetalleReporte = useAppStore((s) => s.cargarDetalleReporte);
  const mergeReporte = useAppStore((s) => s.mergeReporte);

  const reporte = reportes.find((r) => r.id === id);
  const timeline = historial[id] ?? [];

  const [nota, setNota] = useState("");
  const [cerrando, setCerrando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void cargarDetalleReporte(id);
  }, [id, cargarDetalleReporte]);

  if (!reporte) {
    return (
      <div className="p-8 text-center text-muted">
        Reporte no encontrado.{" "}
        <Link href="/gobierno/dashboard" className="text-primary">
          Volver
        </Link>
      </div>
    );
  }

  const tipo = TIPOS_INCIDENCIA.find((t) => t.id === reporte.tipo);
  const puedeAdmin =
    reporte.estatus === "reabierto_por_ciudadano" ||
    reporte.estatus === "asignado_a_dependencia";

  async function handleCierreAdmin() {
    if (!nota.trim()) {
      setError("Agrega una nota de justificación.");
      return;
    }
    setCerrando(true);
    setError("");
    try {
      const updated = await cierreAdminApi(id, nota);
      mergeReporte(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cerrar.");
    } finally {
      setCerrando(false);
    }
  }

  return (
    <div className="p-4 md:p-8">
      <Link
        href="/gobierno/dashboard"
        className="mb-4 inline-flex items-center gap-1 text-base font-bold text-primary"
      >
        ← Volver a bandeja
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
        <Card>
          <h2 className="mb-3 text-base font-bold">Detalle del reporte</h2>
          <p className="text-base">{reporte.descripcion}</p>
          <dl className="mt-4 space-y-2 text-sm">
            <div>
              <dt className="font-semibold text-muted">Ciudadano</dt>
              <dd>{reporte.ciudadano}</dd>
            </div>
            <div>
              <dt className="font-semibold text-muted">Dirección</dt>
              <dd>{reporte.direccion}</dd>
            </div>
            <div>
              <dt className="font-semibold text-muted">Referencia</dt>
              <dd>{reporte.referencia}</dd>
            </div>
            <div>
              <dt className="font-semibold text-muted">Dependencia asignada</dt>
              <dd className="font-semibold text-primary">{reporte.dependencia}</dd>
            </div>
            <div>
              <dt className="font-semibold text-muted">Fecha</dt>
              <dd>{reporte.fecha}</dd>
            </div>
          </dl>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <h2 className="mb-3 text-base font-bold">Historial de estatus</h2>
            {timeline.length === 0 ? (
              <p className="text-sm text-muted">Sin movimientos aún.</p>
            ) : (
              <ol className="flex flex-col gap-1">
                {timeline.map((item, i) => (
                  <li key={i} className="border-l-2 border-border pl-3">
                    <p className="text-sm font-semibold">
                      {ESTATUS_LABELS[item.estatus] ?? item.estatus}
                    </p>
                    <p className="text-xs text-muted">{item.fecha}</p>
                    <p className="mt-0.5 text-sm">{item.nota}</p>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          {puedeAdmin && (
            <Card>
              <h2 className="mb-3 text-base font-bold">Cierre administrativo</h2>
              <p className="mb-3 text-sm text-muted">
                Mesa de control puede cerrar este reporte administrativamente con una justificación.
              </p>
              <textarea
                className="mb-3 min-h-20 w-full rounded border border-border p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                placeholder="Motivo del cierre administrativo..."
                value={nota}
                onChange={(e) => setNota(e.target.value)}
              />
              {error && <p className="mb-2 text-sm text-danger">{error}</p>}
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
        </div>
      </div>
    </div>
  );
}
