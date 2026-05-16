import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function saveUpload(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error("La imagen supera 5 MB");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = file.type.includes("png") ? "png" : "jpg";
  const name = `${randomUUID()}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, name), buffer);
  return `/uploads/${name}`;
}
