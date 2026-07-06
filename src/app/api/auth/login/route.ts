import { NextResponse } from "next/server";
import { loginUser } from "@/lib/users";
import { quickSave } from "@/lib/journal";
import { normalizePendingSave } from "@/lib/googleOAuth";
import { buildSessionCookieValue, SESSION_COOKIE, SESSION_COOKIE_OPTIONS, SESSION_MAX_AGE, AUTH_FLAG_COOKIE, AUTH_FLAG_OPTIONS } from "@/lib/session";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(request: Request): string {
  return (request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown").trim();
}

// POST /api/auth/login {email, password, save?} — logowanie kontem e-mail.
export async function POST(request: Request) {
  if (!(await checkRateLimit(`login:${clientIp(request)}`, 10, 900))) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const userId = await loginUser(body.email, body.password);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "bad_credentials" }, { status: 401 });
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
