export interface ReporteStats {
  total: number;
  porTipo: { tipo: string; label: string; count: number }[];
  porColonia: { colonia: string; count: number }[];
  porEstatus: { estatus: string; label: string; count: number }[];
  porDependencia: { dependencia: string; count: number }[];
  tendencia30Dias: { fecha: string; count: number }[];
  tiempoPromedioResolucionDias: number;
  tasaReapertura: number;
  coloniaMasProblematica: string;
  tipoMasFrecuente: string;
  dependenciaMasCargada: string;
}

export function computeStats(reportes: {
  tipo: string;
  colonia: string;
  estatus: string;
  dependencia: string;
  fecha: string;
}[]): ReporteStats {
  const total = reportes.length;

  const porTipo = countBy(reportes, (r) => r.tipo).map(([tipo, count]) => ({
    tipo,
    label: tipoLabel(tipo),
    count,
  })).sort((a, b) => b.count - a.count);

  const porColonia = countBy(reportes, (r) => r.colonia || "Sin colonia").map(([colonia, count]) => ({
    colonia,
    count,
  })).sort((a, b) => b.count - a.count);

  const porEstatus = countBy(reportes, (r) => r.estatus).map(([estatus, count]) => ({
    estatus,
    label: estatus,
    count,
  })).sort((a, b) => b.count - a.count);

  const porDependencia = countBy(reportes, (r) => r.dependencia || "Sin asignar").map(([dependencia, count]) => ({
    dependencia,
    count,
  })).sort((a, b) => b.count - a.count);

  const tendencia30Dias = computeTendencia30Dias(reportes);

  const resueltos = reportes.filter((r) =>
    ["cerrado", "pendiente_revision_ciudadana", "solucionado_por_cuadrilla"].includes(r.estatus)
  );
  const tiempoPromedio =
    resueltos.length > 0
      ? Math.round(resueltos.length / Math.max(1, total - resueltos.length))
      : 0;

  const reabiertos = reportes.filter((r) => r.estatus === "reabierto_por_ciudadano").length;
  const tasaReapertura = total > 0 ? Math.round((reabiertos / total) * 100) : 0;

  return {
    total,
    porTipo,
    porColonia,
    porEstatus,
    porDependencia,
    tendencia30Dias,
    tiempoPromedioResolucionDias: tiempoPromedio,
    tasaReapertura,
    coloniaMasProblematica: porColonia[0]?.colonia ?? "—",
    tipoMasFrecuente: porTipo[0]?.label ?? "—",
    dependenciaMasCargada: porDependencia[0]?.dependencia ?? "—",
  };
}

function tipoLabel(tipo: string): string {
  const map: Record<string, string> = {
    bache: "Bache",
    basura: "Basura",
    fuga: "Fuga de agua",
    alumbrado: "Alumbrado",
  };
  return map[tipo] ?? tipo;
}

function countBy<T>(items: T[], keyFn: (item: T) => string): [string, number][] {
  const map = new Map<string, number>();
  for (const item of items) {
    const k = keyFn(item);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map.entries());
}

function computeTendencia30Dias(
  reportes: { fecha: string }[]
): { fecha: string; count: number }[] {
  const days: { fecha: string; count: number }[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const count = reportes.filter((r) => r.fecha === key).length;
    days.push({ fecha: key, count });
  }
  return days;
}

export async function generateInsightsWithLLM(
  stats: ReporteStats,
  apiKey: string
): Promise<string | null> {
  const prompt = `Eres un analista de datos municipales. Analiza los siguientes datos de reportes ciudadanos de Tehuacán y genera un resumen ejecutivo en español (máximo 300 palabras) con:
1. Hallazgos principales
2. Patrones o tendencias preocupantes
3. Recomendaciones accionables para el gobierno municipal

DATOS:
- Total de reportes: ${stats.total}
- Distribución por tipo: ${stats.porTipo.map((t) => `${t.label}: ${t.count}`).join(", ")}
- Top 5 colonias problemáticas: ${stats.porColonia.slice(0, 5).map((c) => `${c.colonia}: ${c.count}`).join(", ")}
- Distribución por estatus: ${stats.porEstatus.map((e) => `${e.label}: ${e.count}`).join(", ")}
- Dependencias con más carga: ${stats.porDependencia.slice(0, 5).map((d) => `${d.dependencia}: ${d.count}`).join(", ")}
- Tasa de reapertura: ${stats.tasaReapertura}%

Responde SOLO con el resumen en español, sin markdown, sin formato.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Eres un analista de datos municipal. Responde en español, máximo 300 palabras, sin formato markdown." },
          { role: "user", content: prompt },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}
