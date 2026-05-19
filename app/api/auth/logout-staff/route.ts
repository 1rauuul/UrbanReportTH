import { NextResponse } from "next/server";
import { clearStaffSession } from "@/lib/server/session";

export async function POST() {
  await clearStaffSession();
  return NextResponse.json({ ok: true });
}
