import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toJefeDTO } from "@/lib/api/mappers";
import { getStaffSession } from "@/lib/server/session";

export async function GET() {
  const session = await getStaffSession();
  if (!session || session.rol !== "DEPENDENCIA" || !session.dependenciaId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const jefes = await prisma.jefeDeCuadrilla.findMany({
    where: { dependenciaId: session.dependenciaId },
    include: { usuario: true },
    orderBy: { usuario: { nombre: "asc" } },
  });

  return NextResponse.json(jefes.map(toJefeDTO));
}
