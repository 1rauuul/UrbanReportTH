import { NextResponse } from "next/server";
import { getStaffSession } from "@/lib/server/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getStaffSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
    include: { dependencia: true },
  });

  if (!usuario) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    dependenciaId: usuario.dependenciaId,
    dependenciaNombre: usuario.dependencia?.nombre ?? null,
  });
}
