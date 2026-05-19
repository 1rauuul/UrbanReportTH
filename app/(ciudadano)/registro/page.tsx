import { redirect } from "next/navigation";

// El flujo de registro se unificó en /login.
// Primera vez: ingresa teléfono -> código -> nombre -> cuenta creada.
export default function RegistroPage() {
  redirect("/login");
}
