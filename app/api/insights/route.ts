import { NextRequest, NextResponse } from "next/server";
import { getStaffSession } from "@/lib/server/session";
import { computeStats, generateInsightsWithLLM, type ReporteStats } from "@/lib/api/insights";

export async function POST(req: NextRequest) {
  const session = await getStaffSession();
  if (!session || session.rol !== "MESA_CONTROL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      stats: null,
      summary: null,
      error: "No se ha configurado OPENAI_API_KEY en el servidor.",
    });
  }

  try {
    const body = (await req.json()) as { reportes: { tipo: string; colonia: string; estatus: string; dependencia: string; fecha: string }[] };
    const stats = computeStats(body.reportes ?? []);
    const summary = await generateInsightsWithLLM(stats, apiKey);

    return NextResponse.json({ stats, summary });
  } catch {
    return NextResponse.json({ error: "Error al generar insights" }, { status: 500 });
  }
}
