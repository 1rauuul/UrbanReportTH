import { NextRequest, NextResponse } from "next/server";
import { verificarImagenConVision } from "@/lib/server/vision";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const foto = form.get("foto");
    const tipo = String(form.get("tipo") ?? "");

    if (!(foto instanceof File) || foto.size === 0) {
      return NextResponse.json({ verificacion: null }, { status: 400 });
    }

    if (tipo !== "bache" && tipo !== "basura") {
      return NextResponse.json({ verificacion: null }, { status: 400 });
    }

    const verificacion = await verificarImagenConVision(foto, tipo);
    return NextResponse.json({ verificacion });
  } catch (e) {
    console.warn("[analizar-foto]", (e as Error).message);
    return NextResponse.json({ verificacion: null });
  }
}
