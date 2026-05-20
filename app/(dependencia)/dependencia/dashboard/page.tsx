"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import IncidenciaIcon from "@/components/ui/IncidenciaIcon";
import { ESTATUS_LABELS, TIPOS_INCIDENCIA } from "@/lib/mock-data";
import { fetchAllReportes } from "@/lib/api/client";
import type { ReporteDTO } from "@/lib/api/types";

interface StaffInfo {
  nombre: string;
  dependenciaNombre: string;
  dependenciaId: string;
}

const TIPOS_OBRA_PUBLICA = TIPOS_INCIDENCIA.filter(
  (t) => t.id === "bache" || t.id === "alumbrado"
);

function descargarBlob(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

function exportarCsv(
  filtrados: ReporteDTO[],
  dependenciaNombre: string
) {
  const headers = ["Folio", "Tipo", "Colonia", "Fecha", "Estatus", "Referencia"];
  const rows = filtrados.map((r) =>
    [
      r.folio,
      r.tipo,
      r.colonia,
      r.fecha,
      ESTATUS_LABELS[r.estatus] ?? r.estatus,
      `"${r.referencia.replace(/"/g, '""')}"`,
    ].join(",")
  );
  const csv = ["\uFEFF" + headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  descargarBlob(
    blob,
    `reportes-${dependenciaNombre.replace(/\s+/g, "-")}.csv`
  );
}

async function exportarExcel(
  filtrados: ReporteDTO[],
  dependenciaNombre: string
) {
  const XLSX = await import("xlsx");
  const data = filtrados.map((r) => ({
    Folio: r.folio,
    Tipo: TIPOS_INCIDENCIA.find((t) => t.id === r.tipo)?.label ?? r.tipo,
    Colonia: r.colonia,
    Fecha: r.fecha,
    Estatus: ESTATUS_LABELS[r.estatus] ?? r.estatus,
    Referencia: r.referencia,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Reportes");
  XLSX.writeFile(wb, `reportes-${dependenciaNombre.replace(/\s+/g, "-")}.xlsx`);
}

async function exportarPdf(
  filtrados: ReporteDTO[],
  dependenciaNombre: string
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
  doc.text(`Reportes — ${dependenciaNombre}`, 14, 12);

  const headers = ["Folio", "Tipo", "Colonia", "Fecha", "Estatus", "Referencia"];
  const rows = filtrados.map((r) => [
    r.folio,
    TIPOS_INCIDENCIA.find((t) => t.id === r.tipo)?.label ?? r.tipo,
    r.colonia,
    r.fecha,
    ESTATUS_LABELS[r.estatus] ?? r.estatus,
    r.referencia,
  ]);

  (autoTableModule as unknown as { default: (doc: unknown, opts: Record<string, unknown>) => void }).default(doc, {
    head: [headers],
    body: rows,
    startY: 18,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [155, 34, 71] },
    margin: { top: 18 },
  });

  doc.save(`reportes-${dependenciaNombre.replace(/\s+/g, "-")}.pdf`);
}

export default function DependenciaDashboardPage() {
  const [staff, setStaff] = useState<StaffInfo | null>(null);
  const [reportes, setReportes] = useState<ReporteDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportando, setExportando] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [coloniaFiltro, setColoniaFiltro] = useState("");
  const [estatusFiltro, setEstatusFiltro] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  useEffect(() => {
    async function cargar() {
      try {
        const [meRes, reportesData] = await Promise.all([
          fetch("/api/auth/staff-me").then((r) => r.json()),
          fetchAllReportes(),
        ]);
        setStaff({
          nombre: meRes.nombre,
          dependenciaNombre: meRes.dependenciaNombre,
          dependenciaId: meRes.dependenciaId,
        });
        setReportes(reportesData);
      } catch {
        // error de auth — middleware ya redirigira
      } finally {
        setLoading(false);
      }
    }
    void cargar();
  }, []);

  const esObraPublica = staff?.dependenciaNombre === "Obra Pública";

  const colonias = useMemo(
    () => [...new Set(reportes.map((r) => r.colonia))],
    [reportes]
  );

  const filtrados = reportes.filter((r) => {
    const q = busqueda.toLowerCase();
    const matchQ =
      !q || r.folio.toLowerCase().includes(q) || r.referencia.toLowerCase().includes(q);
    const matchColonia = !coloniaFiltro || r.colonia === coloniaFiltro;
    const matchEstatus = !estatusFiltro || r.estatus === estatusFiltro;
    const matchTipo = !tipoFiltro || r.tipo === tipoFiltro;
    const matchFechaDesde = !fechaDesde || r.fecha >= fechaDesde;
    const matchFechaHasta = !fechaHasta || r.fecha <= fechaHasta;
    return matchQ && matchColonia && matchEstatus && matchTipo && matchFechaDesde && matchFechaHasta;
  });

  const reabiertos = reportes.filter((r) => r.estatus === "reabierto_por_ciudadano").length;

  async function handleExportar(formato: "csv" | "excel" | "pdf") {
    if (filtrados.length === 0) return;
    setExportando(true);
    const nombre = staff?.dependenciaNombre ?? "dependencia";
    try {
      if (formato === "csv") exportarCsv(filtrados, nombre);
      else if (formato === "excel") await exportarExcel(filtrados, nombre);
      else await exportarPdf(filtrados, nombre);
    } finally {
      setExportando(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout-staff", { method: "POST" });
    window.location.href = "/staff/login";
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted">
        Cargando...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold">{staff?.dependenciaNombre}</h2>
          <p className="text-base text-muted">
            {filtrados.length} de {reportes.length} reportes
            {reabiertos > 0 && (
              <span className="ml-2 font-semibold text-primary">
                · {reabiertos} reabiertos
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
          <Button variant="ghost" onClick={handleLogout}>
            Cerrar sesion
          </Button>
        </div>
      </header>

      <Card className="mb-4" padding="sm">
        <div className="flex flex-wrap gap-3">
          <input
            type="search"
            placeholder="Buscar por folio o referencia..."
            className="min-h-11 w-64 rounded-lg border-2 border-border px-3 text-base"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <select
            className="min-h-11 w-auto rounded-lg border-2 border-border px-3 text-sm font-semibold"
            value={coloniaFiltro}
            onChange={(e) => setColoniaFiltro(e.target.value)}
          >
            <option value="">Colonia</option>
            {colonias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            className="min-h-11 w-auto rounded-lg border-2 border-border px-3 text-sm font-semibold"
            value={estatusFiltro}
            onChange={(e) => setEstatusFiltro(e.target.value)}
          >
            <option value="">Estatus</option>
            <option value="asignado_a_dependencia">Recien asignados</option>
            <option value="asignado_a_jefe_cuadrilla">En cuadrilla</option>
            <option value="en_proceso">En proceso</option>
            <option value="reabierto_por_ciudadano">Reabiertos</option>
            <option value="cerrado">Cerrados</option>
          </select>
          {esObraPublica && (
            <select
              className="min-h-11 w-auto rounded-lg border-2 border-border px-3 text-sm font-semibold"
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
            >
              <option value="">Tipos</option>
              {TIPOS_OBRA_PUBLICA.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          )}
          <div className="flex gap-3">
            <input
              type="date"
              className="min-h-11 rounded-lg border-2 border-border px-3 text-sm font-semibold"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
            <input
              type="date"
              className="min-h-11 rounded-lg border-2 border-border px-3 text-sm font-semibold"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card padding="sm" className="overflow-x-auto">
        {filtrados.length === 0 ? (
          <div className="p-6 text-center text-muted">
            No hay reportes en esta vista.
          </div>
        ) : (
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="px-3 py-3 font-bold">Folio</th>
                <th className="px-3 py-3 font-bold">Tipo</th>
                <th className="px-3 py-3 font-bold">Colonia</th>
                <th className="px-3 py-3 font-bold">Fecha</th>
                <th className="px-3 py-3 font-bold">Estatus</th>
                <th className="px-3 py-3 font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((r) => {
                const t = TIPOS_INCIDENCIA.find((x) => x.id === r.tipo);
                return (
                  <tr
                    key={r.id}
                    className={[
                      "border-b border-border/60 hover:bg-muted/10",
                      r.estatus === "reabierto_por_ciudadano" ? "bg-primary/10" : "",
                    ].join(" ")}
                  >
                    <td className="px-3 py-3 font-bold text-primary">{r.folio}</td>
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-1.5">
                        {t && (
                          <IncidenciaIcon icon={t.icon} className="h-4 w-4 text-muted" />
                        )}
                        {t?.label}
                      </span>
                    </td>
                    <td className="px-3 py-3">{r.colonia}</td>
                    <td className="px-3 py-3">{r.fecha}</td>
                    <td className="px-3 py-3">
                      <Badge estatus={r.estatus} />
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/dependencia/reportes/${r.id}`}
                        className="font-bold text-primary hover:underline"
                      >
                        Gestionar
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
