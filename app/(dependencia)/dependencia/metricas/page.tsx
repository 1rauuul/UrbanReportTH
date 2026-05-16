"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import { useAppStore } from "@/lib/store";

interface MetricasData {
  total: number;
  resueltos: number;
  pctResueltos: number;
  enProceso: number;
  promedioEvaluacion: string;
  evaluacionesCount: number;
  porEstatus: { estatus: string; count: number }[];
  porTipo: { tipo: string; count: number; pct: number }[];
}

export default function MetricasPage() {
  const dependenciaActiva = useAppStore((s) => s.dependenciaActiva);
  const [data, setData] = useState<MetricasData | null>(null);

  useEffect(() => {
    void fetch(`/api/metricas?dependencia=${encodeURIComponent(dependenciaActiva)}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, [dependenciaActiva]);

  const kpis = data
    ? [
        { label: "Reportes recibidos", value: String(data.total), sub: "Asignados" },
        {
          label: "% Resueltos",
          value: `${data.pctResueltos}%`,
          sub: `${data.resueltos} de ${data.total}`,
        },
        { label: "En proceso", value: String(data.enProceso), sub: "Activos" },
        {
          label: "Evaluación ciudadana",
          value: `${data.promedioEvaluacion} ★`,
          sub: `${data.evaluacionesCount} evaluaciones`,
        },
      ]
    : [];

  return (
    <section className="p-4 md:p-8">
      <header className="mb-6">
        <h2 className="text-2xl font-extrabold">Métricas</h2>
        <p className="text-base text-muted">{dependenciaActiva}</p>
      </header>

      {!data ? (
        <p className="text-muted">Cargando métricas...</p>
      ) : (
        <>
          <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {kpis.map((k) => (
              <Card key={k.label} padding="sm">
                <p className="text-sm font-semibold text-muted">{k.label}</p>
                <p className="text-3xl font-extrabold text-primary">{k.value}</p>
                <p className="text-xs text-muted">{k.sub}</p>
              </Card>
            ))}
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <Card className="flex h-56 flex-col items-center justify-center bg-gray-50">
              <p className="text-base font-bold text-muted">Reportes por estatus</p>
              <section className="mt-4 flex h-32 w-full items-end justify-around gap-2 px-4">
                {data.porEstatus.map((e) => {
                  const h = data.total ? (e.count / data.total) * 100 : 0;
                  return (
                    <article key={e.estatus} className="flex flex-col items-center gap-1">
                      <span
                        className="block w-10 rounded-t bg-primary/70"
                        style={{ height: `${Math.max(h, 8)}%`, minHeight: 8 }}
                      />
                      <span className="text-xs font-semibold">{e.count}</span>
                    </article>
                  );
                })}
              </section>
            </Card>

            <Card className="flex h-56 flex-col items-center justify-center bg-gray-50">
              <p className="text-base font-bold text-muted">Distribución por tipo</p>
              <section className="mt-4 flex flex-wrap justify-center gap-4">
                {data.porTipo.map((t) => (
                  <article key={t.tipo} className="text-center">
                    <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-primary bg-primary/10 text-sm font-bold">
                      {t.pct}%
                    </span>
                    <p className="mt-2 text-xs font-semibold capitalize">{t.tipo}</p>
                  </article>
                ))}
              </section>
            </Card>
          </section>
        </>
      )}
    </section>
  );
}
