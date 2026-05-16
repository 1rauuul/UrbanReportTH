const PEND_KEY = "urbareport-pend-seq";

export function generarFolioPendiente(): string {
  if (typeof window === "undefined") {
    return `THC-PEND-${Date.now().toString(36).toUpperCase()}`;
  }
  const prev = parseInt(localStorage.getItem(PEND_KEY) ?? "0", 10);
  const next = prev + 1;
  localStorage.setItem(PEND_KEY, String(next));
  return `THC-PEND-${String(next).padStart(5, "0")}`;
}

export function esFolioPendiente(folio: string): boolean {
  return folio.startsWith("THC-PEND-");
}
