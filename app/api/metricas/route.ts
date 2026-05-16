import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const dependencia = req.nextUrl.searchParams.get("dependencia");
  if (!dependencia) {
    return NextResponse.json({ error: "dependencia requerida" }, { status: 400 });
  }

  const asignados = await prisma.reporte.findMany({
    where: { dependencia },
    include: { evaluacion: true },
  });

  const resueltos = asignados.filter(
    (r) => r.estatus === "resuelto" || r.estatus === "cerrado"
  );
  const pctResueltos =
    asignados.length > 0
      ? Math.round((resueltos.length / asignados.length) * 100)
      : 0;

  const evals = asignados.map((r) => r.evaluacion).filter(Boolean);
  const promedio =
    evals.length > 0
      ? (evals.reduce((s, e) => s + (e?.estrellas ?? 0), 0) / evals.length).toFixed(1)
      : "—";

  const porEstatus = ["asignado", "en_proceso", "resuelto"].map((e) => ({
    estatus: e,
    count: asignados.filter((r) => r.estatus === e).length,
  }));

  const tipos = Array.from(new Set(asignados.map((r) => r.tipo))).map((t) => {
    const count = asignados.filter((r) => r.tipo === t).length;
    return {
      tipo: t,
      count,
      pct: asignados.length ? Math.round((count / asignados.length) * 100) : 0,
    };
  });

  return NextResponse.json({
    total: asignados.length,
    resueltos: resueltos.length,
    pctResueltos,
    enProceso: asignados.filter(
      (r) => r.estatus === "en_proceso" || r.estatus === "asignado"
    ).length,
    promedioEvaluacion: promedio,
    evaluacionesCount: evals.length,
    porEstatus,
    porTipo: tipos,
  });
}
