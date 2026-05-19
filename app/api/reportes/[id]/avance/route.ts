import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toReporteDTO } from "@/lib/api/mappers";
import { getStaffSession } from "@/lib/server/session";

interface Params {
  params: Promise<{ id: string }>;
}

const AVANCES_VALIDOS = ["en_proceso", "solucionado_por_cuadrilla"] as const;
type EstadoAvance = (typeof AVANCES_VALIDOS)[number];

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getStaffSession();
  if (!session || session.rol !== "JEFE_CUADRILLA") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const nuevoEstatus = body.estatus as EstadoAvance;
  const nota = String(body.nota ?? "").trim() || `Actualizado a ${nuevoEstatus}.`;

  if (!AVANCES_VALIDOS.includes(nuevoEstatus)) {
    return NextResponse.json({ error: "Estatus inválido" }, { status: 400 });
  }

  const jefe = await prisma.jefeDeCuadrilla.findFirst({
    where: { usuarioId: session.userId },
  });
  if (!jefe) {
    return NextResponse.json({ error: "Jefe de cuadrilla no encontrado" }, { status: 404 });
  }

  const reporte = await prisma.reporte.findUnique({
    where: { id },
    include: { asignacion: true },
  });
  if (!reporte) {
    return NextResponse.json({ error: "Reporte no encontrado" }, { status: 404 });
  }

  // Validar que el reporte esté asignado a este jefe
  if (reporte.asignacion?.jefeCuadrillaId !== jefe.id) {
    return NextResponse.json({ error: "Sin acceso a este reporte" }, { status: 403 });
  }

  // Cuando cuadrilla marca solucionado → pasa a pendiente de revisión ciudadana
  const estatusFinal =
    nuevoEstatus === "solucionado_por_cuadrilla"
      ? "pendiente_revision_ciudadana"
      : nuevoEstatus;

  const updated = await prisma.$transaction(async (tx) => {
    await tx.historialEstatus.create({
      data: {
        reporteId: id,
        estatus: nuevoEstatus,
        nota,
        dependencia: reporte.dependencia,
        actor: "Jefe de Cuadrilla",
      },
    });

    if (nuevoEstatus === "solucionado_por_cuadrilla") {
      await tx.historialEstatus.create({
        data: {
          reporteId: id,
          estatus: "pendiente_revision_ciudadana",
          nota: "En espera de confirmación del ciudadano.",
          dependencia: reporte.dependencia,
          actor: "Sistema",
        },
      });
    }

    return tx.reporte.update({
      where: { id },
      data: { estatus: estatusFinal },
      include: { asignacion: true },
    });
  });

  return NextResponse.json(toReporteDTO(updated));
}
