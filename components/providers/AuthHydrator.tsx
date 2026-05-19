"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

export default function AuthHydrator() {
  const setCiudadano = useAppStore((s) => s.setCiudadano);
  const cargarReportesCiudadano = useAppStore((s) => s.cargarReportesCiudadano);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.ciudadano) {
          setCiudadano(data.ciudadano);
          void cargarReportesCiudadano();
        }
      })
      .catch(() => {
        // Sin sesión o sin red — las rutas privadas están protegidas por proxy.ts
      });
  }, [setCiudadano, cargarReportesCiudadano]);

  return null;
}
