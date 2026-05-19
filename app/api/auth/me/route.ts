import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/server/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const ciudadano = await prisma.ciudadano.findUnique({
    where: { id: session.ciudadanoId },
    select: { id: true, nombre: true, telefono: true },
  });

  if (!ciudadano) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  return NextResponse.json({ ciudadano });
}
