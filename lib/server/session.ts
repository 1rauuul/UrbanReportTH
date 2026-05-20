import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const CITIZEN_COOKIE = "simac_session";
const STAFF_COOKIE = "simac_staff_session";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

function sign(payload: string): string {
  return createHmac("sha256", process.env.SESSION_SECRET!)
    .update(payload)
    .digest("base64url");
}

function verifyMac(payload: string, mac: string): boolean {
  const expected = sign(payload);
  try {
    return timingSafeEqual(
      Buffer.from(mac, "base64url"),
      Buffer.from(expected, "base64url")
    );
  } catch {
    return false;
  }
}

// ─── Sesión ciudadano ─────────────────────────────────────────────────────────

function buildCitizenCookie(ciudadanoId: string): string {
  const exp = Date.now() + MAX_AGE_MS;
  const payload = `${ciudadanoId}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function parseSessionCookie(
  raw: string | undefined
): { ciudadanoId: string } | null {
  if (!raw) return null;
  const lastDot = raw.lastIndexOf(".");
  if (lastDot === -1) return null;
  const payload = raw.slice(0, lastDot);
  const mac = raw.slice(lastDot + 1);
  if (!payload || !mac) return null;
  if (!verifyMac(payload, mac)) return null;
  const dotIdx = payload.indexOf(".");
  if (dotIdx === -1) return null;
  const ciudadanoId = payload.slice(0, dotIdx);
  const expStr = payload.slice(dotIdx + 1);
  if (Date.now() > Number(expStr)) return null;
  return { ciudadanoId };
}

export async function getSession(): Promise<{ ciudadanoId: string } | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(CITIZEN_COOKIE)?.value;
  return parseSessionCookie(raw);
}

export async function createSession(ciudadanoId: string): Promise<void> {
  const value = buildCitizenCookie(ciudadanoId);
  const cookieStore = await cookies();
  cookieStore.set(CITIZEN_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_MS / 1000,
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(CITIZEN_COOKIE, "", { maxAge: 0, path: "/" });
}

// ─── Sesión staff ─────────────────────────────────────────────────────────────

export interface StaffSession {
  userId: string;
  rol: string;
  dependenciaId: string | null;
}

function buildStaffCookie(session: StaffSession): string {
  const exp = Date.now() + MAX_AGE_MS;
  const depPart = session.dependenciaId ?? "";
  const payload = `${session.userId}|${session.rol}|${depPart}|${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function parseStaffSessionCookie(
  raw: string | undefined
): StaffSession | null {
  if (!raw) return null;
  const lastDot = raw.lastIndexOf(".");
  if (lastDot === -1) return null;
  const payload = raw.slice(0, lastDot);
  const mac = raw.slice(lastDot + 1);
  if (!payload || !mac) return null;
  if (!verifyMac(payload, mac)) return null;
  const parts = payload.split("|");
  if (parts.length !== 4) return null;
  const [userId, rol, depPart, expStr] = parts;
  if (Date.now() > Number(expStr)) return null;
  return {
    userId,
    rol,
    dependenciaId: depPart || null,
  };
}

export async function getStaffSession(): Promise<StaffSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(STAFF_COOKIE)?.value;
  return parseStaffSessionCookie(raw);
}

export async function createStaffSession(session: StaffSession): Promise<void> {
  const value = buildStaffCookie(session);
  const cookieStore = await cookies();
  cookieStore.set(STAFF_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_MS / 1000,
  });
}

export async function clearStaffSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(STAFF_COOKIE, "", { maxAge: 0, path: "/" });
}
