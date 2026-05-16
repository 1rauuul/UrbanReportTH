"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import FormStepper from "@/components/ui/FormStepper";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useAppStore } from "@/lib/store";

export default function PerfilPage() {
  const router = useRouter();
  const ciudadano = useAppStore((s) => s.ciudadano);
  const logoutCiudadano = useAppStore((s) => s.logoutCiudadano);
  const resetDemo = useAppStore((s) => s.resetDemo);

  if (!ciudadano) {
    return (
      <>
        <TopBar title="Reporte ciudadano" backHref="/" />
        <section className="flex flex-col items-center gap-4 p-8 text-center">
          <p className="text-lg text-muted">No has iniciado sesión.</p>
          <Link href="/login">
            <Button>Iniciar sesión</Button>
          </Link>
        </section>
      </>
    );
  }

  return (
    <>
      <TopBar title="Reporte ciudadano" />
      <FormStepper steps={["Perfil"]} activeIndex={0} />

      <section className="flex flex-col gap-4 p-4">
        <Card variant="panel" padding="lg">
          <h2 className="text-base font-semibold text-primary sm:text-lg">Datos del ciudadano</h2>
          <p className="mt-1 text-right text-[10px] font-semibold uppercase tracking-wide text-primary sm:text-xs">
            {ciudadano.nombre.toUpperCase()}
          </p>

          <div className="mt-5 space-y-4 rounded border border-input-border bg-input-soft/50 p-4">
            <div>
              <p className="text-xs font-medium text-muted">Nombre</p>
              <p className="text-base font-semibold text-text">{ciudadano.nombre}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted">Teléfono</p>
              <p className="text-base font-semibold text-text">{ciudadano.telefono}</p>
            </div>
          </div>

          <Button
            variant="secondary"
            fullWidth
            className="mt-6"
            onClick={() => {
              logoutCiudadano();
              router.push("/login");
            }}
          >
            Cerrar sesión
          </Button>

          <Button variant="ghost" fullWidth className="mt-2" onClick={resetDemo}>
            Reiniciar datos demo
          </Button>
        </Card>
      </section>
    </>
  );
}
