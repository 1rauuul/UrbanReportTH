import { NextResponse, type NextRequest } from "next/server";
import { parseSessionCookie, parseStaffSessionCookie } from "@/lib/server/session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas ciudadano
  const isCitizenRoute =
    pathname.startsWith("/mis-reportes") ||
    pathname.startsWith("/nuevo-reporte") ||
    pathname.startsWith("/perfil") ||
    pathname.startsWith("/evaluar") ||
    pathname.startsWith("/confirmacion");

  if (isCitizenRoute) {
    const raw = request.cookies.get("urbareport_session")?.value;
    const session = parseSessionCookie(raw);
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Rutas gobierno → rol MESA_CONTROL
  if (pathname.startsWith("/gobierno")) {
    const raw = request.cookies.get("urbareport_staff_session")?.value;
    const session = parseStaffSessionCookie(raw);
    if (!session || session.rol !== "MESA_CONTROL") {
      const url = request.nextUrl.clone();
      url.pathname = "/staff/login";
      url.searchParams.set("from", "gobierno");
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Rutas dependencia → rol DEPENDENCIA
  if (pathname.startsWith("/dependencia")) {
    const raw = request.cookies.get("urbareport_staff_session")?.value;
    const session = parseStaffSessionCookie(raw);
    if (!session || session.rol !== "DEPENDENCIA") {
      const url = request.nextUrl.clone();
      url.pathname = "/staff/login";
      url.searchParams.set("from", "dependencia");
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Rutas cuadrilla → rol JEFE_CUADRILLA
  if (pathname.startsWith("/cuadrilla")) {
    const raw = request.cookies.get("urbareport_staff_session")?.value;
    const session = parseStaffSessionCookie(raw);
    if (!session || session.rol !== "JEFE_CUADRILLA") {
      const url = request.nextUrl.clone();
      url.pathname = "/staff/login";
      url.searchParams.set("from", "cuadrilla");
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
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
    "/gobierno/:path*",
    "/dependencia/:path*",
    "/cuadrilla/:path*",
  ],
};
