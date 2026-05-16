"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PhotoUpload from "@/components/ui/PhotoUpload";
import { Estatus, ESTATUS_LABELS, TIPOS_INCIDENCIA } from "@/lib/mock-data";
import { useAppStore } from "@/lib/store";

interface Props {
  params: Promise<{ id: string }>;
}

const estatusOptions: Estatus[] = ["asignado", "en_proceso", "resuelto"];

export default function DependenciaReportePage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const reportes = useAppStore((s) => s.reportes);
  const actualizarEstatus = useAppStore((s) => s.actualizarEstatus);

  const reporte = reportes.find((r) => r.id === id);
  const [estatus, setEstatus] = useState<Estatus>(reporte?.estatus ?? "asignado");
  const [nota, setNota] = useState("");
  const [guardado, setGuardado] = useState(false);

  if (!reporte) {
    return (
      <section className="p-8 text-center text-muted">
        Reporte no encontrado.{" "}
        <Link href="/dependencia/dashboard" className="text-primary">
          Volver
        </Link>
      </section>
    );
  }

  const tipo = TIPOS_INCIDENCIA.find((t) => t.id === reporte.tipo);

  async function guardar() {
    try {
      await actualizarEstatus(id, estatus, nota);
      setGuardado(true);
      setTimeout(() => router.push("/dependencia/dashboard"), 1200);
    } catch {
      setGuardado(false);
    }
  }

  return (
    <div className="p-4 md:p-8">
      <Link
        href="/dependencia/dashboard"
        className="mb-4 inline-flex items-center gap-1 text-base font-bold text-primary"
      >
        ← Volver a bandeja
      </Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-primary">{reporte.folio}</h1>
          <p className="text-lg font-semibold">
            {tipo?.icon} {tipo?.label}
          </p>
        </div>
        <Badge estatus={reporte.estatus} />
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-base font-bold">Información del reporte</h2>
          <p className="text-base">{reporte.descripcion}</p>
          <p className="mt-3 text-sm text-muted">
            <span className="font-semibold">Referencia:</span> {reporte.referencia}
          </p>
          <p className="mt-1 text-sm text-muted">
            <span className="font-semibold">Ubicación:</span> {reporte.direccion},{" "}
            {reporte.colonia}
          </p>
          <div className="mt-4 flex h-36 items-center justify-center rounded-xl bg-gray-200 text-4xl">
            📷
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-base font-bold">Actualizar estatus</h2>
          <label className="mb-1 block text-sm font-semibold">Nuevo estatus</label>
          <select
            className="mb-4 min-h-12 w-full rounded-lg border-2 border-border bg-white px-4 text-base font-semibold"
            value={estatus}
            onChange={(e) => setEstatus(e.target.value as Estatus)}
          >
            {estatusOptions.map((e) => (
              <option key={e} value={e}>
                {ESTATUS_LABELS[e]}
              </option>
            ))}
          </select>
          <label className="mb-1 block text-sm font-semibold">Nota interna</label>
          <textarea
            className="mb-4 min-h-24 w-full rounded-lg border-2 border-border p-3 text-base"
            placeholder="Describe la acción realizada..."
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          />
          <p className="mb-2 text-sm font-semibold">Foto de resolución (opcional)</p>
          <PhotoUpload value={null} onChange={() => {}} />
          <Button variant="accent" fullWidth className="mt-4" onClick={guardar} disabled={guardado}>
            {guardado ? "¡Actualizado!" : "Guardar actualización"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
