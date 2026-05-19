import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { normalizarTelefono } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const telefono = normalizarTelefono(String(body.telefono ?? ""));

    if (telefono.length < 10) {
      return NextResponse.json(
        { error: "Número de teléfono inválido" },
        { status: 400 }
      );
    }

    const ciudadanoExiste = await prisma.ciudadano.findUnique({
      where: { telefono },
      select: { id: true },
    });

    // TODO: en producción real, NO devolver el código en la respuesta.
    // Enviar por SMS/WhatsApp y responder solo { expiraEn, esNuevo }.
    const codigo = String(randomInt(100000, 1000000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

    await prisma.otpCode.upsert({
      where: { telefono },
      update: { codigo, expiresAt },
      create: { telefono, codigo, expiresAt },
    });

    return NextResponse.json({
      codigo,
      expiraEn: expiresAt.toISOString(),
      esNuevo: !ciudadanoExiste,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
