"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { TIPOS_INCIDENCIA } from "@/lib/mock-data";
import { useAppStore, useStatsGobierno } from "@/lib/store";

export default function GobiernoDashboardPage() {
  const reportes = useAppStore((s) => s.reportes);
  const resetDemo = useAppStore((s) => s.resetDemo);
  const cargarReportesGobierno = useAppStore((s) => s.cargarReportesGobierno);
  const stats = useStatsGobierno();
  const [tab, setTab] = useState<"bandeja" | "mapa">("bandeja");

  useEffect(() => {
    void cargarReportesGobierno();
  }, [cargarReportesGobierno]);

  const statCards = [
    { label: "Total reportes", value: String(stats.total), color: "text-primary" },
    { label: "Sin asignar", value: String(stats.sinAsignar), color: "text-warning" },
    { label: "En proceso", value: String(stats.enProceso), color: "text-indigo-600" },
    { label: "Resueltos", value: String(stats.resueltos), color: "text-success" },
  ];

  return (
    <div className="p-4 md:p-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text md:text-3xl">Mesa de Control</h1>
          <p className="text-base text-muted">Tehuacán · Todos los reportes (demo local)</p>
        </div>
        <Button variant="ghost" onClick={() => { resetDemo(); void cargarReportesGobierno(); }}>
          Recargar datos
        </Button>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
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
          Bandeja
        </button>
        <button
          type="button"
          onClick={() => setTab("mapa")}
          className={[
            "rounded-lg px-4 py-2 text-sm font-bold",
            tab === "mapa" ? "bg-primary text-white" : "border border-border bg-white text-text",
          ].join(" ")}
        >
          Mapa de calor
        </button>
      </nav>

      {tab === "bandeja" ? (
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
                <th className="px-3 py-3 font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reportes.map((r) => {
                const tipo = TIPOS_INCIDENCIA.find((t) => t.id === r.tipo);
                return (
                  <tr key={r.id} className="border-b border-border/60 hover:bg-gray-50">
                    <td className="px-3 py-3 font-bold text-primary">{r.folio}</td>
                    <td className="px-3 py-3">
                      {tipo?.icon} {tipo?.label}
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
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="flex h-64 items-center justify-center bg-gray-100">
          <div className="text-center">
            <p className="text-4xl">🗺️</p>
            <p className="mt-2 text-base font-bold text-muted">
              Mapa de calor — {reportes.length} reportes en demo local
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
