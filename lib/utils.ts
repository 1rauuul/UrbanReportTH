import { TipoIncidencia } from "@/lib/mock-data";

const MAPA: Record<TipoIncidencia, string> = {
  bache: "Obras Públicas",
  basura: "Servicios Públicos",
  fuga: "Servicios Públicos",
  luminaria: "Alumbrado Público",
  otro: "Protección Civil",
};

export function sugerirDependencia(tipo: TipoIncidencia): string {
  return MAPA[tipo];
}

export function generarFolio(seq: number): string {
  const year = new Date().getFullYear();
  return `THC-${year}-${String(seq).padStart(5, "0")}`;
}

export function fechaLocal(): string {
  return new Date().toLocaleString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fechaCorta(): string {
  return new Date().toISOString().slice(0, 10);
}

export function normalizarTelefono(tel: string): string {
  return tel.replace(/\D/g, "");
}
