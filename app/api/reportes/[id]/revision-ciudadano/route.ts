import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toReporteDTO } from "@/lib/api/mappers";
import { getSession } from "@/lib/server/session";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const confirmar = Boolean(body.confirmar);
  const comentario = String(body.comentario ?? "").trim();

  const reporte = await prisma.reporte.findUnique({
    where: { id },
    include: { asignacion: true },
  });
  if (!reporte) {
    return NextResponse.json({ error: "Reporte no encontrado" }, { status: 404 });
  }

  // Solo el ciudadano dueño puede revisar
  if (reporte.ciudadanoId !== session.ciudadanoId) {
    return NextResponse.json({ error: "Sin acceso a este reporte" }, { status: 403 });
  }

  if (reporte.estatus !== "pendiente_revision_ciudadana") {
    return NextResponse.json(
      { error: "El reporte no está pendiente de revisión ciudadana" },
      { status: 400 }
    );
  }

  const nuevoEstatus = confirmar ? "cerrado" : "reabierto_por_ciudadano";
  const nota = confirmar
    ? `Ciudadano confirmó que el problema fue resuelto.${comentario ? " " + comentario : ""}`
    : `Ciudadano indicó que el problema no fue resuelto.${comentario ? " " + comentario : ""}`;

  const updated = await prisma.$transaction(async (tx) => {
    await tx.historialEstatus.create({
      data: {
        reporteId: id,
        estatus: nuevoEstatus,
        nota,
        dependencia: reporte.dependencia,
        actor: "Ciudadano",
      },
    });

    return tx.reporte.update({
      where: { id },
      data: { estatus: nuevoEstatus },
      include: { asignacion: true },
    });
  });

  return NextResponse.json(toReporteDTO(updated));
}
