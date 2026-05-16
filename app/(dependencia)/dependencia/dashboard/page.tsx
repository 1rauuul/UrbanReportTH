"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { TIPOS_INCIDENCIA } from "@/lib/mock-data";
import { useAppStore, useReportesDependencia } from "@/lib/store";

export default function DependenciaDashboardPage() {
  const dependenciaActiva = useAppStore((s) => s.dependenciaActiva);
  const reportes = useAppStore((s) => s.reportes);
  const asignados = useReportesDependencia();

  const otrasDependencias = reportes.filter(
    (r) => r.dependencia !== "Sin asignar" && r.dependencia !== dependenciaActiva
  ).length;

  const [busqueda, setBusqueda] = useState("");
  const [colonia, setColonia] = useState("");
  const [estatus, setEstatus] = useState("");
  const [tipo, setTipo] = useState("");

  const colonias = useMemo(
    () => [...new Set(asignados.map((r) => r.colonia))],
    [asignados]
  );

  const filtrados = asignados.filter((r) => {
    const q = busqueda.toLowerCase();
    const matchQ =
      !q || r.folio.toLowerCase().includes(q) || r.referencia.toLowerCase().includes(q);
    const matchColonia = !colonia || r.colonia === colonia;
    const matchEstatus = !estatus || r.estatus === estatus;
    const matchTipo = !tipo || r.tipo === tipo;
    return matchQ && matchColonia && matchEstatus && matchTipo;
  });

  function exportarCsv() {
    const headers = ["Folio", "Tipo", "Colonia", "Fecha", "Estatus", "Referencia"];
    const rows = filtrados.map((r) => [
      r.folio,
      r.tipo,
      r.colonia,
      r.fecha,
      r.estatus,
      r.referencia,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reportes-${dependenciaActiva.replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-4 md:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold">Bandeja de reportes</h2>
          <p className="text-base text-muted">
            {filtrados.length} de {asignados.length} reportes · {dependenciaActiva}
          </p>
        </div>
        <Button variant="secondary" onClick={exportarCsv}>
          Exportar CSV
        </Button>
      </header>

      <Card className="mb-4" padding="sm">
        <div className="flex flex-wrap gap-3">
          <input
            type="search"
            placeholder="Buscar por folio o referencia..."
            className="min-h-11 min-w-[200px] flex-1 rounded-lg border-2 border-border px-4 text-base"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <select
            className="min-h-11 rounded-lg border-2 border-border px-3 text-sm font-semibold"
            value={colonia}
            onChange={(e) => setColonia(e.target.value)}
          >
            <option value="">Todas las colonias</option>
            {colonias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            className="min-h-11 rounded-lg border-2 border-border px-3 text-sm font-semibold"
            value={estatus}
            onChange={(e) => setEstatus(e.target.value)}
          >
            <option value="">Todos los estatus</option>
            <option value="asignado">Asignado</option>
            <option value="en_proceso">En proceso</option>
            <option value="resuelto">Resuelto</option>
          </select>
          <select
            className="min-h-11 rounded-lg border-2 border-border px-3 text-sm font-semibold"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="">Todos los tipos</option>
            {TIPOS_INCIDENCIA.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <Card padding="sm" className="overflow-x-auto">
        {filtrados.length === 0 ? (
          <div className="space-y-2 p-6 text-center text-muted">
            <p className="font-semibold text-text">
              No hay reportes en {dependenciaActiva}
            </p>
            <p className="text-sm">
              Primero canaliza un reporte desde{" "}
              <Link href="/gobierno/dashboard" className="font-bold text-primary">
                Mesa de Control
              </Link>
              .
            </p>
            {otrasDependencias > 0 && (
              <p className="text-sm text-warning">
                Hay {otrasDependencias} reporte(s) en otras dependencias — usa el selector del
                encabezado para cambiar.
              </p>
            )}
            {reportes.some((r) => r.dependencia === "Sin asignar") && (
              <p className="text-sm">
                {reportes.filter((r) => r.dependencia === "Sin asignar").length} reporte(s) aún
                sin asignar en gobierno.
              </p>
            )}
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
                  <tr key={r.id} className="border-b border-border/60 hover:bg-gray-50">
                    <td className="px-3 py-3 font-bold text-primary">{r.folio}</td>
                    <td className="px-3 py-3">
                      {t?.icon} {t?.label}
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
