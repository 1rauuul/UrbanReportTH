import { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";

const prisma = new PrismaClient();

function hashPassword(pass: string): string {
  return createHash("sha256").update(pass + process.env.SESSION_SECRET).digest("hex");
}

async function main() {
  // ── Dependencias ───────────────────────────────────────────────────────────
  const depObra = await prisma.dependencia.upsert({
    where: { slug: "obra-publica" },
    update: {},
    create: { nombre: "Obra Pública", slug: "obra-publica" },
  });

  const depOosapat = await prisma.dependencia.upsert({
    where: { slug: "oosapat" },
    update: {},
    create: { nombre: "OOSAPAT", slug: "oosapat" },
  });

  const depOoselite = await prisma.dependencia.upsert({
    where: { slug: "ooselite" },
    update: {},
    create: { nombre: "OOSELITE", slug: "ooselite" },
  });

  const depProteccion = await prisma.dependencia.upsert({
    where: { slug: "proteccion-civil" },
    update: {},
    create: { nombre: "Protección Civil", slug: "proteccion-civil" },
  });

  // ── Usuarios staff ─────────────────────────────────────────────────────────
  const pass = hashPassword("demo1234");

  const usrMesa = await prisma.usuario.upsert({
    where: { email: "mesa@tehuacan.gob.mx" },
    update: {},
    create: {
      nombre: "Lic. Carmen Vargas",
      email: "mesa@tehuacan.gob.mx",
      passwordHash: pass,
      rol: "MESA_CONTROL",
    },
  });
  console.log("Mesa de control:", usrMesa.email);

  // Operadores de dependencia
  const usrObra = await prisma.usuario.upsert({
    where: { email: "obrapublica@tehuacan.gob.mx" },
    update: {},
    create: {
      nombre: "Ing. Roberto Flores",
      email: "obrapublica@tehuacan.gob.mx",
      passwordHash: pass,
      rol: "DEPENDENCIA",
      dependenciaId: depObra.id,
    },
  });

  const usrOosapat = await prisma.usuario.upsert({
    where: { email: "oosapat@tehuacan.gob.mx" },
    update: {},
    create: {
      nombre: "Ing. Patricia Ortiz",
      email: "oosapat@tehuacan.gob.mx",
      passwordHash: pass,
      rol: "DEPENDENCIA",
      dependenciaId: depOosapat.id,
    },
  });

  const usrOoselite = await prisma.usuario.upsert({
    where: { email: "ooselite@tehuacan.gob.mx" },
    update: {},
    create: {
      nombre: "Lic. Marco Salinas",
      email: "ooselite@tehuacan.gob.mx",
      passwordHash: pass,
      rol: "DEPENDENCIA",
      dependenciaId: depOoselite.id,
    },
  });

  console.log("Operadores:", usrObra.email, usrOosapat.email, usrOoselite.email);

  // Jefes de cuadrilla
  const usrJefeObra = await prisma.usuario.upsert({
    where: { email: "cuadrilla.obra@tehuacan.gob.mx" },
    update: {},
    create: {
      nombre: "Juan Martínez",
      email: "cuadrilla.obra@tehuacan.gob.mx",
      passwordHash: pass,
      rol: "JEFE_CUADRILLA",
      dependenciaId: depObra.id,
    },
  });

  await prisma.jefeDeCuadrilla.upsert({
    where: { usuarioId: usrJefeObra.id },
    update: {},
    create: {
      usuarioId: usrJefeObra.id,
      dependenciaId: depObra.id,
    },
  });

  const usrJefeOosapat = await prisma.usuario.upsert({
    where: { email: "cuadrilla.agua@tehuacan.gob.mx" },
    update: {},
    create: {
      nombre: "Luis Hernández",
      email: "cuadrilla.agua@tehuacan.gob.mx",
      passwordHash: pass,
      rol: "JEFE_CUADRILLA",
      dependenciaId: depOosapat.id,
    },
  });

  await prisma.jefeDeCuadrilla.upsert({
    where: { usuarioId: usrJefeOosapat.id },
    update: {},
    create: {
      usuarioId: usrJefeOosapat.id,
      dependenciaId: depOosapat.id,
    },
  });

  const usrJefeOoselite = await prisma.usuario.upsert({
    where: { email: "cuadrilla.limpia@tehuacan.gob.mx" },
    update: {},
    create: {
      nombre: "Ana Reyes",
      email: "cuadrilla.limpia@tehuacan.gob.mx",
      passwordHash: pass,
      rol: "JEFE_CUADRILLA",
      dependenciaId: depOoselite.id,
    },
  });

  await prisma.jefeDeCuadrilla.upsert({
    where: { usuarioId: usrJefeOoselite.id },
    update: {},
    create: {
      usuarioId: usrJefeOoselite.id,
      dependenciaId: depOoselite.id,
    },
  });

  console.log("Jefes de cuadrilla creados.");

  // ── Ciudadanos demo ────────────────────────────────────────────────────────
  const maria = await prisma.ciudadano.upsert({
    where: { telefono: "2221234567" },
    update: {},
    create: { nombre: "María López", telefono: "2221234567" },
  });

  const carlos = await prisma.ciudadano.upsert({
    where: { telefono: "2229876543" },
    update: {},
    create: { nombre: "Carlos Ruiz", telefono: "2229876543" },
  });

  // ── Reportes demo ──────────────────────────────────────────────────────────
  const samples = [
    {
      clientRequestId: "seed-1",
      folio: "THC-2026-00042",
      tipo: "bache",
      descripcion: "Bache grande en esquina que dificulta el paso de vehículos.",
      referencia: "Frente a la farmacia Guadalajara",
      colonia: "Centro",
      direccion: "Av. Reforma #120",
      lat: 18.4622,
      lng: -97.3928,
      estatus: "asignado_a_dependencia",
      dependencia: "Obra Pública",
      dependenciaId: depObra.id,
      ciudadanoId: maria.id,
      ciudadanoNombre: maria.nombre,
    },
    {
      clientRequestId: "seed-2",
      folio: "THC-2026-00038",
      tipo: "basura",
      descripcion: "Acumulación de basura en banqueta sin recolección.",
      referencia: "Calle 5 de Mayo entre 2 y 4 Norte",
      colonia: "San Sebastián",
      direccion: "Calle 5 de Mayo #45",
      lat: 18.465,
      lng: -97.39,
      estatus: "en_proceso",
      dependencia: "OOSELITE",
      dependenciaId: depOoselite.id,
      ciudadanoId: carlos.id,
      ciudadanoNombre: carlos.nombre,
    },
    {
      clientRequestId: "seed-3",
      folio: "THC-2026-00031",
      tipo: "alumbrado",
      descripcion: "Luminaria apagada desde hace una semana.",
      referencia: "Parque Juárez, entrada principal",
      colonia: "La Huizachera",
      direccion: "Blvd. Miguel Hidalgo",
      lat: 18.458,
      lng: -97.395,
      estatus: "cerrado",
      dependencia: "Obra Pública",
      dependenciaId: depObra.id,
      ciudadanoId: maria.id,
      ciudadanoNombre: "Ana García",
    },
    {
      clientRequestId: "seed-4",
      folio: "THC-2026-00027",
      tipo: "fuga",
      descripcion: "Fuga de agua potable en la calle.",
      referencia: "Esquina con Av. Independencia",
      colonia: "Centro",
      direccion: "Calle 3 Sur #88",
      lat: 18.461,
      lng: -97.392,
      estatus: "asignado_a_dependencia",
      dependencia: "OOSAPAT",
      dependenciaId: depOosapat.id,
      ciudadanoId: carlos.id,
      ciudadanoNombre: carlos.nombre,
    },
  ];

  for (const s of samples) {
    const existing = await prisma.reporte.findUnique({
      where: { clientRequestId: s.clientRequestId },
    });
    if (existing) continue;

    await prisma.reporte.create({
      data: {
        ...s,
        historial: {
          create: {
            estatus: "creado",
            nota: "Reporte recibido correctamente.",
            actor: "Sistema",
          },
        },
      },
    });
  }

  console.log("Seed completado.");
  console.log("\n=== Credenciales de acceso (contraseña: demo1234) ===");
  console.log("Mesa de control:  mesa@tehuacan.gob.mx");
  console.log("Obra Pública:     obrapublica@tehuacan.gob.mx");
  console.log("OOSAPAT:          oosapat@tehuacan.gob.mx");
  console.log("OOSELITE:         ooselite@tehuacan.gob.mx");
  console.log("Cuadrilla Obra:   cuadrilla.obra@tehuacan.gob.mx");
  console.log("Cuadrilla Agua:   cuadrilla.agua@tehuacan.gob.mx");
  console.log("Cuadrilla Limpia: cuadrilla.limpia@tehuacan.gob.mx");
  console.log("\nCiudadanos demo (OTP en pantalla):");
  console.log("Teléfono: 2221234567 (María López)");
  console.log("Teléfono: 2229876543 (Carlos Ruiz)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
