import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizarTelefono } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const telefono = normalizarTelefono(String(body.telefono ?? ""));
    const sub = body.subscription as {
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
    };

    if (!telefono || !sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
      return NextResponse.json({ error: "Suscripción inválida" }, { status: 400 });
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint: sub.endpoint },
      create: {
        telefono,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      },
      update: { telefono, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error al suscribir" }, { status: 500 });
  }
}
