// TODO(auth): post-MVP, verificar que la evaluación la envía el dueño del reporte.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toEvaluacionDTO } from "@/lib/api/mappers";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const estrellas = Number(body.estrellas);
  const comentario = String(body.comentario ?? "");

  if (!estrellas || estrellas < 1 || estrellas > 5) {
    return NextResponse.json({ error: "Calificación inválida" }, { status: 400 });
  }

  const reporte = await prisma.reporte.findUnique({ where: { id } });
  if (!reporte) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  if (reporte.estatus !== "resuelto" && reporte.estatus !== "cerrado") {
    return NextResponse.json(
      { error: "Solo se puede evaluar un reporte resuelto" },
      { status: 400 }
    );
  }

  const evaluacion = await prisma.evaluacion.upsert({
    where: { reporteId: id },
    create: { reporteId: id, estrellas, comentario },
    update: { estrellas, comentario },
  });

  return NextResponse.json(toEvaluacionDTO(evaluacion), { status: 201 });
}
