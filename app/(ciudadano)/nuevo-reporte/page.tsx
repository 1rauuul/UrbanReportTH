"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import FormStepper from "@/components/ui/FormStepper";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import LocationMap, { type MapLocation } from "@/components/ui/LocationMap";
import PhotoUpload from "@/components/ui/PhotoUpload";
import SyncStatusBanner from "@/components/ui/SyncStatusBanner";
import IncidenciaIcon from "@/components/ui/IncidenciaIcon";
import { TIPOS_INCIDENCIA, type TipoIncidencia } from "@/lib/mock-data";
import { useAppStore } from "@/lib/store";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { createReporteApi } from "@/lib/api/client";
import { enqueueReport } from "@/lib/offline/sync-queue";

const STEPS = ["Tipo", "Detalles", "Evidencia"];

export default function NuevoReportePage() {
  const router = useRouter();
  const online = useOnlineStatus();
  const ciudadano = useAppStore((s) => s.ciudadano);
  const setUltimoReporte = useAppStore((s) => s.setUltimoReporte);
  const mergeReporte = useAppStore((s) => s.mergeReporte);
  const cargarReportesCiudadano = useAppStore((s) => s.cargarReportesCiudadano);

  const [step, setStep] = useState(0);
  const [tipo, setTipo] = useState<TipoIncidencia | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [referencia, setReferencia] = useState("");
  const [colonia, setColonia] = useState("");
  const [ubicacion, setUbicacion] = useState<MapLocation | null>(null);
  const [foto, setFoto] = useState<Blob | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (!ciudadano) {
    return (
      <>
        <TopBar title="Reporte ciudadano" backHref="/login" />
        <section className="flex flex-col items-center gap-4 p-8 text-center">
          <p className="text-lg text-muted">Debes iniciar sesión para reportar.</p>
          <Button onClick={() => router.push("/login")}>Iniciar sesión</Button>
        </section>
      </>
    );
  }

  async function enviarReporte() {
    if (!ciudadano || !tipo) return;
    if (!descripcion.trim() || !referencia.trim()) {
      setError("Completa la descripción y la referencia.");
      setStep(1);
      return;
    }

    setEnviando(true);
    setError("");

    const payload = {
      tipo,
      descripcion,
      referencia,
      colonia,
      lat: ubicacion?.lat ?? null,
      lng: ubicacion?.lng ?? null,
      ciudadanoNombre: ciudadano.nombre,
      ciudadanoTelefono: ciudadano.telefono,
      foto,
    };

    try {
      if (online) {
        const reporte = await createReporteApi({
          clientRequestId: crypto.randomUUID(),
          ...payload,
        });
        mergeReporte(reporte);
        setUltimoReporte(reporte.id, reporte.folio, false);
      } else {
        const { clientRequestId, folioTemporal } = await enqueueReport(payload);
        setUltimoReporte(clientRequestId, folioTemporal, true);
      }
      await cargarReportesCiudadano();
      router.push("/confirmacion");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el reporte");
    } finally {
      setEnviando(false);
    }
  }

  const requiereFoto = tipo === "bache" || tipo === "basura";

  const panelTitles = [
    "Selecciona el tipo de incidencia.",
    "Describe el problema y su ubicación.",
    requiereFoto
      ? "Agrega evidencia fotográfica (requerida para IA)."
      : "Revisa tu reporte antes de enviarlo.",
  ];

  return (
    <>
      <TopBar title="Nuevo reporte" backHref="/mis-reportes" />
      <SyncStatusBanner />
      <FormStepper steps={STEPS} activeIndex={step} />

      <section className="flex flex-col gap-4 p-4 pb-24">
        <Card variant="panel" padding="lg">
          <div className="mb-1 flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-lg font-bold leading-snug text-primary sm:text-xl">
              {panelTitles[step]}
            </h2>

          </div>

          {step === 0 && (
            <div className="mt-4 flex flex-col gap-5">
              <p className="text-sm text-muted">
                Seleccione la categoría que mejor describa el problema.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {TIPOS_INCIDENCIA.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTipo(t.id)}
                    className={[
                      "flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors",
                      tipo === t.id
                        ? "border-primary bg-input-soft ring-1 ring-primary/30"
                        : "border-input-border bg-white hover:bg-input-soft/40",
                    ].join(" ")}
                  >
                    <IncidenciaIcon
                      icon={t.icon}
                      className={[
                        "h-8 w-8",
                        tipo === t.id ? "text-primary" : "text-muted",
                      ].join(" ")}
                    />
                    <span className="text-center text-sm font-semibold">{t.label}</span>
                  </button>
                ))}
              </div>
              <Button fullWidth disabled={!tipo} onClick={() => setStep(1)}>
                Continuar
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="mt-4 flex flex-col gap-5">
              <Textarea
                label="Descripción"
                placeholder="Describe con detalle el problema que observas..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
              <Input
                label="Referencia textual"
                fieldVariant="soft"
                placeholder="Ej. Frente a la tienda Oxxo, esquina con..."
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
              />
              <Input
                label="Colonia"
                placeholder="Ej. Centro"
                value={colonia}
                onChange={(e) => setColonia(e.target.value)}
              />
              {error && <p className="text-sm font-medium text-danger">{error}</p>}
              <div>
                <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
                  Ubicación en el mapa
                </p>
                <LocationMap
                  value={ubicacion}
                  onChange={setUbicacion}
                />
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setStep(0)}>
                  Atrás
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    if (!descripcion.trim() || !referencia.trim()) {
                      setError("Completa la descripción y la referencia.");
                      return;
                    }
                    setError("");
                    setStep(2);
                  }}
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="mt-4 flex flex-col gap-5">
              {requiereFoto ? (
                <>
                  <p className="text-sm text-muted">
                    {!online
                      ? "Sin conexión: el reporte se guardará localmente y se enviará automáticamente al reconectar."
                      : "La foto será analizada por IA para verificar que corresponde al problema reportado."}
                  </p>
                  <PhotoUpload
                    value={foto}
                    previewUrl={fotoPreview}
                    onChange={(blob, preview) => {
                      setFoto(blob);
                      setFotoPreview(preview);
                    }}
                  />
                </>
              ) : (
                <div className="rounded-lg border border-input-border bg-input-soft px-4 py-3">
                  <p className="text-sm text-muted">
                    Para este tipo de reporte no se requiere evidencia fotográfica.
                  </p>
                </div>
              )}
              {error && <p className="text-sm font-medium text-danger">{error}</p>}
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}>
                  Atrás
                </Button>
                <Button
                  variant="accent"
                  className="flex-1"
                  disabled={enviando}
                  onClick={enviarReporte}
                >
                  {enviando ? "Guardando..." : online ? "Enviar reporte" : "Guardar para envío"}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </section>
    </>
  );
}
