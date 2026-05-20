"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import IncidenciaIcon from "@/components/ui/IncidenciaIcon";
import {
  TIPOS_INCIDENCIA,
  ESTATUS_LABELS,
  DEPENDENCIAS,
  type EstatusReporte,
  type TipoIncidencia,
} from "@/lib/mock-data";
import { useAppStore, useStatsGobierno } from "@/lib/store";
import { computeStats, type ReporteStats } from "@/lib/api/insights";

function exportarCSV(data: Record<string, string>[], nombre: string) {
  const headers = Object.keys(data[0] ?? {});
  const rows = data.map((r) =>
    headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  descargarBlob(blob, `${nombre}.csv`);
}

async function exportarExcel(data: Record<string, string>[], nombre: string) {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Reportes");
  XLSX.writeFile(wb, `${nombre}.xlsx`);
}

async function exportarPDF(
  data: Record<string, string>[],
  nombre: string,
  titulo: string
) {
  const [jsPDFModule, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const { jsPDF } = jsPDFModule as unknown as {
    jsPDF: new (opts?: Record<string, unknown>) => {
      autoTable: (opts: Record<string, unknown>) => void;
      save: (n: string) => void;
      text: (t: string, x: number, y: number) => void;
    };
  };

  const doc = new jsPDF({ orientation: "landscape" });
  doc.text(titulo, 14, 12);

  const headers = Object.keys(data[0] ?? {});
  const rows = data.map((r) => headers.map((h) => String(r[h] ?? "")));

  (autoTableModule as unknown as { default: (doc: unknown, opts: Record<string, unknown>) => void }).default(doc, {
    head: [headers],
    body: rows,
    startY: 18,
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [155, 34, 71] },
    margin: { top: 18 },
  });

  doc.save(`${nombre}.pdf`);
}

function descargarBlob(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

function toExportRow(r: {
  folio: string;
  tipo: string;
  colonia: string;
  fecha: string;
  estatus: string;
  dependencia: string;
  ciudadano?: string;
}) {
  const tipoLabel = TIPOS_INCIDENCIA.find((t) => t.id === r.tipo)?.label ?? r.tipo;
  return {
    Folio: r.folio,
    Tipo: tipoLabel,
    Colonia: r.colonia,
    Fecha: r.fecha,
    Estatus: ESTATUS_LABELS[r.estatus as EstatusReporte] ?? r.estatus,
    Dependencia: r.dependencia,
    Ciudadano: r.ciudadano ?? "",
  };
}

export default function GobiernoDashboardPage() {
  const reportes = useAppStore((s) => s.reportes);
  const cargarReportesGobierno = useAppStore((s) => s.cargarReportesGobierno);
  const stats = useStatsGobierno();
  const [tab, setTab] = useState<"bandeja" | "reabiertos" | "insights">("bandeja");
  const loading = useAppStore((s) => s.loading);

  const [statsInsights, setStatsInsights] = useState<ReporteStats | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const [filtros, setFiltros] = useState({
    tipo: "" as TipoIncidencia | "",
    colonia: "",
    fechaDesde: "",
    fechaHasta: "",
    estatus: "" as EstatusReporte | "",
    dependencia: "",
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    void cargarReportesGobierno();
  }, [cargarReportesGobierno]);

  const reabiertos = reportes.filter(
    (r) => r.estatus === "reabierto_por_ciudadano"
  );

  const listaBase = tab === "bandeja" ? reportes : reabiertos;

  const filtrados = useMemo(() => {
    return listaBase.filter((r) => {
      if (filtros.tipo && r.tipo !== filtros.tipo) return false;
      if (
        filtros.colonia &&
        !r.colonia.toLowerCase().includes(filtros.colonia.toLowerCase())
      )
        return false;
      if (filtros.estatus && r.estatus !== filtros.estatus) return false;
      if (filtros.dependencia && r.dependencia !== filtros.dependencia)
        return false;
      if (filtros.fechaDesde && r.fecha < filtros.fechaDesde) return false;
      if (filtros.fechaHasta && r.fecha > filtros.fechaHasta) return false;
      return true;
    });
  }, [listaBase, filtros]);

  const coloniasUnicas = useMemo(() => {
    const s = new Set(reportes.map((r) => r.colonia).filter(Boolean));
    return Array.from(s).sort();
  }, [reportes]);

  const filtrosActivos = Object.values(filtros).filter(Boolean).length;

  const statCards = [
    { label: "Total", value: String(stats.total), color: "text-primary" },
    { label: "Pendientes", value: String(stats.pendientes), color: "text-warning" },
    { label: "En proceso", value: String(stats.enProceso), color: "text-primary" },
    { label: "Resueltos", value: String(stats.resueltos), color: "text-success" },
    { label: "Reabiertos", value: String(stats.pendienteRevision), color: "text-primary" },
  ];

  async function handleExportar(formato: "csv" | "excel" | "pdf") {
    if (filtrados.length === 0) return;
    setExportando(true);
    const rows = filtrados.map(toExportRow);
    const ts = new Date().toISOString().slice(0, 10);
    const nombre = `reportes_tehuacan_${ts}`;
    try {
      if (formato === "csv") exportarCSV(rows, nombre);
      else if (formato === "excel") await exportarExcel(rows, nombre);
      else await exportarPDF(rows, nombre, "Reportes — Tehuacán");
    } finally {
      setExportando(false);
    }
  }

  async function handleGenerarInsights() {
    setAiLoading(true);
    setAiError("");
    setAiSummary(null);
    try {
      const statsLocal = computeStats(reportes);
      setStatsInsights(statsLocal);
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportes }),
      });
      const data = (await res.json()) as { stats?: ReporteStats; summary?: string | null; error?: string };
      if (data.stats) setStatsInsights(data.stats);
      if (data.summary) setAiSummary(data.summary);
      if (data.error) setAiError(data.error);
    } catch {
      setAiError("Error al generar insights.");
    } finally {
      setAiLoading(false);
    }
  }

  function limpiarFiltros() {
    setFiltros({
      tipo: "",
      colonia: "",
      fechaDesde: "",
      fechaHasta: "",
      estatus: "",
      dependencia: "",
    });
  }

  async function handleLogout() {
    await fetch("/api/auth/logout-staff", { method: "POST" });
    window.location.href = "/staff/login";
  }

  return (
    <div className="p-4 md:p-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text md:text-3xl">Mesa de Control</h1>
          <p className="text-base text-muted">Tehuacán · Vista centralizada de reportes</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => void cargarReportesGobierno()} disabled={loading}>
            {loading ? "Cargando…" : "Actualizar"}
          </Button>
          <Button variant="ghost" onClick={handleLogout}>
            Cerrar sesión
          </Button>
        </div>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {statCards.map((s) => (
          <Card key={s.label} padding="sm">
            <p className="text-sm font-semibold text-muted">{s.label}</p>
            <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      <nav className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("bandeja")}
          className={[
            "rounded-lg px-4 py-2 text-sm font-bold",
            tab === "bandeja" ? "bg-primary text-white" : "border border-border bg-white text-text",
          ].join(" ")}
        >
          Todos los reportes
        </button>
        <button
          type="button"
          onClick={() => setTab("reabiertos")}
          className={[
            "rounded-lg px-4 py-2 text-sm font-bold",
            tab === "reabiertos" ? "bg-primary text-white" : "border border-border bg-white text-text",
          ].join(" ")}
        >
          Reabiertos por ciudadano
          {reabiertos.length > 0 && (
            <span className="ml-2 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
              {reabiertos.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("insights")}
          className={[
            "rounded-lg px-4 py-2 text-sm font-bold",
            tab === "insights" ? "bg-primary text-white" : "border border-border bg-white text-text",
          ].join(" ")}
        >
          Insights IA
        </button>
      </nav>

      {tab !== "insights" && (
      <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          onClick={() => setMostrarFiltros((v) => !v)}
        >
          {mostrarFiltros ? "Ocultar filtros" : "Filtros"}
          {filtrosActivos > 0 && (
            <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-xs text-white">
              {filtrosActivos}
            </span>
          )}
        </Button>

        {filtrosActivos > 0 && (
          <Button variant="ghost" onClick={limpiarFiltros}>
            Limpiar
          </Button>
        )}

        <span className="ml-auto text-xs text-muted">
          {filtrados.length} de {listaBase.length} reportes
        </span>
      </div>

      {mostrarFiltros && (
        <Card padding="md" className="mb-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted">Tipo</span>
              <select
                value={filtros.tipo}
                onChange={(e) =>
                  setFiltros((f) => ({ ...f, tipo: e.target.value as TipoIncidencia | "" }))
                }
                className="rounded border border-input-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">Todos</option>
                {TIPOS_INCIDENCIA.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted">Colonia</span>
              <Input
                placeholder="Buscar colonia..."
                value={filtros.colonia}
                onChange={(e) => setFiltros((f) => ({ ...f, colonia: e.target.value }))}
                list="colonias-list"
              />
              <datalist id="colonias-list">
                {coloniasUnicas.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted">Estatus</span>
              <select
                value={filtros.estatus}
                onChange={(e) =>
                  setFiltros((f) => ({ ...f, estatus: e.target.value as EstatusReporte | "" }))
                }
                className="rounded border border-input-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">Todos</option>
                {Object.entries(ESTATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted">Dependencia</span>
              <select
                value={filtros.dependencia}
                onChange={(e) =>
                  setFiltros((f) => ({ ...f, dependencia: e.target.value }))
                }
                className="rounded border border-input-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">Todas</option>
                {DEPENDENCIAS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted">Fecha desde</span>
              <input
                type="date"
                value={filtros.fechaDesde}
                onChange={(e) =>
                  setFiltros((f) => ({ ...f, fechaDesde: e.target.value }))
                }
                className="rounded border border-input-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted">Fecha hasta</span>
              <input
                type="date"
                value={filtros.fechaHasta}
                onChange={(e) =>
                  setFiltros((f) => ({ ...f, fechaHasta: e.target.value }))
                }
                className="rounded border border-input-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </label>
          </div>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          disabled={filtrados.length === 0 || exportando}
          onClick={() => handleExportar("csv")}
        >
          Exportar CSV
        </Button>
        <Button
          variant="secondary"
          disabled={filtrados.length === 0 || exportando}
          onClick={() => handleExportar("excel")}
        >
          Exportar Excel
        </Button>
        <Button
          variant="secondary"
          disabled={filtrados.length === 0 || exportando}
          onClick={() => handleExportar("pdf")}
        >
          Exportar PDF
        </Button>
        </div>
      </>
      )}

      {tab !== "insights" && (
      <Card padding="sm" className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="px-3 py-3 font-bold">Folio</th>
              <th className="px-3 py-3 font-bold">Tipo</th>
              <th className="px-3 py-3 font-bold">Colonia</th>
              <th className="px-3 py-3 font-bold">Fecha</th>
              <th className="px-3 py-3 font-bold">Estatus</th>
              <th className="px-3 py-3 font-bold">Dependencia</th>
              <th className="px-3 py-3 font-bold">Ver</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((r) => {
              const tipo = TIPOS_INCIDENCIA.find((t) => t.id === r.tipo);
              return (
                <tr key={r.id} className="border-b border-border/60 hover:bg-muted/10">
                  <td className="px-3 py-3 font-bold text-primary">{r.folio}</td>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-1.5">
                      {tipo && (
                        <IncidenciaIcon icon={tipo.icon} className="h-4 w-4 text-muted" />
                      )}
                      {tipo?.label}
                    </span>
                  </td>
                  <td className="px-3 py-3">{r.colonia}</td>
                  <td className="px-3 py-3">{r.fecha}</td>
                  <td className="px-3 py-3">
                    <Badge estatus={r.estatus} />
                  </td>
                  <td className="px-3 py-3">{r.dependencia}</td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/gobierno/reportes/${r.id}`}
                      className="font-bold text-primary hover:underline"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              );
            })}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted">
                  {listaBase.length === 0
                    ? "No hay reportes en esta vista."
                    : "No hay reportes que coincidan con los filtros."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
      )}

      {tab === "insights" && (
        <div className="flex flex-col gap-4">
          <Card padding="lg">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-primary">
                  Inteligencia de Negocios
                </h2>
                <p className="text-sm text-muted">
                  Analisis estadistico sobre {reportes.length} reportes
                </p>
              </div>
              <Button
                variant="accent"
                disabled={aiLoading}
                onClick={handleGenerarInsights}
              >
                {aiLoading ? "Analizando..." : statsInsights ? "Re-analizar" : "Generar analisis IA"}
              </Button>
            </div>
          </Card>

          {!statsInsights && !aiLoading && (
            <Card padding="md">
              <p className="text-center text-muted">
                Presiona "Generar analisis IA" para ver estadisticas e insights sobre los reportes.
              </p>
            </Card>
          )}

          {statsInsights && (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Card padding="sm">
                  <p className="text-xs font-semibold text-muted">Total reportes</p>
                  <p className="text-2xl font-extrabold text-primary">{statsInsights.total}</p>
                </Card>
                <Card padding="sm">
                  <p className="text-xs font-semibold text-muted">Tipo mas frecuente</p>
                  <p className="text-lg font-bold text-text">{statsInsights.tipoMasFrecuente}</p>
                </Card>
                <Card padding="sm">
                  <p className="text-xs font-semibold text-muted">Colonia mas problematica</p>
                  <p className="text-lg font-bold text-text">{statsInsights.coloniaMasProblematica}</p>
                </Card>
                <Card padding="sm">
                  <p className="text-xs font-semibold text-muted">Tasa de reapertura</p>
                  <p className="text-2xl font-extrabold text-warning">{statsInsights.tasaReapertura}%</p>
                </Card>
              </div>

              {aiSummary && (
                <Card padding="md" className="border-success/30 bg-success/5">
                  <h3 className="mb-2 text-base font-bold text-success">Resumen IA</h3>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-text">{aiSummary}</p>
                </Card>
              )}
              {aiError && !aiSummary && (
                <Card padding="md" className="border-warning/30 bg-warning/5">
                  <p className="text-sm text-warning">{aiError}</p>
                </Card>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <Card padding="md">
                  <h3 className="mb-3 text-sm font-bold text-primary">
                    Distribucion por tipo
                  </h3>
                  <div className="flex flex-col gap-2">
                    {statsInsights.porTipo.map((t) => (
                      <div key={t.tipo} className="flex items-center gap-2">
                        <span className="w-24 shrink-0 text-xs text-text">{t.label}</span>
                        <div className="h-5 flex-1 rounded bg-input-soft">
                          <div
                            className="h-full rounded bg-primary"
                            style={{
                              width: `${Math.min(100, (t.count / Math.max(1, statsInsights.total)) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="w-8 text-right text-xs font-bold text-muted">{t.count}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card padding="md">
                  <h3 className="mb-3 text-sm font-bold text-primary">
                    Top colonias problematicas
                  </h3>
                  <div className="flex flex-col gap-2">
                    {statsInsights.porColonia.slice(0, 8).map((c) => (
                      <div key={c.colonia} className="flex items-center gap-2">
                        <span className="w-24 shrink-0 truncate text-xs text-text" title={c.colonia}>
                          {c.colonia}
                        </span>
                        <div className="h-5 flex-1 rounded bg-input-soft">
                          <div
                            className="h-full rounded bg-primary"
                            style={{
                              width: `${Math.min(100, (c.count / Math.max(1, statsInsights.porColonia[0]?.count ?? 1)) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="w-8 text-right text-xs font-bold text-muted">{c.count}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card padding="md">
                  <h3 className="mb-3 text-sm font-bold text-primary">
                    Carga por dependencia
                  </h3>
                  <div className="flex flex-col gap-2">
                    {statsInsights.porDependencia.map((d) => (
                      <div key={d.dependencia} className="flex items-center gap-2">
                        <span className="w-32 shrink-0 truncate text-xs text-text" title={d.dependencia}>
                          {d.dependencia}
                        </span>
                        <div className="h-5 flex-1 rounded bg-input-soft">
                          <div
                            className="h-full rounded bg-primary"
                            style={{
                              width: `${Math.min(100, (d.count / Math.max(1, statsInsights.porDependencia[0]?.count ?? 1)) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="w-8 text-right text-xs font-bold text-muted">{d.count}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card padding="md">
                  <h3 className="mb-3 text-sm font-bold text-primary">
                    Tendencia 30 dias
                  </h3>
                  <div className="flex items-end gap-px" style={{ height: 100 }}>
                    {statsInsights.tendencia30Dias.map((d) => {
                      const maxCount = Math.max(1, ...statsInsights.tendencia30Dias.map((x) => x.count));
                      const h = Math.max(2, (d.count / maxCount) * 100);
                      return (
                        <div
                          key={d.fecha}
                          className="flex-1 rounded-sm bg-primary/70"
                          style={{ height: `${h}%` }}
                          title={`${d.fecha.slice(5)}: ${d.count}`}
                        />
                      );
                    })}
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-muted">
                    <span>30 dias atras</span>
                    <span>Hoy</span>
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
}
