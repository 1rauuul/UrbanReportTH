import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "urbareport_session";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function sign(payload: string): string {
  return createHmac("sha256", process.env.SESSION_SECRET!)
    .update(payload)
    .digest("base64url");
}

function buildCookieValue(ciudadanoId: string): string {
  const exp = Date.now() + MAX_AGE_MS;
  const payload = `${ciudadanoId}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

/** Verifica la firma y expiración de un valor de cookie crudo.
 *  Retorna el ciudadanoId si es válida, o null si no. */
export function parseSessionCookie(
  raw: string | undefined
): { ciudadanoId: string } | null {
  if (!raw) return null;
  const lastDot = raw.lastIndexOf(".");
  if (lastDot === -1) return null;
  const payload = raw.slice(0, lastDot);
  const mac = raw.slice(lastDot + 1);
  if (!payload || !mac) return null;

  const expected = sign(payload);
  try {
    if (
      !timingSafeEqual(
        Buffer.from(mac, "base64url"),
        Buffer.from(expected, "base64url")
      )
    )
      return null;
  } catch {
    return null;
  }

  const dotIdx = payload.indexOf(".");
  if (dotIdx === -1) return null;
  const ciudadanoId = payload.slice(0, dotIdx);
  const expStr = payload.slice(dotIdx + 1);
  if (Date.now() > Number(expStr)) return null;
  return { ciudadanoId };
}

/** Para Route Handlers y Server Components: lee la cookie de next/headers. */
export async function getSession(): Promise<{ ciudadanoId: string } | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  return parseSessionCookie(raw);
}

/** Para Route Handlers: crea la sesión y escribe la cookie httpOnly. */
export async function createSession(ciudadanoId: string): Promise<void> {
  const value = buildCookieValue(ciudadanoId);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_MS / 1000,
  });
}

/** Para Route Handlers: elimina la cookie de sesión. */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
}
