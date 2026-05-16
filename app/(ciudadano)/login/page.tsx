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

export default function LoginPage() {
  const router = useRouter();
  const loginCiudadano = useAppStore((s) => s.loginCiudadano);
  const registrarCiudadano = useAppStore((s) => s.registrarCiudadano);
  const cargarReportesCiudadano = useAppStore((s) => s.cargarReportesCiudadano);

  const [telefono, setTelefono] = useState("");
  const [codigo, setCodigo] = useState("");
  const [paso, setPaso] = useState<"telefono" | "otp">("telefono");
  const [error, setError] = useState("");

  function enviarCodigo() {
    const tel = telefono.replace(/\D/g, "");
    if (tel.length < 10) {
      setError("Ingresa un número válido de 10 dígitos.");
      return;
    }
    setError("");
    setPaso("otp");
  }

  function verificarCodigo() {
    if (codigo.replace(/\D/g, "").length < 6) {
      setError("El código debe tener 6 dígitos.");
      return;
    }
    loginCiudadano(telefono);
    registrarCiudadano("Ciudadano", telefono);
    void cargarReportesCiudadano().then(() => router.push("/mis-reportes"));
  }

  return (
    <>
      <TopBar title="Reporte ciudadano" backHref="/" />
      <FormStepper steps={["Datos de acceso", "Confirmar"]} activeIndex={paso === "telefono" ? 0 : 1} />

      <section className="flex flex-col gap-4 p-4">
        <Card variant="panel" padding="lg">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-base font-semibold text-primary sm:text-lg">
              {paso === "telefono"
                ? "Datos para el acceso al sistema."
                : "Verificación del código enviado."}
            </h2>
          </div>
          <p className="mt-3 text-sm text-muted">
            {paso === "telefono"
              ? "Ingresa tu número de celular para recibir un código de verificación."
              : "Ingresa el código de 6 dígitos (demo: cualquier código funciona)."}
          </p>

          <div className="mt-5 flex flex-col gap-5">
            {paso === "telefono" ? (
              <>
                <Input
                  label="Número de celular"
                  fieldVariant="soft"
                  type="tel"
                  placeholder="222 123 4567"
                  hint="Demo: 2221234567 (María López) o cualquier número nuevo"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  error={error}
                />
                <Button fullWidth onClick={enviarCodigo}>
                  Enviar código
                </Button>
              </>
            ) : (
              <>
                <Input
                  label="Código de verificación"
                  fieldVariant="soft"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  error={error}
                />
                <Button fullWidth onClick={verificarCodigo}>
                  Verificar código
                </Button>
                <Button variant="ghost" fullWidth onClick={() => setPaso("telefono")}>
                  Cambiar número
                </Button>
              </>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-muted">
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="font-semibold text-primary underline-offset-2 hover:underline">
              Regístrate
            </Link>
          </p>
        </Card>
      </section>
    </>
  );
}
