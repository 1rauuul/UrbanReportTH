"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import FormStepper from "@/components/ui/FormStepper";
import Badge from "@/components/ui/Badge";
import SyncBadge from "@/components/ui/SyncBadge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import SyncStatusBanner from "@/components/ui/SyncStatusBanner";
import IncidenciaIcon from "@/components/ui/IncidenciaIcon";
import { ESTATUS_LABELS, TIPOS_INCIDENCIA } from "@/lib/mock-data";
import { useAppStore } from "@/lib/store";
import { esFolioPendiente } from "@/lib/offline/folio";
import { revisionCiudadanoApi } from "@/lib/api/client";

interface Props {
  params: Promise<{ id: string }>;
}

export default function DetalleReportePage({ params }: Props) {
  const { id } = use(params);
  const reportes = useAppStore((s) => s.reportes);
  const historial = useAppStore((s) => s.historial);
  const evaluaciones = useAppStore((s) => s.evaluaciones);
  const cargarDetalleReporte = useAppStore((s) => s.cargarDetalleReporte);
  const mergeReporte = useAppStore((s) => s.mergeReporte);

  const reporte = reportes.find((r) => r.id === id);
  const timeline = historial[id] ?? [];
  const evaluacion = evaluaciones[id];
  const syncStatus = reporte?.syncStatus ?? "synced";

  const [enviandoRevision, setEnviandoRevision] = useState(false);
  const [comentario, setComentario] = useState("");
  const [revisionError, setRevisionError] = useState("");

  useEffect(() => {
    void cargarDetalleReporte(id);
  }, [id, cargarDetalleReporte]);

  if (!reporte) {
    return (
      <>
        <TopBar title="Reporte ciudadano" backHref="/mis-reportes" />
        <section className="p-8 text-center text-muted">Reporte no encontrado.</section>
      </>
    );
  }

  const tipo = TIPOS_INCIDENCIA.find((t) => t.id === reporte.tipo);

  const puedeEvaluar =
    syncStatus === "synced" &&
    reporte.estatus === "cerrado" &&
    !evaluacion &&
    !esFolioPendiente(reporte.folio);

  const pendienteRevision =
    syncStatus === "synced" &&
    reporte.estatus === "pendiente_revision_ciudadana" &&
    !esFolioPendiente(reporte.folio);

  async function enviarRevision(confirmar: boolean) {
    setEnviandoRevision(true);
    setRevisionError("");
    try {
      const updated = await revisionCiudadanoApi(id, confirmar, comentario);
      mergeReporte(updated);
      await cargarDetalleReporte(id);
    } catch (e) {
      setRevisionError(e instanceof Error ? e.message : "Error al enviar revisión.");
    } finally {
      setEnviandoRevision(false);
    }
  }

  return (
    <>
      <TopBar title="Reporte ciudadano" backHref="/mis-reportes" />
      <SyncStatusBanner />
      <FormStepper steps={["Consulta"]} activeIndex={0} />

      <section className="flex flex-col gap-4 p-4 pb-24">
        <Card variant="panel" padding="lg">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Folio</h2>
              <p className="text-xl font-semibold text-primary sm:text-2xl">{reporte.folio}</p>
              <div className="mt-2 flex items-center gap-2 text-base font-semibold">
                {tipo && (
                  <IncidenciaIcon icon={tipo.icon} className="h-5 w-5 text-muted" />
                )}
                <span>{tipo?.label}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge estatus={reporte.estatus} />
              <SyncBadge status={syncStatus} />
            </div>
          </div>

          {reporte.fotoUrl ? (
            <div className="mt-4 overflow-hidden rounded border border-input-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={reporte.fotoUrl}
                alt="Evidencia del reporte"
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
          ) : (
            <div className="mt-4 flex h-36 items-center justify-center rounded border border-dashed border-input-border bg-input-soft/50 text-sm text-muted">
              Sin evidencia fotográfica
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

          <Card variant="default" padding="md" className="mt-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
              Descripción
            </h3>
            <p className="text-sm text-text sm:text-base">{reporte.descripcion}</p>
            <p className="mt-3 text-sm text-muted">
              <span className="font-semibold text-text">Referencia:</span> {reporte.referencia}
            </p>
            <p className="mt-1 text-sm text-muted">
              <span className="font-semibold text-text">Ubicación:</span> {reporte.direccion},{" "}
              {reporte.colonia}
            </p>
            {reporte.dependencia && reporte.dependencia !== "Sin asignar" && (
              <p className="mt-1 text-sm text-muted">
                <span className="font-semibold text-text">Dependencia:</span> {reporte.dependencia}
              </p>
            )}
          </Card>

          <Card variant="default" padding="md" className="mt-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">
              Historial de estatus
            </h3>
            {timeline.length === 0 ? (
              <p className="text-sm text-muted">Sin movimientos registrados aún.</p>
            ) : (
              <ol className="flex flex-col gap-0">
                {timeline.map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={[
                          "h-3 w-3 rounded-full",
                          i === timeline.length - 1 ? "bg-primary" : "bg-border",
                        ].join(" ")}
                      />
                      {i < timeline.length - 1 && (
                        <span className="w-px flex-1 bg-border" />
                      )}
                    </div>
                    <div className="pb-5">
                      <p className="text-sm font-semibold">
                        {ESTATUS_LABELS[item.estatus] ?? item.estatus}
                      </p>
                      <p className="text-xs text-muted">{item.fecha}</p>
                      <p className="mt-1 text-sm">{item.nota}</p>
                      {item.dependencia && (
                        <p className="text-sm font-semibold text-primary">{item.dependencia}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          {/* Revisión ciudadana */}
          {pendienteRevision && (
            <Card
              variant="default"
              padding="md"
              className="mt-4 border-warning/20 bg-warning/10"
            >
              <h3 className="mb-2 text-sm font-bold text-warning">
                ¿Se resolvió el problema?
              </h3>
              <p className="mb-3 text-sm text-warning">
                La cuadrilla marcó este reporte como solucionado. Por favor confirma si el problema fue atendido.
              </p>
              <textarea
                className="mb-3 w-full rounded border border-warning/30 bg-white px-3 py-2 text-sm placeholder:text-muted/70 focus:outline-none focus:ring-1 focus:ring-warning/40"
                placeholder="Comentario opcional..."
                rows={2}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
              />
              {revisionError && (
                <p className="mb-2 text-sm font-medium text-danger">{revisionError}</p>
              )}
              <div className="flex gap-3">
                <Button
                  variant="accent"
                  className="flex-1"
                  disabled={enviandoRevision}
                  onClick={() => enviarRevision(true)}
                >
                  Sí, fue resuelto
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  disabled={enviandoRevision}
                  onClick={() => enviarRevision(false)}
                >
                  No fue resuelto
                </Button>
              </div>
            </Card>
          )}

          {evaluacion && (
            <Card variant="default" padding="md" className="mt-4 border-success/30 bg-success/5">
              <p className="text-sm font-semibold text-success">Tu evaluación</p>
              <p className="mt-1 text-xl text-warning">{"★".repeat(evaluacion.estrellas)}</p>
              {evaluacion.comentario && (
                <p className="mt-2 text-sm">{evaluacion.comentario}</p>
              )}
            </Card>
          )}

          {puedeEvaluar && (
            <Link href={`/evaluar/${reporte.id}`} className="mt-4 block">
              <Button variant="accent" fullWidth>
                Evaluar atención
              </Button>
            </Link>
          )}
        </Card>
      </section>
    </>
  );
}
