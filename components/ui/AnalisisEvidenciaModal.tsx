"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import IncidenciaIcon from "@/components/ui/IncidenciaIcon";
import { TIPOS_INCIDENCIA } from "@/lib/mock-data";

interface AnalysisResult {
  tipo: "bache" | "basura";
  severidad?: "alto" | "medio" | "bajo";
  volumen?: "grande" | "mediano" | "pequeño";
  descripcion: string;
  riesgo: string;
  recomendacion: string;
}

interface Props {
  foto: Blob | null;
  tipo: string;
  onComplete: (result: AnalysisResult | null) => void;
  onRechazada: () => void;
  onClose: () => void;
}

const SEVERIDAD_LABELS: Record<string, { label: string; color: string }> = {
  alto: { label: "Alta", color: "text-danger" },
  medio: { label: "Media", color: "text-warning" },
  bajo: { label: "Baja", color: "text-success" },
  grande: { label: "Grande", color: "text-danger" },
  mediano: { label: "Mediano", color: "text-warning" },
  pequeño: { label: "Pequeño", color: "text-success" },
};

export default function AnalisisEvidenciaModal({
  foto,
  tipo,
  onComplete,
  onRechazada,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [estado, setEstado] = useState<
    "loading" | "resultado" | "rechazada" | "error"
  >("loading");
  const [resultado, setResultado] = useState<AnalysisResult | null>(null);
  const [mensajeRechazo, setMensajeRechazo] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    dialogRef.current?.showModal();
    void analizar();
  }, []);

  async function analizar() {
    setEstado("loading");
    setErrorMsg("");
    try {
      const form = new FormData();
      if (foto) form.append("foto", foto, "evidencia.jpg");
      form.append("tipo", tipo);

      const res = await fetch("/api/analizar-evidencia", {
        method: "POST",
        body: form,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if ((data as { rechazada?: boolean }).rechazada) {
          setMensajeRechazo(
            (data as { mensaje?: string }).mensaje ??
              "La imagen no corresponde al tipo de reporte."
          );
          setEstado("rechazada");
          return;
        }
        throw new Error(
          (data as { error?: string }).error ?? "Error al analizar la imagen"
        );
      }

      setResultado(data as AnalysisResult);
      setEstado("resultado");
    } catch (e) {
      setErrorMsg(
        e instanceof Error ? e.message : "Error inesperado al analizar"
      );
      setEstado("error");
    }
  }

  function handleConfirmar() {
    dialogRef.current?.close();
    onComplete(resultado);
  }

  function handleIgnorar() {
    dialogRef.current?.close();
    onComplete(null);
  }

  function handleRechazo() {
    dialogRef.current?.close();
    onRechazada();
  }

  function handleCerrar() {
    dialogRef.current?.close();
    onClose();
  }

  const tipoInfo = TIPOS_INCIDENCIA.find((t) => t.id === tipo);
  const esBache = tipo === "bache";
  const severidadKey = esBache ? resultado?.severidad : resultado?.volumen;
  const severidadInfo = severidadKey ? SEVERIDAD_LABELS[severidadKey] : null;

  return (
    <dialog
      ref={dialogRef}
      className="m-auto max-h-[90dvh] w-[90vw] max-w-lg overflow-y-auto rounded-md border border-border bg-surface p-0 shadow-xl backdrop:bg-black/50"
      onClose={handleCerrar}
    >
      <div className="flex flex-col gap-5 p-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            Análisis con IA
          </p>
          {tipoInfo && (
            <div className="mt-2 flex items-center justify-center gap-2">
              <IncidenciaIcon
                icon={tipoInfo.icon}
                className="h-6 w-6 text-primary"
              />
              <p className="text-lg font-bold text-primary">
                {tipoInfo.label}
              </p>
            </div>
          )}
        </div>

        {estado === "loading" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted/20 border-t-primary" />
            <p className="text-sm font-semibold text-muted">
              Analizando evidencia con IA...
            </p>
            <p className="text-xs text-muted">Esto puede tomar unos segundos</p>
          </div>
        )}

        {estado === "rechazada" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10">
              <svg
                className="h-8 w-8 text-danger"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" d="M15 9l-6 6M9 9l6 6" />
              </svg>
            </div>
            <p className="text-center text-sm font-bold text-danger">
              Imagen no válida
            </p>
            <p className="text-center text-sm text-text">{mensajeRechazo}</p>
            <div className="flex w-full gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={handleRechazo}
              >
                Tomar otra foto
              </Button>
              <Button variant="ghost" fullWidth onClick={handleCerrar}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {estado === "error" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-sm font-semibold text-danger">{errorMsg}</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleIgnorar}>
                Continuar sin análisis
              </Button>
              <Button onClick={analizar}>Reintentar</Button>
            </div>
          </div>
        )}

        {estado === "resultado" && resultado && (
          <>
            {severidadInfo && (
              <div className="text-center">
                <span
                  className={`inline-block rounded-full px-4 py-1 text-sm font-bold ${severidadInfo.color} bg-current/10`}
                >
                  {severidadInfo.label}{" "}
                  {esBache ? "severidad" : "volumen"}
                </span>
              </div>
            )}

            <div className="flex flex-col gap-3 rounded bg-muted/10 p-4 text-sm">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-muted">
                  Descripción
                </p>
                <p className="text-text">{resultado.descripcion}</p>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-muted">
                  Riesgo detectado
                </p>
                <p className="text-text">{resultado.riesgo}</p>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-muted">
                  Recomendación
                </p>
                <p className="text-text">{resultado.recomendacion}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={handleIgnorar}>
                Ignorar análisis
              </Button>
              <Button fullWidth onClick={handleConfirmar}>
                Usar este análisis
              </Button>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
