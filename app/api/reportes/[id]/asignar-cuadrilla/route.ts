import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toReporteDTO } from "@/lib/api/mappers";
import { getStaffSession } from "@/lib/server/session";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getStaffSession();
  if (!session || session.rol !== "DEPENDENCIA") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const jefeCuadrillaId = String(body.jefeCuadrillaId ?? "");
  const nota = String(body.nota ?? "").trim() || "Asignado a jefe de cuadrilla.";

  if (!jefeCuadrillaId) {
    return NextResponse.json({ error: "jefeCuadrillaId requerido" }, { status: 400 });
  }

  const reporte = await prisma.reporte.findUnique({
    where: { id },
    include: { asignacion: true },
  });
  if (!reporte) {
    return NextResponse.json({ error: "Reporte no encontrado" }, { status: 404 });
  }

  // El reporte debe pertenecer a esta dependencia
  if (reporte.dependenciaId !== session.dependenciaId) {
    return NextResponse.json({ error: "Sin acceso a este reporte" }, { status: 403 });
  }

  // El jefe debe pertenecer a la misma dependencia
  const jefe = await prisma.jefeDeCuadrilla.findUnique({
    where: { id: jefeCuadrillaId },
  });
  if (!jefe || jefe.dependenciaId !== session.dependenciaId) {
    return NextResponse.json({ error: "Jefe de cuadrilla no válido para esta dependencia" }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    // Crear o actualizar la asignación
    if (reporte.asignacion) {
      await tx.asignacionReporte.update({
        where: { reporteId: id },
        data: { jefeCuadrillaId, nota },
      });
    } else {
      await tx.asignacionReporte.create({
        data: { reporteId: id, jefeCuadrillaId, nota },
      });
    }

    await tx.historialEstatus.create({
      data: {
        reporteId: id,
        estatus: "asignado_a_jefe_cuadrilla",
        nota,
        dependencia: reporte.dependencia,
        actor: "Dependencia",
      },
    });

    return tx.reporte.update({
      where: { id },
      data: { estatus: "asignado_a_jefe_cuadrilla" },
      include: { asignacion: true },
    });
  });

  return NextResponse.json(toReporteDTO(updated));
}
