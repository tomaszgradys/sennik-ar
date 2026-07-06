import { NextResponse } from "next/server";
import {
  exchangeCode,
  parseStateCookie,
  safeReturnPath,
  OAUTH_STATE_COOKIE,
} from "@/lib/googleOAuth";
import { upsertGoogleUser, quickSave } from "@/lib/journal";
import { buildSessionCookieValue, SESSION_COOKIE, SESSION_COOKIE_OPTIONS, SESSION_MAX_AGE, AUTH_FLAG_COOKIE, AUTH_FLAG_OPTIONS } from "@/lib/session";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(request: Request): string {
  return (request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown").trim();
}

// GET /api/auth/google/callback?code=...&state=...  (przekierowanie z Google)
export async function GET(request: Request) {
  const u = new URL(request.url);
  const origin = u.origin;

  // Odczyt i natychmiastowe wygaszenie ciasteczka stanu (jednorazowe).
  const stateRaw = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${OAUTH_STATE_COOKIE}=`))
    ?.slice(OAUTH_STATE_COOKIE.length + 1);
  const blob = parseStateCookie(stateRaw ? decodeURIComponent(stateRaw) : undefined);

  const fail = (path: string) => {
    const res = NextResponse.redirect(new URL(`${path}${path.includes("?") ? "&" : "?"}login=error`, origin), 303);
    res.cookies.delete(OAUTH_STATE_COOKIE);
    return res;
  };

  // Błąd z Google albo brak/niespójny stan (CSRF) → neutralny komunikat.
  if (u.searchParams.get("error") || !blob) return fail("/");
  const code = u.searchParams.get("code");
  const state = u.searchParams.get("state");
  if (!code || !state || state !== blob.state) return fail(safeReturnPath(blob.ret));

  // Rate-limit wymian kodu per-IP (ochrona endpointu tokenu).
  if (!(await checkRateLimit(`oauth_cb:${clientIp(request)}`, 20, 600))) {
    return fail(safeReturnPath(blob.ret));
  }

  let userId: string;
  try {
    const profile = await exchangeCode(code, blob.verifier, blob.nonce);
    userId = await upsertGoogleUser(profile);
  } catch {
    return fail(safeReturnPath(blob.ret));
  }

  // Pending save (sen kliknięty przed logowaniem) — zapisujemy server-side.
  let savedFlag = "";
  if (blob.save?.title) {
    try {
      const { duplicate } = await quickSave(userId, blob.save);
      savedFlag = duplicate ? "exists" : "1";
    } catch {
      savedFlag = "";
    }
  }

  const ret = safeReturnPath(blob.ret);
  const dest = savedFlag ? `${ret}${ret.includes("?") ? "&" : "?"}saved=${savedFlag}` : ret;
  const res = NextResponse.redirect(new URL(dest, origin), 303);
  res.cookies.set(SESSION_COOKIE, buildSessionCookieValue(userId), {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: SESSION_MAX_AGE,
  });
  res.cookies.set(AUTH_FLAG_COOKIE, "1", { ...AUTH_FLAG_OPTIONS, maxAge: SESSION_MAX_AGE });
  res.cookies.delete(OAUTH_STATE_COOKIE);
  return res;
}
