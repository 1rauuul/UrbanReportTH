import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toReporteDTO } from "@/lib/api/mappers";
import { getStaffSession } from "@/lib/server/session";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getStaffSession();
  if (!session || !["DEPENDENCIA", "MESA_CONTROL"].includes(session.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const nota =
    String(body.nota ?? "").trim() || "Cerrado administrativamente por la dependencia.";

  const reporte = await prisma.reporte.findUnique({
    where: { id },
    include: { asignacion: true },
  });
  if (!reporte) {
    return NextResponse.json({ error: "Reporte no encontrado" }, { status: 404 });
  }

  // Dependencia solo puede cerrar sus propios reportes
  if (
    session.rol === "DEPENDENCIA" &&
    reporte.dependenciaId !== session.dependenciaId
  ) {
    return NextResponse.json({ error: "Sin acceso a este reporte" }, { status: 403 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.historialEstatus.create({
      data: {
        reporteId: id,
        estatus: "cerrado_administrativamente",
        nota,
        dependencia: reporte.dependencia,
        actor: session.rol === "MESA_CONTROL" ? "Mesa de Control" : "Dependencia",
      },
    });

    return tx.reporte.update({
      where: { id },
      data: { estatus: "cerrado_administrativamente" },
      include: { asignacion: true },
    });
  });

  return NextResponse.json(toReporteDTO(updated));
}
