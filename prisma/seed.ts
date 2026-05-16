import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
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
      estatus: "recibido",
      dependencia: "Sin asignar",
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
      dependencia: "Servicios Públicos",
      ciudadanoId: carlos.id,
      ciudadanoNombre: carlos.nombre,
    },
    {
      clientRequestId: "seed-3",
      folio: "THC-2026-00031",
      tipo: "luminaria",
      descripcion: "Luminaria apagada desde hace una semana.",
      referencia: "Parque Juárez, entrada principal",
      colonia: "La Huizachera",
      direccion: "Blvd. Miguel Hidalgo",
      lat: 18.458,
      lng: -97.395,
      estatus: "resuelto",
      dependencia: "Alumbrado Público",
      ciudadanoId: maria.id,
      ciudadanoNombre: "Ana García",
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
            estatus: "recibido",
            nota: "Reporte recibido.",
          },
        },
      },
    });
  }

  console.log("Seed completado");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
