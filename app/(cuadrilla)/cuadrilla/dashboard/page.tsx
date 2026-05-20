"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import IncidenciaIcon from "@/components/ui/IncidenciaIcon";
import { TIPOS_INCIDENCIA } from "@/lib/mock-data";
import { fetchAllReportes } from "@/lib/api/client";
import type { ReporteDTO } from "@/lib/api/types";

interface StaffInfo {
  nombre: string;
  dependenciaNombre: string;
}

export default function CuadrillaDashboardPage() {
  const [staff, setStaff] = useState<StaffInfo | null>(null);
  const [reportes, setReportes] = useState<ReporteDTO[]>([]);
  const [loading, setLoading] = useState(true);

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
        });
        setReportes(reportesData);
      } catch {
        // middleware manejará el redirect
      } finally {
        setLoading(false);
      }
    }
    void cargar();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout-staff", { method: "POST" });
    window.location.href = "/staff/login";
  }

  if (loading) {
    return <div className="p-8 text-center text-muted">Cargando...</div>;
  }

  const activos = reportes.filter(
    (r) =>
      r.estatus === "asignado_a_jefe_cuadrilla" || r.estatus === "en_proceso"
  );
  const resueltos = reportes.filter(
    (r) =>
      r.estatus === "cerrado" ||
      r.estatus === "solucionado_por_cuadrilla" ||
      r.estatus === "pendiente_revision_ciudadana"
  );

  return (
    <div className="p-4 md:p-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-text md:text-2xl">
            Mis reportes asignados
          </h1>
          <p className="text-base text-muted">
            {staff?.nombre} · {staff?.dependenciaNombre}
          </p>
        </div>
        <Button variant="ghost" onClick={handleLogout}>
          Cerrar sesión
        </Button>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Card padding="sm">
          <p className="text-sm font-semibold text-muted">Activos</p>
          <p className="text-3xl font-extrabold text-primary">{activos.length}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm font-semibold text-muted">Resueltos</p>
          <p className="text-3xl font-extrabold text-success">{resueltos.length}</p>
        </Card>
      </div>

      {reportes.length === 0 ? (
        <Card>
          <p className="p-4 text-center text-muted">
            No tienes reportes asignados en este momento.
          </p>
        </Card>
      ) : (
        <Card padding="sm" className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="px-3 py-3 font-bold">Folio</th>
                <th className="px-3 py-3 font-bold">Tipo</th>
                <th className="px-3 py-3 font-bold">Colonia</th>
                <th className="px-3 py-3 font-bold">Estatus</th>
                <th className="px-3 py-3 font-bold">Acción</th>
              </tr>
            </thead>
            <tbody>
              {reportes.map((r) => {
                const t = TIPOS_INCIDENCIA.find((x) => x.id === r.tipo);
                return (
                  <tr key={r.id} className="border-b border-border/60 hover:bg-muted/10">
                    <td className="px-3 py-3 font-bold text-primary">{r.folio}</td>
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-1.5">
                        {t && <IncidenciaIcon icon={t.icon} className="h-4 w-4 text-muted" />}
                        {t?.label}
                      </span>
                    </td>
                    <td className="px-3 py-3">{r.colonia}</td>
                    <td className="px-3 py-3">
                      <Badge estatus={r.estatus} />
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/cuadrilla/reportes/${r.id}`}
                        className="font-bold text-primary hover:underline"
                      >
                        Atender
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
