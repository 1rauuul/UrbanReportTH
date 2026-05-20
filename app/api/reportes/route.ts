import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toReporteDTO } from "@/lib/api/mappers";
import { nextFolio } from "@/lib/api/folio-server";
import { saveUpload } from "@/lib/server/upload";
import { verificarImagenConVision } from "@/lib/server/vision";
import { normalizarTelefono, slugDependencia, nombreDependencia } from "@/lib/utils";
import { getSession, getStaffSession } from "@/lib/server/session";
import type { TipoIncidencia } from "@/lib/mock-data";

const TIPOS_VALIDOS: TipoIncidencia[] = ["bache", "basura", "fuga", "alumbrado"];

export async function GET(req: NextRequest) {
  const telefono = req.nextUrl.searchParams.get("telefono");

  // Ciudadano: filtrar por teléfono (ruta legacy para compatibilidad offline)
  if (telefono) {
    const tel = normalizarTelefono(telefono);
    const ciudadano = await prisma.ciudadano.findUnique({ where: { telefono: tel } });
    if (!ciudadano) return NextResponse.json([]);
    const reportes = await prisma.reporte.findMany({
      where: { ciudadanoId: ciudadano.id },
      include: { asignacion: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(reportes.map(toReporteDTO));
  }

  // Staff: filtrar según rol de la sesión
  const staffSession = await getStaffSession();
  if (staffSession) {
    if (staffSession.rol === "MESA_CONTROL") {
      const reportes = await prisma.reporte.findMany({
        include: { asignacion: true },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(reportes.map(toReporteDTO));
    }

    if (staffSession.rol === "DEPENDENCIA" && staffSession.dependenciaId) {
      const reportes = await prisma.reporte.findMany({
        where: { dependenciaId: staffSession.dependenciaId },
        include: { asignacion: true },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(reportes.map(toReporteDTO));
    }

    if (staffSession.rol === "JEFE_CUADRILLA") {
      const jefe = await prisma.jefeDeCuadrilla.findFirst({
        where: { usuarioId: staffSession.userId },
      });
      if (!jefe) return NextResponse.json([]);
      const reportes = await prisma.reporte.findMany({
        where: { asignacion: { jefeCuadrillaId: jefe.id } },
        include: { asignacion: true },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(reportes.map(toReporteDTO));
    }
  }

  // Ciudadano autenticado por cookie
  const ciudadanoSession = await getSession();
  if (ciudadanoSession) {
    const reportes = await prisma.reporte.findMany({
      where: { ciudadanoId: ciudadanoSession.ciudadanoId },
      include: { asignacion: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(reportes.map(toReporteDTO));
  }

  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const clientRequestId = String(form.get("clientRequestId") ?? "");
    const tipoRaw = String(form.get("tipo") ?? "");
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

    if (!clientRequestId || !tipoRaw || !descripcion || !referencia || !ciudadanoTelefono) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // Normalizar tipo (compatibilidad con "luminaria" legacy de offline queue)
    const tipo = (tipoRaw === "luminaria" ? "alumbrado" : tipoRaw) as TipoIncidencia;

    if (!TIPOS_VALIDOS.includes(tipo)) {
      return NextResponse.json({ error: "Tipo de reporte inválido" }, { status: 400 });
    }

    // Idempotencia por clientRequestId
    const existing = await prisma.reporte.findUnique({
      where: { clientRequestId },
      include: { asignacion: true },
    });
    if (existing) return NextResponse.json(toReporteDTO(existing));

    let fotoUrl: string | null = null;
    let fotoVerificacion: string | null = null;
    if (foto instanceof File && foto.size > 0) {
      fotoUrl = await saveUpload(foto);
      if (tipo === "bache" || tipo === "basura") {
        try {
          fotoVerificacion = await verificarImagenConVision(foto, tipo);
        } catch (e) {
          console.warn("[vision] Análisis omitido:", (e as Error).message);
        }
      }
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

    // Auto-asignación por tipo
    const slug = slugDependencia(tipo);
    const depNombre = nombreDependencia(tipo);
    const dependenciaRec = await prisma.dependencia.findUnique({ where: { slug } });

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
        estatus: "asignado_a_dependencia",
        dependencia: dependenciaRec ? dependenciaRec.nombre : depNombre,
        dependenciaId: dependenciaRec?.id ?? null,
        ciudadanoId: ciudadano.id,
        ciudadanoNombre: ciudadanoNombre || ciudadano.nombre,
        fotoUrl,
        fotoVerificacion,
        historial: {
          create: {
            estatus: "asignado_a_dependencia",
            nota: `Reporte recibido y asignado automáticamente a ${dependenciaRec?.nombre ?? depNombre}.`,
            actor: "Sistema",
          },
        },
      },
      include: { asignacion: true },
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
