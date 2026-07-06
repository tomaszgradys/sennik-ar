import { NextResponse } from "next/server";
import { SESSION_COOKIE, AUTH_FLAG_COOKIE } from "@/lib/session";

export const runtime = "nodejs";

// POST /api/auth/logout — wylogowanie (czyści ciasteczko sesji + flagę).
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(AUTH_FLAG_COOKIE);
  return res;
}
