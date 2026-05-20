import { prisma } from "@/lib/prisma";
import { generarFolioServidor } from "./mappers";

export async function nextFolio(): Promise<string> {
  const last = await prisma.reporte.findFirst({
    orderBy: { createdAt: "desc" },
    select: { folio: true },
  });
  const num = last ? parseInt(last.folio.split("-").pop() ?? "0") + 1 : 1;
  return generarFolioServidor(num);
}
