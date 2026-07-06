import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { SITE } from "@/lib/site";

// Logowanie Google (OAuth 2.0 Authorization Code) zbudowane u nas — bez zewnętrznej
// biblioteki (Next 16). Bezpieczeństwo: parametr `state` (CSRF), PKCE (`code_verifier`
// /`code_challenge`) i `nonce` (anti-replay id_token). Wymiana kodu na tokeny idzie
// serwer-serwer po TLS z endpointem Google, więc id_token z tej odpowiedzi jest
// zaufany bez weryfikacji podpisu JWKS (walidujemy claims: aud/iss/exp/nonce).
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const STATE_COOKIE = "sennik_oauth";
const STATE_MAX_AGE = 60 * 10; // 10 minut na dokończenie logowania

export const OAUTH_STATE_COOKIE = STATE_COOKIE;
export const OAUTH_STATE_MAX_AGE = STATE_MAX_AGE;

function clientId(): string | null {
  return process.env.GOOGLE_CLIENT_ID || null;
}
function clientSecret(): string | null {
  return process.env.GOOGLE_CLIENT_SECRET || null;
}
function stateSecret(): string | null {
  return process.env.SESSION_SECRET || null;
}
export function oauthConfigured(): boolean {
  return !!(clientId() && clientSecret() && stateSecret());
}

// Trailing slash — projekt ma trailingSlash:true, więc kanoniczny URL callbacku ma „/".
// Redirect URI musi być identyczny w żądaniu, wymianie tokenu i w konfiguracji Google.
function redirectUri(): string {
  return `${SITE.url}/api/auth/google/callback/`;
}

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
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

// Redirect po loginie musi być ścieżką względną z jednym „/" na początku (bez „//"
// i bez schematu) — inaczej open-redirect. Fallback: strona główna.
export function safeReturnPath(input: unknown): string {
  const s = typeof input === "string" ? input : "";
  if (!s.startsWith("/") || s.startsWith("//") || s.startsWith("/\\")) return "/";
  return s;
}

// Sen do zapisania po zalogowaniu (pending save). Trafia do PODPISANEGO ciasteczka
// stanu, więc po loginie zapisujemy server-side, bez gubienia kontekstu klikniętego snu.
export interface PendingSave {
  slug?: string;
  title: string;
  sourceUrl?: string;
  sourceType?: string;
  symbolId?: string;
}

// Normalizuje „pending save" z ciała żądania: przycina długości i odrzuca brak tytułu.
// Jedno miejsce dla register/login/start — bez nieograniczonych pól w bazie.
export function normalizePendingSave(raw: unknown): PendingSave | undefined {
  const r = (raw ?? {}) as Record<string, unknown>;
  const title = typeof r.title === "string" ? r.title.trim() : "";
  if (!title) return undefined;
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : undefined);
  return {
    title: title.slice(0, 200),
    slug: str(r.slug, 120),
    sourceUrl: str(r.sourceUrl, 500),
    sourceType: r.sourceType === "search_result" ? "search_result" : "symbol_page",
    symbolId: str(r.symbolId, 120),
  };
}

interface StateBlob {
  state: string;
  nonce: string;
  verifier: string;
  ret: string;
  save?: PendingSave;
}

// Buduje URL do Google + podpisane ciasteczko stanu (do odczytu w callbacku).
export function buildAuthRequest(returnPath: string, save?: PendingSave): { url: string; cookie: string } {
  const key = stateSecret()!;
  const state = b64url(randomBytes(24));
  const nonce = b64url(randomBytes(24));
  const verifier = b64url(randomBytes(32));
  const challenge = b64url(createHash("sha256").update(verifier).digest());
  const ret = safeReturnPath(returnPath);

  const blob: StateBlob = { state, nonce, verifier, ret, save };
  const payload = Buffer.from(JSON.stringify(blob)).toString("base64url");
  const cookie = `${payload}.${sign(payload, key)}`;

  const params = new URLSearchParams({
    client_id: clientId()!,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
    access_type: "online",
    prompt: "select_account",
  });
  return { url: `${AUTH_URL}?${params.toString()}`, cookie };
}

export function parseStateCookie(value: string | undefined): StateBlob | null {
  if (!value) return null;
  const key = stateSecret();
  if (!key) return null;
  const dot = value.lastIndexOf(".");
  if (dot < 0) return null;
  const payload = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  if (!safeEqual(sig, sign(payload, key))) return null;
  try {
    const blob = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (blob && blob.state && blob.nonce && blob.verifier && typeof blob.ret === "string") {
      return blob as StateBlob;
    }
  } catch {
    /* uszkodzone */
  }
  return null;
}

export interface GoogleProfile {
  sub: string;
  email: string;
  name: string | null;
  picture: string | null;
}

// Wymienia kod na tokeny i zwraca zweryfikowany profil. Rzuca przy błędzie.
export async function exchangeCode(code: string, verifier: string, nonce: string): Promise<GoogleProfile> {
  const body = new URLSearchParams({
    code,
    client_id: clientId()!,
    client_secret: clientSecret()!,
    redirect_uri: redirectUri(),
    grant_type: "authorization_code",
    code_verifier: verifier,
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`token_exchange_${res.status}`);
  const data = (await res.json()) as { id_token?: string };
  if (!data.id_token) throw new Error("no_id_token");

  const parts = data.id_token.split(".");
  if (parts.length !== 3) throw new Error("bad_id_token");
  const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as Record<string, unknown>;

  const iss = String(claims.iss ?? "");
  if (iss !== "https://accounts.google.com" && iss !== "accounts.google.com") throw new Error("bad_iss");
  if (String(claims.aud ?? "") !== clientId()) throw new Error("bad_aud");
  if (Number(claims.exp ?? 0) * 1000 < Date.now()) throw new Error("expired");
  if (String(claims.nonce ?? "") !== nonce) throw new Error("bad_nonce");
  if (claims.email_verified !== true && claims.email_verified !== "true") throw new Error("email_unverified");
  const sub = String(claims.sub ?? "");
  const email = String(claims.email ?? "");
  if (!sub || !email) throw new Error("missing_claims");

  return {
    sub,
    email,
    name: claims.name ? String(claims.name) : null,
    picture: claims.picture ? String(claims.picture) : null,
  };
}
