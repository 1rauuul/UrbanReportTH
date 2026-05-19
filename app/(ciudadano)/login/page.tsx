"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import FormStepper from "@/components/ui/FormStepper";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import OtpDisplayModal from "@/components/auth/OtpDisplayModal";
import { useAppStore } from "@/lib/store";

type Paso = "telefono" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const setCiudadano = useAppStore((s) => s.setCiudadano);
  const cargarReportesCiudadano = useAppStore((s) => s.cargarReportesCiudadano);

  const [telefono, setTelefono] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [paso, setPaso] = useState<Paso>("telefono");
  const [esNuevo, setEsNuevo] = useState(false);
  const [codigoModal, setCodigoModal] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSolicitarOtp() {
    const tel = telefono.replace(/\D/g, "");
    if (tel.length < 10) {
      setError("Ingresa un número válido de 10 dígitos.");
      return;
    }
    setError("");
    setCargando(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefono: tel }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al solicitar el código.");
        return;
      }
      setEsNuevo(data.esNuevo as boolean);
      setCodigoModal(data.codigo as string);
      setPaso("otp");
    } catch {
      setError("Error de conexión. Verifica tu red.");
    } finally {
      setCargando(false);
    }
  }

  async function handleVerificar() {
    const cod = codigo.replace(/\D/g, "");
    if (cod.length !== 6) {
      setError("El código debe tener 6 dígitos.");
      return;
    }
    if (esNuevo && !nombre.trim()) {
      setError("Ingresa tu nombre completo para continuar.");
      return;
    }
    setError("");
    setCargando(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telefono: telefono.replace(/\D/g, ""),
          codigo: cod,
          ...(esNuevo ? { nombre: nombre.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Código inválido o expirado.");
        return;
      }
      setCiudadano(data.ciudadano);
      await cargarReportesCiudadano();
      router.push(esNuevo ? "/nuevo-reporte" : "/mis-reportes");
    } catch {
      setError("Error de conexión. Verifica tu red.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <>
      <TopBar title="Reporte ciudadano" backHref="/" />
      <FormStepper
        steps={["Datos de acceso", "Verificación"]}
        activeIndex={paso === "telefono" ? 0 : 1}
      />

      {codigoModal && (
        <OtpDisplayModal
          codigo={codigoModal}
          onClose={() => setCodigoModal(null)}
        />
      )}

      <section className="flex flex-col gap-4 p-4">
        <Card variant="panel" padding="lg">
          <h2 className="text-base font-semibold text-primary sm:text-lg">
            {paso === "telefono"
              ? "Ingresa tu número de celular."
              : esNuevo
                ? "Verifica tu código y crea tu cuenta."
                : "Ingresa el código para acceder."}
          </h2>
          <p className="mt-3 text-sm text-muted">
            {paso === "telefono"
              ? "Recibirás un código de verificación para acceder a la plataforma."
              : "El código se mostró en pantalla. Introdúcelo a continuación."}
          </p>

          <div className="mt-5 flex flex-col gap-5">
            {paso === "telefono" ? (
              <>
                <Input
                  label="Número de celular"
                  fieldVariant="soft"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  placeholder="222 123 4567"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ""))}
                  error={error}
                />
                <Button fullWidth onClick={handleSolicitarOtp} disabled={cargando}>
                  {cargando ? "Enviando…" : "Continuar"}
                </Button>
              </>
            ) : (
              <>
                <Input
                  label="Código de verificación"
                  fieldVariant="soft"
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  maxLength={6}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  error={error}
                />
                {esNuevo && (
                  <Input
                    label="Nombre completo"
                    fieldVariant="soft"
                    placeholder="Ej. María López"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                )}
                <Button fullWidth onClick={handleVerificar} disabled={cargando}>
                  {cargando ? "Verificando…" : "Verificar código"}
                </Button>
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => {
                    setPaso("telefono");
                    setCodigo("");
                    setError("");
                  }}
                >
                  Cambiar número
                </Button>
              </>
            )}
          </div>
        </Card>
      </section>
    </>
  );
}
