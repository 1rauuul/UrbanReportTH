"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";

interface OtpDisplayModalProps {
  codigo: string;
  onClose: () => void;
}

export default function OtpDisplayModal({
  codigo,
  onClose,
}: OtpDisplayModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  function handleCopiar() {
    navigator.clipboard.writeText(codigo).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  function handleEntendido() {
    dialogRef.current?.close();
    onClose();
  }

  const digitos = codigo.split("").join(" ");

  return (
    <dialog
      ref={dialogRef}
      className="rounded-md border border-border bg-surface p-0 shadow-xl backdrop:bg-black/50"
      onClose={onClose}
    >
      <div className="flex w-80 flex-col gap-5 p-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            Código de verificación
          </p>
          <p className="mt-3 font-mono text-4xl font-bold tracking-widest text-primary">
            {digitos}
          </p>
        </div>

        <p className="rounded bg-amber-50 px-3 py-2 text-center text-[11px] leading-relaxed text-amber-800">
          En producción este código se enviaría por SMS o WhatsApp.
          Solo se muestra aquí para el demo del MVP.
        </p>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={handleCopiar}
          >
            {copiado ? "¡Copiado!" : "Copiar"}
          </Button>
          <Button fullWidth onClick={handleEntendido}>
            Entendido
          </Button>
        </div>
      </div>
    </dialog>
  );
}
