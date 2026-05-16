import { prisma } from "@/lib/prisma";
import { generarFolioServidor } from "./mappers";

export async function nextFolio(): Promise<string> {
  const count = await prisma.reporte.count();
  return generarFolioServidor(count + 1);
}
