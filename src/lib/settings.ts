import { db, ensureSchema } from "@/lib/db";

// Ustawienia serwisu w bazie (klucz→wartość). Na razie: częstotliwość bloga.
const BLOG_EVERY_DAYS = "blog_every_days";
const DEFAULT_BLOG_EVERY_DAYS = 1; // domyślnie codziennie
const MIN_DAYS = 1;
const MAX_DAYS = 30;

export function clampDays(n: unknown): number {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return DEFAULT_BLOG_EVERY_DAYS;
  return Math.min(MAX_DAYS, Math.max(MIN_DAYS, v));
}

// Co ile dni ma wychodzić wpis blogowy. Fallback: codziennie (1). Best-effort.
export async function getBlogEveryDays(): Promise<number> {
  try {
    await ensureSchema();
    const rows = (await db()`SELECT value FROM site_settings WHERE key = ${BLOG_EVERY_DAYS}`) as { value: string }[];
    if (!rows[0]) return DEFAULT_BLOG_EVERY_DAYS;
    return clampDays(rows[0].value);
  } catch {
    return DEFAULT_BLOG_EVERY_DAYS;
  }
}

export async function setBlogEveryDays(n: unknown): Promise<number> {
  const days = clampDays(n);
  await ensureSchema();
  await db()`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES (${BLOG_EVERY_DAYS}, ${String(days)}, now())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;
  return days;
}
