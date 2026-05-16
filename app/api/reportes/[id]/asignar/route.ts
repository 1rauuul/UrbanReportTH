import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toReporteDTO } from "@/lib/api/mappers";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const dependencia = String(body.dependencia ?? "");
  const nota = String(body.nota ?? "").trim() || `Canalizado a ${dependencia}.`;

  const reporte = await prisma.reporte.findUnique({ where: { id } });
  if (!reporte) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.historialEstatus.create({
      data: {
        reporteId: id,
        estatus: "asignado",
        nota,
        dependencia,
      },
    });
    return tx.reporte.update({
      where: { id },
      data: { dependencia, estatus: "asignado" },
    });
  });

  return NextResponse.json(toReporteDTO(updated));
}
