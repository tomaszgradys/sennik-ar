import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db, ensureSchema } from "@/lib/db";

// Sesja użytkownika końcowego (Dziennik snów) — oddzielna od sesji admina panelu.
// Ciasteczko = `${userId}.${issuedBase36}.${HMAC}`, podpisane SESSION_SECRET.
// Bez SESSION_SECRET sesja jest wyłączona (fail-closed) — nikt się nie zaloguje,
// ale publiczny sennik działa bez zmian.
const COOKIE = "sennik_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 dni

export const SESSION_COOKIE = COOKIE;
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true as const,
  secure: true as const,
  sameSite: "lax" as const,
  path: "/",
};

// Jawna (czytelna dla JS) flaga „zalogowany" — NIE sekret, tylko sygnał dla klienta,
// żeby komponenty nie odpytywały API dla niezalogowanych. Ustawiana/kasowana RAZEM z sesją.
export const AUTH_FLAG_COOKIE = "sennik_auth";
export const AUTH_FLAG_OPTIONS = {
  httpOnly: false as const,
  secure: true as const,
  sameSite: "lax" as const,
  path: "/",
};

function secret(): string | null {
  return process.env.SESSION_SECRET || null;
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export interface AppUser {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
}

export async function setSession(userId: string): Promise<void> {
  const key = secret();
  if (!key) throw new Error("SESSION_SECRET not configured");
  const payload = `${userId}.${Date.now().toString(36)}`;
  const token = `${payload}.${sign(payload, key)}`;
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

// Wartość podpisanego ciasteczka sesji — do ustawienia bezpośrednio na NextResponse
// (redirecty OAuth), gdzie cookies() z next/headers bywa zawodne przy przekierowaniu.
export function buildSessionCookieValue(userId: string): string {
  const key = secret();
  if (!key) throw new Error("SESSION_SECRET not configured");
  const payload = `${userId}.${Date.now().toString(36)}`;
  return `${payload}.${sign(payload, key)}`;
}

export const SESSION_MAX_AGE = MAX_AGE;

// Zwraca user_id z podpisanego ciasteczka bez zapytania do bazy. null = brak/nieważna sesja.
export async function getSessionUserId(): Promise<string | null> {
  const key = secret();
  if (!key) return null;
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot < 0) return null;
  const payload = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  if (!safeEqual(sig, sign(payload, key))) return null;
  const [userId, issued] = payload.split(".");
  if (!userId || !issued) return null;
  const ts = parseInt(issued, 36);
  if (!Number.isFinite(ts) || Date.now() - ts > MAX_AGE * 1000) return null;
  return userId;
}

// Pełny profil zalogowanego użytkownika (z bazy). null jeśli brak sesji, konto usunięte
// albo baza niedostępna.
export async function getSessionUser(): Promise<AppUser | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;
  try {
    await ensureSchema();
    const rows = (await db()`SELECT id, email, name, avatar_url
      FROM app_users WHERE id = ${userId} AND deleted_at IS NULL`) as AppUser[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}
