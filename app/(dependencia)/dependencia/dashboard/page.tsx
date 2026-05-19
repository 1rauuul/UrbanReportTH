"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import IncidenciaIcon from "@/components/ui/IncidenciaIcon";
import { ESTATUS_LABELS, TIPOS_INCIDENCIA } from "@/lib/mock-data";
import { useAppStore } from "@/lib/store";
import { fetchAllReportes } from "@/lib/api/client";
import type { ReporteDTO } from "@/lib/api/types";

interface StaffInfo {
  nombre: string;
  dependenciaNombre: string;
  dependenciaId: string;
}

export default function DependenciaDashboardPage() {
  const [staff, setStaff] = useState<StaffInfo | null>(null);
  const [reportes, setReportes] = useState<ReporteDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const [busqueda, setBusqueda] = useState("");
  const [coloniaFiltro, setColoniaFiltro] = useState("");
  const [estatusFiltro, setEstatusFiltro] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");

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
        // error de auth → middleware ya redirigirá
      } finally {
        setLoading(false);
      }
    }
    void cargar();
  }, []);

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
    return matchQ && matchColonia && matchEstatus && matchTipo;
  });

  const reabiertos = reportes.filter((r) => r.estatus === "reabierto_por_ciudadano").length;

  function exportarCsv() {
    const headers = ["Folio", "Tipo", "Colonia", "Fecha", "Estatus", "Referencia"];
    const rows = filtrados.map((r) => [
      r.folio,
      r.tipo,
      r.colonia,
      r.fecha,
      ESTATUS_LABELS[r.estatus] ?? r.estatus,
      `"${r.referencia.replace(/"/g, '""')}"`,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reportes-${staff?.dependenciaNombre?.replace(/\s+/g, "-") ?? "dep"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
              <span className="ml-2 font-semibold text-red-600">
                · {reabiertos} reabiertos
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportarCsv}>
            Exportar CSV
          </Button>
          <Button variant="ghost" onClick={handleLogout}>
            Cerrar sesión
          </Button>
        </div>
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
            value={coloniaFiltro}
            onChange={(e) => setColoniaFiltro(e.target.value)}
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
            value={estatusFiltro}
            onChange={(e) => setEstatusFiltro(e.target.value)}
          >
            <option value="">Todos los estatus</option>
            <option value="asignado_a_dependencia">Recién asignados</option>
            <option value="asignado_a_jefe_cuadrilla">En cuadrilla</option>
            <option value="en_proceso">En proceso</option>
            <option value="reabierto_por_ciudadano">Reabiertos</option>
            <option value="cerrado">Cerrados</option>
          </select>
          <select
            className="min-h-11 rounded-lg border-2 border-border px-3 text-sm font-semibold"
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
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
                      "border-b border-border/60 hover:bg-gray-50",
                      r.estatus === "reabierto_por_ciudadano" ? "bg-red-50" : "",
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
