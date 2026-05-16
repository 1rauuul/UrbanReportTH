"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import FormStepper from "@/components/ui/FormStepper";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import StarRating from "@/components/ui/StarRating";
import { Textarea } from "@/components/ui/Input";
import { useAppStore } from "@/lib/store";

interface Props {
  params: Promise<{ id: string }>;
}

export default function EvaluarPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const evaluarReporte = useAppStore((s) => s.evaluarReporte);
  const reportes = useAppStore((s) => s.reportes);
  const reporte = reportes.find((r) => r.id === id);

  const [stars, setStars] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  async function handleEnviar() {
    if (stars === 0) return;
    try {
      await evaluarReporte(id, stars, comentario);
      setEnviado(true);
      setTimeout(() => router.push(`/mis-reportes/${id}`), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al enviar evaluación");
    }
  }

  if (!reporte) {
    return (
      <>
        <TopBar title="Reporte ciudadano" backHref="/mis-reportes" />
        <section className="p-8 text-center text-muted">Reporte no encontrado.</section>
      </>
    );
  }

  return (
    <>
      <TopBar title="Reporte ciudadano" backHref={`/mis-reportes/${id}`} />
      <FormStepper steps={["Evaluación"]} activeIndex={0} />

      <section className="p-4">
        <Card variant="panel" padding="lg">
          <h2 className="text-base font-semibold text-primary sm:text-lg">Evaluación del servicio</h2>
          <p className="mt-2 text-sm text-muted">
            Folio <span className="font-semibold text-text">{reporte.folio}</span>. Su opinión
            contribuye a mejorar la atención municipal.
          </p>

          <div className="mt-6 flex flex-col items-center gap-6">
            <StarRating value={stars} onChange={setStars} size="lg" />
            <div className="w-full">
              <Textarea
                label="Comentario (opcional)"
                placeholder="Cuéntanos tu experiencia..."
                className="w-full"
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button
              variant="accent"
              fullWidth
              disabled={stars === 0 || enviado}
              onClick={handleEnviar}
            >
              {enviado ? "Evaluación enviada. Gracias." : "Enviar evaluación"}
            </Button>
          </div>
        </Card>
      </section>
    </>
  );
}
