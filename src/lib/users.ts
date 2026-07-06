import bcrypt from "bcryptjs";
import { db, ensureSchema } from "@/lib/db";

// Konta e-mail + hasło (obok logowania Google). Hasła haszowane bcrypt. Walidacja
// server-side; komunikaty generyczne (nie zdradzamy, czy e-mail istnieje).

export class AuthError extends Error {
  constructor(public code: string, msg: string) {
    super(msg);
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Realny hash do wyrównania czasu logowania, gdy konto nie istnieje (anty-enumeracja).
const DUMMY_HASH = bcrypt.hashSync("timing-equalizer", 10);

export function normalizeEmail(v: unknown): string {
  const s = String(v ?? "").trim().toLowerCase();
  if (!s || s.length > 200 || !EMAIL_RE.test(s)) throw new AuthError("bad_email", "nieprawidłowy e-mail");
  return s;
}

export function validatePassword(v: unknown): string {
  const s = String(v ?? "");
  if (s.length < 8) throw new AuthError("weak_password", "hasło min. 8 znaków");
  if (s.length > 200) throw new AuthError("bad_password", "hasło za długie");
  return s;
}

function cleanName(v: unknown): string | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  return s.slice(0, 100);
}

// Rejestracja. Zwraca user_id. Rzuca AuthError('email_taken') gdy e-mail zajęty.
export async function registerUser(emailRaw: unknown, passwordRaw: unknown, nameRaw?: unknown): Promise<string> {
  const email = normalizeEmail(emailRaw);
  const password = validatePassword(passwordRaw);
  const name = cleanName(nameRaw);
  await ensureSchema();

  const existing = (await db()`SELECT id FROM app_users
    WHERE lower(email) = ${email} AND deleted_at IS NULL`) as { id: string }[];
  if (existing[0]) throw new AuthError("email_taken", "konto z tym e-mailem już istnieje");

  const hash = await bcrypt.hash(password, 10);
  try {
    const rows = (await db()`
      INSERT INTO app_users (email, password_hash, name, provider, last_login_at)
      VALUES (${email}, ${hash}, ${name}, 'email', now())
      RETURNING id`) as { id: string }[];
    return rows[0].id;
  } catch {
    // Wyścig na unikalnym indeksie e-maila.
    throw new AuthError("email_taken", "konto z tym e-mailem już istnieje");
  }
}

// Logowanie e-mail+hasło. Zwraca user_id albo null (błędne dane / brak hasła / Google-only).
export async function loginUser(emailRaw: unknown, passwordRaw: unknown): Promise<string | null> {
  let email: string;
  try {
    email = normalizeEmail(emailRaw);
  } catch {
    return null;
  }
  const password = String(passwordRaw ?? "");
  await ensureSchema();
  const rows = (await db()`SELECT id, password_hash FROM app_users
    WHERE lower(email) = ${email} AND deleted_at IS NULL`) as { id: string; password_hash: string | null }[];
  const row = rows[0];
  if (!row || !row.password_hash) {
    // Wyrównanie czasu (utrudnia enumerację kont) — porównanie z realnym dummy hashem.
    await bcrypt.compare(password, DUMMY_HASH);
    return null;
  }
  const ok = await bcrypt.compare(password, row.password_hash);
  if (ok) await db()`UPDATE app_users SET last_login_at = now() WHERE id = ${row.id}`;
  return ok ? row.id : null;
}
