"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import Badge from "@/components/ui/Badge";
import IncidenciaIcon from "@/components/ui/IncidenciaIcon";
import SyncBadge from "@/components/ui/SyncBadge";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import SyncStatusBanner from "@/components/ui/SyncStatusBanner";
import { TIPOS_INCIDENCIA } from "@/lib/mock-data";
import { useAppStore, useReportesCiudadano } from "@/lib/store";
import { retryFailed } from "@/lib/offline/sync-queue";

type Filtro = "todos" | "activos" | "resueltos";

const filtros: { id: Filtro; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "activos", label: "Activos" },
  { id: "resueltos", label: "Resueltos" },
];

export default function MisReportesPage() {
  const router = useRouter();
  const ciudadano = useAppStore((s) => s.ciudadano);
  const reportes = useReportesCiudadano();
  const cargarReportesCiudadano = useAppStore((s) => s.cargarReportesCiudadano);
  const loading = useAppStore((s) => s.loading);
  const [filtro, setFiltro] = useState<Filtro>("todos");

  useEffect(() => {
    if (ciudadano) void cargarReportesCiudadano();
  }, [ciudadano, cargarReportesCiudadano]);

  if (!ciudadano) {
    return (
      <>
        <TopBar title="Reporte ciudadano" backHref="/login" />
        <section className="flex flex-col items-center gap-4 p-8 text-center">
          <p className="text-lg text-muted">Inicia sesión para ver tus reportes.</p>
          <Button onClick={() => router.push("/login")}>Iniciar sesión</Button>
        </section>
      </>
    );
  }

  const estatusCerrado = new Set(["cerrado", "cerrado_administrativamente"]);
  const filtrados = reportes.filter((r) => {
    if (filtro === "activos") return !estatusCerrado.has(r.estatus);
    if (filtro === "resueltos") return estatusCerrado.has(r.estatus);
    return true;
  });

  return (
    <>
      <TopBar title="Reporte ciudadano" />
      <SyncStatusBanner />
      <section className="flex flex-col gap-4 p-4">
        <Card variant="panel" padding="md">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-base font-semibold text-primary sm:text-lg">Mis reportes</h2>
            <p className="text-[10px] font-semibold uppercase leading-snug text-primary sm:text-xs">
              {ciudadano.nombre.toUpperCase()}
            </p>
          </div>

          {loading && <p className="mb-3 text-sm text-muted">Actualizando reportes...</p>}

          <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Filtros">
            {filtros.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltro(f.id)}
                className={[
                  "shrink-0 rounded-sm border px-3 py-2 text-xs font-semibold sm:text-sm",
                  filtro === f.id
                    ? "border-primary bg-primary text-white"
                    : "border-input-border bg-white text-text hover:bg-input-soft/60",
                ].join(" ")}
              >
                {f.label}
              </button>
            ))}
          </nav>

          <div className="mt-4">
            {filtrados.length === 0 ? (
              <div className="rounded border border-dashed border-input-border bg-input-soft/40 py-8 text-center">
                <p className="text-sm text-muted">No tienes reportes en esta categoría.</p>
                <Link
                  href="/nuevo-reporte"
                  className="mt-3 inline-block text-sm font-semibold text-primary underline-offset-2 hover:underline"
                >
                  Crear primer reporte
                </Link>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {filtrados.map((reporte) => {
                  const tipo = TIPOS_INCIDENCIA.find((t) => t.id === reporte.tipo);
                  const syncStatus = reporte.syncStatus ?? "synced";
                  return (
                    <li key={reporte.id}>
                      <Link href={`/mis-reportes/${reporte.id}`}>
                        <Card
                          variant="default"
                          padding="md"
                          className="transition-shadow hover:shadow-md"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex gap-3">
                              {tipo && <IncidenciaIcon icon={tipo.icon} className="h-5 w-5 text-muted" />}
                              <div>
                                <p className="font-semibold text-primary">{reporte.folio}</p>
                                <p className="text-sm font-semibold">{tipo?.label}</p>
                                <p className="text-xs text-muted">
                                  {reporte.colonia} · {reporte.fecha}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge estatus={reporte.estatus} />
                              <SyncBadge status={syncStatus} />
                            </div>
                          </div>
                          {syncStatus === "sync_failed" && reporte.clientRequestId && (
                            <button
                              type="button"
                              className="mt-2 text-xs font-semibold text-primary underline"
                              onClick={(e) => {
                                e.preventDefault();
                                void retryFailed(reporte.clientRequestId!).then(() =>
                                  cargarReportesCiudadano()
                                );
                              }}
                            >
                              Reintentar envío
                            </button>
                          )}
                        </Card>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>
      </section>
    </>
  );
}


