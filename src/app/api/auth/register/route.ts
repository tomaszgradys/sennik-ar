import { NextResponse } from "next/server";
import { registerUser, AuthError } from "@/lib/users";
import { quickSave } from "@/lib/journal";
import { normalizePendingSave } from "@/lib/googleOAuth";
import { buildSessionCookieValue, SESSION_COOKIE, SESSION_COOKIE_OPTIONS, SESSION_MAX_AGE, AUTH_FLAG_COOKIE, AUTH_FLAG_OPTIONS } from "@/lib/session";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(request: Request): string {
  return (request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown").trim();
}

// POST /api/auth/register {email, password, name?, save?} — konto e-mail + od razu sesja.
export async function POST(request: Request) {
  if (!(await checkRateLimit(`register:${clientIp(request)}`, 10, 3600))) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  let userId: string;
  try {
    userId = await registerUser(body.email, body.password, body.name);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ ok: false, error: e.code, message: e.message }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }

  let saved: string | undefined;
  let entryId: string | undefined;
  const save = normalizePendingSave(body.save);
  if (save) {
    try {
      const r = await quickSave(userId, save);
      saved = r.duplicate ? "exists" : "1";
      entryId = r.entry?.id;
    } catch {
      /* zapis opcjonalny */
    }
  }

  const res = NextResponse.json({ ok: true, saved, entryId });
  res.cookies.set(SESSION_COOKIE, buildSessionCookieValue(userId), { ...SESSION_COOKIE_OPTIONS, maxAge: SESSION_MAX_AGE });
  res.cookies.set(AUTH_FLAG_COOKIE, "1", { ...AUTH_FLAG_OPTIONS, maxAge: SESSION_MAX_AGE });
  return res;
}
