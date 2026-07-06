import { db, ensureSchema } from "@/lib/db";

// DB-backed rate limit (serverless nie dzieli pamięci między wywołaniami).
// Zwraca true, gdy akcja mieści się w limicie; false, gdy przekroczono.
// Best-effort: gdy baza niedostępna, nie blokujemy.
export async function checkRateLimit(key: string, max: number, windowSec: number): Promise<boolean> {
  try {
    await ensureSchema();
    const rows = (await db()`
      INSERT INTO journal_rate_limits (key, hits, window_start)
      VALUES (${key}, 1, now())
      ON CONFLICT (key) DO UPDATE SET
        hits = CASE
          WHEN journal_rate_limits.window_start < now() - make_interval(secs => ${windowSec})
          THEN 1 ELSE journal_rate_limits.hits + 1 END,
        window_start = CASE
          WHEN journal_rate_limits.window_start < now() - make_interval(secs => ${windowSec})
          THEN now() ELSE journal_rate_limits.window_start END
      RETURNING hits`) as { hits: number }[];
    return Number(rows[0]?.hits ?? 1) <= max;
  } catch {
    return true;
  }
}
