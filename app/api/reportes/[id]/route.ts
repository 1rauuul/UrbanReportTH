import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toHistorialDTO, toReporteDTO, toEvaluacionDTO } from "@/lib/api/mappers";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const reporte = await prisma.reporte.findUnique({
    where: { id },
    include: {
      historial: { orderBy: { createdAt: "asc" } },
      evaluacion: true,
    },
  });

  if (!reporte) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    reporte: toReporteDTO(reporte),
    historial: reporte.historial.map(toHistorialDTO),
    evaluacion: reporte.evaluacion ? toEvaluacionDTO(reporte.evaluacion) : null,
  });
}
