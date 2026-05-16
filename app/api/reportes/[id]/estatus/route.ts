import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toReporteDTO } from "@/lib/api/mappers";
import type { Estatus } from "@/lib/mock-data";

interface Params {
  params: Promise<{ id: string }>;
}

const VALID: Estatus[] = [
  "recibido",
  "en_revision",
  "asignado",
  "en_proceso",
  "resuelto",
  "cerrado",
];

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const estatus = body.estatus as Estatus;
  const nota =
    String(body.nota ?? "").trim() || `Estatus actualizado a ${estatus}.`;

  if (!VALID.includes(estatus)) {
    return NextResponse.json({ error: "Estatus inválido" }, { status: 400 });
  }

  const reporte = await prisma.reporte.findUnique({ where: { id } });
  if (!reporte) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.historialEstatus.create({
      data: {
        reporteId: id,
        estatus,
        nota,
        dependencia: reporte.dependencia,
      },
    });
    return tx.reporte.update({
      where: { id },
      data: { estatus },
    });
  });

  return NextResponse.json(toReporteDTO(updated));
}
