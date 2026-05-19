import { NextResponse, type NextRequest } from "next/server";
import { parseSessionCookie } from "@/lib/server/session";

export function proxy(request: NextRequest) {
  const raw = request.cookies.get("urbareport_session")?.value;
  const session = parseSessionCookie(raw);

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/mis-reportes/:path*",
    "/nuevo-reporte/:path*",
    "/perfil/:path*",
    "/evaluar/:path*",
    "/confirmacion/:path*",
  ],
};
