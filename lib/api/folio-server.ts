import { prisma } from "@/lib/prisma";
import { generarFolioServidor } from "./mappers";

export async function nextFolio(): Promise<string> {
  await prisma.$executeRawUnsafe(`CREATE SEQUENCE IF NOT EXISTS reporte_folio_seq`);

  const result = await prisma.$queryRawUnsafe<[{ nextval: bigint }]>(
    `SELECT nextval('reporte_folio_seq')`
  );
  return generarFolioServidor(Number(result[0].nextval));
}
