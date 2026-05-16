"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import FormStepper from "@/components/ui/FormStepper";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAppStore } from "@/lib/store";

export default function RegistroPage() {
  const router = useRouter();
  const registrarCiudadano = useAppStore((s) => s.registrarCiudadano);
  const cargarReportesCiudadano = useAppStore((s) => s.cargarReportesCiudadano);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState("");

  function handleRegistro() {
    if (!nombre.trim()) {
      setError("Ingresa tu nombre.");
      return;
    }
    if (telefono.replace(/\D/g, "").length < 10) {
      setError("Ingresa un teléfono válido.");
      return;
    }
    registrarCiudadano(nombre, telefono);
    void cargarReportesCiudadano().then(() => router.push("/nuevo-reporte"));
  }

  return (
    <>
      <TopBar title="Reporte ciudadano" backHref="/login" />
      <FormStepper steps={["Registro"]} activeIndex={0} />

      <section className="flex flex-col gap-4 p-4">
        <Card variant="panel" padding="lg">
          <h2 className="text-base font-semibold text-primary sm:text-lg">Alta de usuario ciudadano</h2>
          <p className="mt-2 text-sm text-muted">
            Capture su nombre completo y número de celular para continuar.
          </p>

          <div className="mt-5 flex flex-col gap-5">
            <Input
              label="Nombre completo"
              fieldVariant="soft"
              placeholder="Ej. María López"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
            <Input
              label="Número de celular"
              type="tel"
              placeholder="222 123 4567"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              error={error}
            />
            <Button variant="accent" fullWidth onClick={handleRegistro}>
              Crear cuenta
            </Button>
          </div>

          <p className="mt-6 text-center text-sm text-muted">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-semibold text-primary underline-offset-2 hover:underline">
              Inicia sesión
            </Link>
          </p>
        </Card>
      </section>
    </>
  );
}
