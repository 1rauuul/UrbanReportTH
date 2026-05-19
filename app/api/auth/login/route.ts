import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { createStaffSession } from "@/lib/server/session";

function hashPassword(pass: string): string {
  return createHash("sha256").update(pass + process.env.SESSION_SECRET).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const hash = hashPassword(password);
    if (hash !== usuario.passwordHash) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    await createStaffSession({
      userId: usuario.id,
      rol: usuario.rol,
      dependenciaId: usuario.dependenciaId ?? null,
    });

    return NextResponse.json({
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        dependenciaId: usuario.dependenciaId,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
