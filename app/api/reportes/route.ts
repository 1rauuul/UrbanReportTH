import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toReporteDTO } from "@/lib/api/mappers";
import { nextFolio } from "@/lib/api/folio-server";
import { saveUpload } from "@/lib/server/upload";
import { normalizarTelefono } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const telefono = req.nextUrl.searchParams.get("telefono");

  if (telefono) {
    const tel = normalizarTelefono(telefono);
    const ciudadano = await prisma.ciudadano.findUnique({ where: { telefono: tel } });
    if (!ciudadano) return NextResponse.json([]);

    const reportes = await prisma.reporte.findMany({
      where: { ciudadanoId: ciudadano.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(reportes.map(toReporteDTO));
  }

  const reportes = await prisma.reporte.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(reportes.map(toReporteDTO));
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const clientRequestId = String(form.get("clientRequestId") ?? "");
    const tipo = String(form.get("tipo") ?? "");
    const descripcion = String(form.get("descripcion") ?? "").trim();
    const referencia = String(form.get("referencia") ?? "").trim();
    const colonia = String(form.get("colonia") ?? "Sin especificar").trim();
    const ciudadanoNombre = String(form.get("ciudadanoNombre") ?? "").trim();
    const ciudadanoTelefono = normalizarTelefono(
      String(form.get("ciudadanoTelefono") ?? "")
    );
    const latRaw = form.get("lat");
    const lngRaw = form.get("lng");
    const lat = latRaw ? parseFloat(String(latRaw)) : null;
    const lng = lngRaw ? parseFloat(String(lngRaw)) : null;
    const foto = form.get("foto");

    if (!clientRequestId || !tipo || !descripcion || !referencia || !ciudadanoTelefono) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const existing = await prisma.reporte.findUnique({
      where: { clientRequestId },
    });
    if (existing) {
      return NextResponse.json(toReporteDTO(existing));
    }

    let fotoUrl: string | null = null;
    if (foto instanceof File && foto.size > 0) {
      fotoUrl = await saveUpload(foto);
    }

    const ciudadano =
      (await prisma.ciudadano.findUnique({ where: { telefono: ciudadanoTelefono } })) ??
      (await prisma.ciudadano.create({
        data: { nombre: ciudadanoNombre || "Ciudadano", telefono: ciudadanoTelefono },
      }));

    if (ciudadanoNombre && ciudadano.nombre !== ciudadanoNombre) {
      await prisma.ciudadano.update({
        where: { id: ciudadano.id },
        data: { nombre: ciudadanoNombre },
      });
    }

    const folio = await nextFolio();
    const direccion =
      lat != null && lng != null
        ? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
        : referencia;

    const reporte = await prisma.reporte.create({
      data: {
        clientRequestId,
        folio,
        tipo,
        descripcion,
        referencia,
        colonia,
        direccion,
        lat,
        lng,
        estatus: "recibido",
        dependencia: "Sin asignar",
        ciudadanoId: ciudadano.id,
        ciudadanoNombre: ciudadanoNombre || ciudadano.nombre,
        fotoUrl,
        historial: {
          create: {
            estatus: "recibido",
            nota: "Reporte recibido correctamente.",
          },
        },
      },
    });

    return NextResponse.json(toReporteDTO(reporte), { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error interno" },
      { status: 500 }
    );
  }
}
