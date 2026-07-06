import { NextResponse } from "next/server";
import {
  buildAuthRequest,
  oauthConfigured,
  safeReturnPath,
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_MAX_AGE,
  type PendingSave,
} from "@/lib/googleOAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/auth/google/start?ret=/sen/waz&title=Sen o wężu&slug=waz&sourceUrl=...&sourceType=symbol_page
// Rozpoczyna logowanie Google. Opcjonalny „pending save" (sen do zapisania po loginie).
export async function GET(request: Request) {
  const u = new URL(request.url);
  const ret = safeReturnPath(u.searchParams.get("ret"));

  if (!oauthConfigured()) {
    // Logowanie niedostępne (brak konfiguracji) — wróć na stronę z neutralnym sygnałem.
    return NextResponse.redirect(new URL(`${ret}?login=unavailable`, u.origin), 303);
  }

  // Pending save budujemy tylko, gdy jest tytuł (minimalny wymagany element wpisu).
  const title = u.searchParams.get("title");
  let save: PendingSave | undefined;
  if (title && title.trim()) {
    save = {
      title: title.trim().slice(0, 200),
      slug: u.searchParams.get("slug")?.slice(0, 120) || undefined,
      sourceUrl: u.searchParams.get("sourceUrl")?.slice(0, 500) || undefined,
      sourceType: u.searchParams.get("sourceType") === "search_result" ? "search_result" : "symbol_page",
      symbolId: u.searchParams.get("symbolId")?.slice(0, 120) || undefined,
    };
  }

  const { url, cookie } = buildAuthRequest(ret, save);
  const res = NextResponse.redirect(url, 303);
  res.cookies.set(OAUTH_STATE_COOKIE, cookie, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: OAUTH_STATE_MAX_AGE,
  });
  return res;
}
