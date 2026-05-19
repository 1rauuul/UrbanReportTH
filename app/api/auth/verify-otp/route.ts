import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizarTelefono } from "@/lib/utils";
import { createSession } from "@/lib/server/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const telefono = normalizarTelefono(String(body.telefono ?? ""));
    const codigo = String(body.codigo ?? "").trim();
    const nombre = String(body.nombre ?? "").trim();

    if (!telefono || !codigo) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );
    }

    const otp = await prisma.otpCode.findUnique({ where: { telefono } });

    if (!otp || otp.codigo !== codigo || otp.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Código inválido o expirado" },
        { status: 401 }
      );
    }

    await prisma.otpCode.delete({ where: { telefono } });

    let ciudadano = await prisma.ciudadano.findUnique({ where: { telefono } });

    if (!ciudadano) {
      if (!nombre) {
        return NextResponse.json(
          { error: "El nombre es requerido para el primer registro" },
          { status: 400 }
        );
      }
      ciudadano = await prisma.ciudadano.create({
        data: { nombre, telefono },
      });
    }

    await createSession(ciudadano.id);

    return NextResponse.json({
      ciudadano: {
        id: ciudadano.id,
        nombre: ciudadano.nombre,
        telefono: ciudadano.telefono,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
