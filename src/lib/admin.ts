import { cookies } from "next/headers";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// Dostęp do panelu: login + hasło. Poświadczenia NIE leżą w repo — muszą być podane
// zmiennymi środowiskowymi w Vercel:
//   ADMIN_PASSWORD  (wymagane; bez niego panel jest zamknięty — fail-closed)
//   ADMIN_LOGIN     (opcjonalne; domyślnie „sennik.tv")
//   PANEL_SECRET    (zalecane; sekret podpisujący ciasteczko sesji)
const COOKIE = "panel";
const DEFAULT_LOGIN = "sennik.tv";

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

// Porównanie stałoczasowe (odporne na timing-attack). Różna długość => false.
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function adminLogin(): string {
  return (process.env.ADMIN_LOGIN || DEFAULT_LOGIN).trim().toLowerCase();
}

// Hash hasła wyłącznie ze zmiennej ADMIN_PASSWORD. Brak zmiennej => null => logowanie
// wyłączone (żadne domyślne hasło nie jest zaszyte w kodzie).
function pwHash(): string | null {
  const env = process.env.ADMIN_PASSWORD;
  return env ? sha256(env) : null;
}

export function checkCredentials(login: string, password: string): boolean {
  const hash = pwHash();
  if (!hash) return false; // brak ADMIN_PASSWORD — panel zamknięty
  const okLogin = safeEqual(String(login ?? "").trim().toLowerCase(), adminLogin());
  const okPw = safeEqual(sha256(String(password ?? "")), hash);
  return okLogin && okPw;
}

// Sekret serwera podpisujący ciasteczko. Dzięki niemu znajomość samego hasła NIE
// wystarcza do sfałszowania sesji. Gdy PANEL_SECRET nie ustawiony — fallback na hash
// hasła (zachowuje działanie, ale ustaw PANEL_SECRET dla pełnej ochrony).
function secret(): string {
  return process.env.PANEL_SECRET || `fallback:${pwHash() ?? "none"}`;
}

// Token ciasteczka = HMAC-SHA256(secret, login:pwHash). Zmiana hasła lub sekretu
// unieważnia wszystkie istniejące sesje.
function token(): string {
  return createHmac("sha256", secret())
    .update(`sennik-panel:${adminLogin()}:${pwHash() ?? ""}`)
    .digest("base64url");
}

export async function isAdmin(): Promise<boolean> {
  if (!pwHash()) return false; // panel zamknięty gdy brak ADMIN_PASSWORD
  const c = (await cookies()).get(COOKIE)?.value;
  return !!c && safeEqual(c, token());
}

export async function setAdminCookie() {
  (await cookies()).set(COOKIE, token(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAdminCookie() {
  (await cookies()).delete(COOKIE);
}
