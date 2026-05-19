import type { TipoIncidencia } from "@/lib/mock-data";

/** slug → nombre de la dependencia en BD */
const TIPO_A_SLUG: Record<TipoIncidencia, string> = {
  bache: "obra-publica",
  alumbrado: "obra-publica",
  fuga: "oosapat",
  basura: "ooselite",
};

const TIPO_A_NOMBRE: Record<TipoIncidencia, string> = {
  bache: "Obra Pública",
  alumbrado: "Obra Pública",
  fuga: "OOSAPAT",
  basura: "OOSELITE",
};

export function slugDependencia(tipo: TipoIncidencia): string {
  return TIPO_A_SLUG[tipo];
}

export function nombreDependencia(tipo: TipoIncidencia): string {
  return TIPO_A_NOMBRE[tipo];
}

/** @deprecated Usar nombreDependencia o slugDependencia */
export function sugerirDependencia(tipo: TipoIncidencia): string {
  return TIPO_A_NOMBRE[tipo];
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
