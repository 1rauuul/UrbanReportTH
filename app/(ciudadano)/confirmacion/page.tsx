"use client";

import { useState } from "react";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import FormStepper from "@/components/ui/FormStepper";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { useAppStore } from "@/lib/store";

const PASOS = ["Tipo", "Detalles", "Evidencia", "Recibo"];

export default function ConfirmacionPage() {
  const ultimoReporteId = useAppStore((s) => s.ultimoReporteId);
  const ultimoFolio = useAppStore((s) => s.ultimoFolio);
  const ultimoEsPendiente = useAppStore((s) => s.ultimoEsPendiente);
  const reportes = useAppStore((s) => s.reportes);
  const reporte = reportes.find((r) => r.id === ultimoReporteId);
  const folio = ultimoFolio ?? reporte?.folio;
  const [copiado, setCopiado] = useState(false);

  if (!folio) {
    return (
      <>
        <TopBar title="Reporte ciudadano" backHref="/nuevo-reporte" />
        <section className="p-8 text-center">
          <p className="text-muted">No hay un reporte reciente.</p>
          <Link href="/nuevo-reporte" className="mt-4 inline-block font-semibold text-primary hover:underline">
            Crear reporte
          </Link>
        </section>
      </>
    );
  }

  async function copiarFolio() {
    await navigator.clipboard.writeText(folio!);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <>
      <TopBar title="Reporte ciudadano" backHref="/mis-reportes" />
      <FormStepper steps={PASOS} activeIndex={3} />

      <section className="flex flex-col gap-4 p-4">
        <Card variant="panel" padding="lg" className="text-center">
          <h2 className="text-left text-base font-semibold text-primary sm:text-lg">
            {ultimoEsPendiente
              ? "Reporte guardado localmente."
              : "Reporte registrado correctamente."}
          </h2>
          <p className="mt-2 text-left text-sm text-muted">
            {ultimoEsPendiente
              ? "Se enviará automáticamente cuando recuperes conexión a internet."
              : "Guarde su folio para consultar el estatus del trámite."}
          </p>

          <div className="mt-6 flex justify-center" aria-hidden="true">
            <svg
              className={`h-14 w-14 ${ultimoEsPendiente ? "text-warning" : "text-success"}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <Card variant="default" padding="md" className="mt-6 border border-primary/25 bg-input-soft/50">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Folio</p>
            <p className="mt-1 text-2xl font-semibold tracking-wide text-primary sm:text-3xl">
              {folio}
            </p>
            {reporte && (
              <div className="mt-3 flex justify-center">
                <Badge estatus={reporte.estatus} />
              </div>
            )}
          </Card>

          <button
            type="button"
            className="mt-4 text-sm font-semibold text-primary underline-offset-2 hover:underline"
            onClick={copiarFolio}
          >
            {copiado ? "Copiado al portapapeles" : "Copiar folio"}
          </button>

          <div className="mt-6 flex w-full flex-col gap-3">
            <Link href="/mis-reportes">
              <Button fullWidth>Ver mis reportes</Button>
            </Link>
            <Link href="/nuevo-reporte">
              <Button variant="secondary" fullWidth>
                Nuevo reporte
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    </>
  );
}
