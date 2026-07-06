import { NextResponse } from "next/server";
import {
  getSessionUser,
  buildSessionCookieValue,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  SESSION_MAX_AGE,
  AUTH_FLAG_COOKIE,
  AUTH_FLAG_OPTIONS,
} from "@/lib/session";
import { oauthConfigured } from "@/lib/googleOAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/auth/me — kto jest zalogowany (dla komponentów klienckich CTA).
// Nie zwraca niczego wrażliwego poza własnym profilem. Zawsze no-store.
export async function GET() {
  const user = await getSessionUser();
  const res = NextResponse.json(
    {
      user: user ? { id: user.id, email: user.email, name: user.name, avatar: user.avatar_url } : null,
      loginAvailable: oauthConfigured(),
    },
    { headers: { "cache-control": "no-store" } },
  );

  // Sesja krocząca (sliding): NavAuth odpytuje /me przy każdym wejściu, więc odnawiamy
  // 30-dniowe okno na każdej wizycie — aktywny użytkownik nie musi się logować ponownie.
  if (user) {
    res.cookies.set(SESSION_COOKIE, buildSessionCookieValue(user.id), { ...SESSION_COOKIE_OPTIONS, maxAge: SESSION_MAX_AGE });
    res.cookies.set(AUTH_FLAG_COOKIE, "1", { ...AUTH_FLAG_OPTIONS, maxAge: SESSION_MAX_AGE });
  }
  return res;
}
