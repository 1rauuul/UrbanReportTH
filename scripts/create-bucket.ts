import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data, error } = await supabaseAdmin.storage.createBucket("reportes", {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  });

  if (error) {
    if (error.message.includes("already exists")) {
      console.log("Bucket 'reportes' ya existe.");
    } else {
      console.error("Error al crear bucket:", error.message);
      process.exit(1);
    }
  } else {
    console.log("Bucket 'reportes' creado correctamente.");
  }
}

main();
