"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { DEPENDENCIAS, TIPOS_INCIDENCIA, type Reporte } from "@/lib/mock-data";
import { sugerirDependencia } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

interface Props {
  params: Promise<{ id: string }>;
}

function GobiernoReporteForm({
  reporte,
  id,
}: {
  reporte: Reporte;
  id: string;
}) {
  const router = useRouter();
  const asignarDependencia = useAppStore((s) => s.asignarDependencia);
  const setDependenciaActiva = useAppStore((s) => s.setDependenciaActiva);
  const sugerida = sugerirDependencia(reporte.tipo);

  const [dependencia, setDependencia] = useState(sugerida);
  const [nota, setNota] = useState("");
  const [guardado, setGuardado] = useState(false);

  const tipo = TIPOS_INCIDENCIA.find((t) => t.id === reporte.tipo);

  async function confirmar() {
    try {
      await asignarDependencia(id, dependencia, nota);
      setDependenciaActiva(dependencia);
      setGuardado(true);
      setTimeout(() => router.push("/gobierno/dashboard"), 1200);
    } catch {
      setGuardado(false);
    }
  }

  return (
    <div className="p-4 md:p-8">
      <Link
        href="/gobierno/dashboard"
        className="mb-4 inline-flex items-center gap-1 text-base font-bold text-primary"
      >
        ← Volver a bandeja
      </Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-primary">{reporte.folio}</h1>
          <p className="text-lg font-semibold">
            {tipo?.icon} {tipo?.label} · {reporte.colonia}
          </p>
        </div>
        <Badge estatus={reporte.estatus} />
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-base font-bold">Detalle del reporte</h2>
          <p className="text-base">{reporte.descripcion}</p>
          <dl className="mt-4 space-y-2 text-sm">
            <div>
              <dt className="font-semibold text-muted">Ciudadano</dt>
              <dd>{reporte.ciudadano}</dd>
            </div>
            <div>
              <dt className="font-semibold text-muted">Dirección</dt>
              <dd>{reporte.direccion}</dd>
            </div>
            <div>
              <dt className="font-semibold text-muted">Referencia</dt>
              <dd>{reporte.referencia}</dd>
            </div>
            <div>
              <dt className="font-semibold text-muted">Fecha</dt>
              <dd>{reporte.fecha}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="mb-3 text-base font-bold">Asignar dependencia</h2>
          <p className="mb-4 text-sm text-muted">
            Clasificación sugerida:{" "}
            <span className="font-bold text-primary">{sugerida}</span>
          </p>
          <select
            className="mb-4 min-h-12 w-full rounded-lg border-2 border-border bg-white px-4 text-base font-semibold"
            value={dependencia}
            onChange={(e) => setDependencia(e.target.value)}
          >
            {DEPENDENCIAS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <textarea
            className="mb-4 min-h-24 w-full rounded-lg border-2 border-border p-3 text-base"
            placeholder="Nota de canalización..."
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          />
          <Button fullWidth onClick={confirmar} disabled={guardado}>
            {guardado ? "¡Canalizado!" : "Confirmar canalización"}
          </Button>
        </Card>
      </div>
    </div>
  );
}

export default function GobiernoReporteDetallePage({ params }: Props) {
  const { id } = use(params);
  const reportes = useAppStore((s) => s.reportes);
  const reporte = reportes.find((r) => r.id === id);

  if (!reporte) {
    return (
      <div className="p-8 text-center text-muted">
        Reporte no encontrado.{" "}
        <Link href="/gobierno/dashboard" className="text-primary">
          Volver
        </Link>
      </div>
    );
  }

  return <GobiernoReporteForm key={id} reporte={reporte} id={id} />;
}
