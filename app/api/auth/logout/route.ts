import { NextResponse } from "next/server";
import { clearSession } from "@/lib/server/session";

export async function POST() {
  await clearSession();
  return new NextResponse(null, { status: 204 });
}
