import { NextResponse } from "next/server";
import { checkCredentials, setAdminCookie, clearAdminCookie } from "@/lib/admin";
import { db, ensureSchema } from "@/lib/db";

export const runtime = "nodejs";

const MAX_FAILS = 5;
const LOCK_MINUTES = 15;

function clientIp(request: Request): string {
  // x-real-ip ustawia Vercel na faktyczne IP klienta (trudniejsze do podrobienia niż
  // x-forwarded-for, który klient może wstępnie wypełnić fałszywymi wpisami).
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const xff = request.headers.get("x-forwarded-for");
  return (xff?.split(",")[0] || "unknown").trim();
}

export async function POST(request: Request) {
  const { login, password } = await request.json().catch(() => ({}));
  const ip = clientIp(request);

  // Blokada po nieudanych próbach (best-effort — działa gdy podłączona baza).
  let hasDb = false;
  try {
    await ensureSchema();
    hasDb = true;
    const rows = (await db()`SELECT fails, locked_until FROM login_attempts WHERE ip = ${ip}`) as {
      fails?: number; locked_until?: string;
    }[];
    const row = rows[0];
    if (row?.locked_until) {
      const left = Math.ceil((new Date(row.locked_until).getTime() - Date.now()) / 1000);
      if (left > 0) {
        return NextResponse.json({ ok: false, error: "locked", retryAfter: left }, { status: 429 });
      }
    }
  } catch {
    /* baza niedostępna — logujemy bez blokady */
  }

  if (checkCredentials(String(login ?? ""), String(password ?? ""))) {
    if (hasDb) { try { await db()`DELETE FROM login_attempts WHERE ip = ${ip}`; } catch {} }
    await setAdminCookie();
    return NextResponse.json({ ok: true });
  }

  // Błędne dane — zlicz próbę i ewentualnie zablokuj.
  let remaining = MAX_FAILS - 1;
  if (hasDb) {
    try {
      const r = (await db()`INSERT INTO login_attempts (ip, fails, updated_at)
        VALUES (${ip}, 1, now())
        ON CONFLICT (ip) DO UPDATE SET fails = login_attempts.fails + 1, updated_at = now()
        RETURNING fails`) as { fails?: number }[];
      const fails = Number(r[0]?.fails ?? 1);
      remaining = Math.max(0, MAX_FAILS - fails);
      if (fails >= MAX_FAILS) {
        const until = new Date(Date.now() + LOCK_MINUTES * 60_000);
        await db()`UPDATE login_attempts SET locked_until = ${until.toISOString()}, fails = 0 WHERE ip = ${ip}`;
        return NextResponse.json({ ok: false, error: "locked", retryAfter: LOCK_MINUTES * 60 }, { status: 429 });
      }
    } catch {
      /* ignoruj */
    }
  }

  return NextResponse.json({ ok: false, error: "bad", remaining }, { status: 401 });
}

export async function DELETE() {
  await clearAdminCookie();
  return NextResponse.json({ ok: true });
}
