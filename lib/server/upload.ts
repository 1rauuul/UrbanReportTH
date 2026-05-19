import { randomUUID } from "crypto";
import { supabaseAdmin } from "./supabase";

const BUCKET = "reportes";

export async function saveUpload(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error("La imagen supera 5 MB");
  }

  const ext = file.type.includes("png") ? "png" : "jpg";
  const name = `${randomUUID()}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(name, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw new Error(`Error al subir imagen: ${error.message}`);

  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(name);

  return urlData.publicUrl;
}
