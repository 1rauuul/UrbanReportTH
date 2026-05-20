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
  const tendenciaUlt7 = stats.tendencia30Dias.slice(-7)
    .map((d) => `${d.fecha.slice(5)}: ${d.count}`).join(", ");
  const tendenciaPrevia = stats.tendencia30Dias.slice(0, 7)
    .map((d) => `${d.fecha.slice(5)}: ${d.count}`).join(", ");
  const totalUlt7 = stats.tendencia30Dias.slice(-7).reduce((s, d) => s + d.count, 0);
  const totalPrev7 = stats.tendencia30Dias.slice(0, 7).reduce((s, d) => s + d.count, 0);
  const tendenciaDireccion = totalPrev7 > 0
    ? `${totalUlt7 > totalPrev7 ? "AL ALZA" : "A LA BAJA"} (${totalUlt7} vs ${totalPrev7} semana previa)`
    : "Datos insuficientes";

  const prompt = `Eres un director de inteligencia de datos del municipio de Tehuacan, Puebla. Tu tarea es generar un INFORME EJECUTIVO DE INTELIGENCIA MUNICIPAL completo, profesional y accionable, basado en los siguientes datos de reportes ciudadanos.

ESTRUCTURA REQUERIDA — respeta estas secciones exactamente numeradas:

1. RESUMEN EJECUTIVO (2-3 oraciones que capturen la situacion general del municipio)

2. HALLAZGOS PRINCIPALES (5-7 puntos con viñetas, cada uno describiendo un hallazgo concreto respaldado por datos)

3. TENDENCIA TEMPORAL (analiza la evolucion en el tiempo: ultimos 7 dias vs 7 dias previos, direccion de la tendencia, picos o valles notables)

4. DISTRIBUCION GEOGRAFICA (analiza las colonias mas afectadas, patrones espaciales, posibles causas)

5. RENDIMIENTO DE DEPENDENCIAS (compara carga entre dependencias, identifica cuellos de botella, sugiere redistribucion si aplica)

6. ANALISIS DE CALIDAD DEL SERVICIO (interpreta la tasa de reapertura, tiempos estimados, satisfaccion implicita)

7. RECOMENDACIONES ESTRATEGICAS (5-8 recomendaciones concretas, priorizadas, con acciones especificas para el gobierno municipal)

8. INDICADORES CLAVE (KPI) (lista los 5 numeros mas relevantes del periodo)

DATOS COMPLETOS:
- Total de reportes: ${stats.total}
- Distribucion por tipo: ${stats.porTipo.map((t) => `${t.label}: ${t.count} (${Math.round(t.count / Math.max(1, stats.total) * 100)}%)`).join(" | ")}
- Top 8 colonias problematicas: ${stats.porColonia.slice(0, 8).map((c) => `${c.colonia}: ${c.count} reportes`).join(" | ")}
- Distribucion por estatus: ${stats.porEstatus.map((e) => `${e.label}: ${e.count}`).join(" | ")}
- Dependencias con mas carga: ${stats.porDependencia.slice(0, 6).map((d) => `${d.dependencia}: ${d.count} (${Math.round(d.count / Math.max(1, stats.total) * 100)}%)`).join(" | ")}
- Tasa de reapertura: ${stats.tasaReapertura}%
- Tendencia ultimos 7 dias: ${tendenciaUlt7}
- Tendencia 7 dias previos: ${tendenciaPrevia}
- Direccion de la tendencia: ${tendenciaDireccion}
- Tipo mas frecuente: ${stats.tipoMasFrecuente} · Colonia mas problematica: ${stats.coloniaMasProblematica} · Dependencia mas cargada: ${stats.dependenciaMasCargada}

IMPORTANTE: Responde en español formal. Cada seccion debe tener contenido sustancial (minimo 2-3 oraciones). NO uses markdown. Usa guiones (-) para viñetas. Separa las secciones con una linea en blanco.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "Eres un director de inteligencia municipal con 20 anos de experiencia en analisis de datos gubernamentales. Generas informes ejecutivos profesionales, detallados y accionables. Respondes en espanol formal, sin markdown, con secciones claramente numeradas.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 2000,
        temperature: 0.6,
      }),
      signal: AbortSignal.timeout(30000),
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
