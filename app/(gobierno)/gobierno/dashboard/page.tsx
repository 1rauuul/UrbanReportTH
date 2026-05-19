"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import IncidenciaIcon from "@/components/ui/IncidenciaIcon";
import { TIPOS_INCIDENCIA } from "@/lib/mock-data";
import { useAppStore, useStatsGobierno } from "@/lib/store";

export default function GobiernoDashboardPage() {
  const reportes = useAppStore((s) => s.reportes);
  const cargarReportesGobierno = useAppStore((s) => s.cargarReportesGobierno);
  const stats = useStatsGobierno();
  const [tab, setTab] = useState<"bandeja" | "reabiertos">("bandeja");
  const loading = useAppStore((s) => s.loading);

  useEffect(() => {
    void cargarReportesGobierno();
  }, [cargarReportesGobierno]);

  const reabiertos = reportes.filter(
    (r) => r.estatus === "reabierto_por_ciudadano"
  );

  const statCards = [
    { label: "Total", value: String(stats.total), color: "text-primary" },
    { label: "Pendientes", value: String(stats.pendientes), color: "text-warning" },
    { label: "En proceso", value: String(stats.enProceso), color: "text-indigo-600" },
    { label: "Resueltos", value: String(stats.resueltos), color: "text-success" },
    { label: "Reabiertos", value: String(stats.pendienteRevision), color: "text-red-600" },
  ];

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
        <div className="flex gap-2">
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
            tab === "reabiertos" ? "bg-red-600 text-white" : "border border-border bg-white text-text",
          ].join(" ")}
        >
          Reabiertos por ciudadano
          {reabiertos.length > 0 && (
            <span className="ml-2 rounded-full bg-red-100 px-1.5 py-0.5 text-xs text-red-700">
              {reabiertos.length}
            </span>
          )}
        </button>
      </nav>

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
            {(tab === "bandeja" ? reportes : reabiertos).map((r) => {
              const tipo = TIPOS_INCIDENCIA.find((t) => t.id === r.tipo);
              return (
                <tr key={r.id} className="border-b border-border/60 hover:bg-gray-50">
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
            {(tab === "bandeja" ? reportes : reabiertos).length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted">
                  No hay reportes en esta vista.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
