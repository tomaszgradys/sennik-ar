import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { db, ensureSchema } from "@/lib/db";
import { blogOverview } from "@/lib/blogSchedule";
import { getBlogEveryDays, setBlogEveryDays } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Endpoint dla centralnego huba (portal sterowania). Autoryzacja: Bearer HUB_SYNC_SECRET
// (wspÃ³lny sekret ustawiony w env huba i kaÅ¼dego klona). GET = statystyki, POST = ustawienia.
const SITE = { key: "ar", name: "Hulm.pro", url: "https://hulm.pro", locale: "ar" };

function authorized(req: NextRequest): boolean {
  const secret = process.env.HUB_SYNC_SECRET;
  if (!secret) return false;
  const got = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(got);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

// KaÅ¼da sekcja liczona niezaleÅ¼nie â€” klon bez danej tabeli (np. brak kont
// uÅ¼ytkownikÃ³w) zwraca null zamiast wywalaÄ‡ caÅ‚Ä… odpowiedÅº.
async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

async function searchSection() {
  await ensureSchema();
  const rows = (await db()`
    SELECT to_char(day, 'YYYY-MM-DD') AS day, metric, value
    FROM daily_metrics
    WHERE day >= CURRENT_DATE - INTERVAL '29 days'`) as {
    day: string;
    metric: string;
    value: number;
  }[];
  const days = new Map<string, { day: string; total: number; found: number; miss: number; blogView: number }>();
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.set(key, { day: key, total: 0, found: 0, miss: 0, blogView: 0 });
  }
  for (const r of rows) {
    const p = days.get(r.day);
    if (!p) continue;
    const v = Number(r.value) || 0;
    if (r.metric === "search_total") p.total = v;
    else if (r.metric === "search_found") p.found = v;
    else if (r.metric === "search_miss") p.miss = v;
    else if (r.metric === "blog_view") p.blogView = v;
  }
  const list = [...days.values()];
  const totals = list.reduce(
    (a, d) => ({
      total: a.total + d.total,
      found: a.found + d.found,
      miss: a.miss + d.miss,
      blogView: a.blogView + d.blogView,
    }),
    { total: 0, found: 0, miss: 0, blogView: 0 },
  );
  const topMisses = (await db()`
    SELECT query, hits, to_char(last_at, 'YYYY-MM-DD') AS last_at
    FROM search_misses ORDER BY hits DESC, last_at DESC LIMIT 50`) as {
    query: string;
    hits: number;
    last_at: string;
  }[];
  const missCount = (await db()`SELECT count(*)::int AS c FROM search_misses`) as { c: number }[];
  return {
    days: list,
    totals,
    hitRate: totals.total > 0 ? Math.round((totals.found / totals.total) * 1000) / 10 : null,
    topMisses: topMisses.map((m) => ({ query: m.query, hits: Number(m.hits) || 0, lastAt: m.last_at })),
    missCountTotal: missCount[0] ? Number(missCount[0].c) : 0,
  };
}

async function usersSection() {
  await ensureSchema();
  const [t] = (await db()`SELECT count(*)::int AS c FROM app_users WHERE deleted_at IS NULL`) as { c: number }[];
  const [a] = (await db()`
    SELECT count(*)::int AS c FROM app_users
    WHERE deleted_at IS NULL AND last_login_at >= now() - INTERVAL '30 days'`) as { c: number }[];
  const [n] = (await db()`
    SELECT count(*)::int AS c FROM app_users
    WHERE deleted_at IS NULL AND created_at >= now() - INTERVAL '30 days'`) as { c: number }[];
  const [e] = (await db()`
    SELECT count(*)::int AS c FROM dream_journal_entries WHERE deleted_at IS NULL`) as { c: number }[];
  const [m3] = (await db()`
    SELECT count(*)::int AS c FROM (
      SELECT user_id FROM dream_journal_entries
      WHERE deleted_at IS NULL GROUP BY user_id HAVING count(*) >= 3
    ) t`) as { c: number }[];
  return {
    total: Number(t?.c) || 0,
    active30d: Number(a?.c) || 0,
    new30d: Number(n?.c) || 0,
    journalEntries: Number(e?.c) || 0,
    withMin3Journal: Number(m3?.c) || 0,
  };
}

async function extrasSection() {
  await ensureSchema();
  const [s] = (await db()`SELECT count(*)::int AS c FROM submissions WHERE status = 'new'`) as { c: number }[];
  const [cd] = (await db()`SELECT count(*)::int AS c FROM custom_dreams`) as { c: number }[];
  return { newSubmissions: Number(s?.c) || 0, customDreams: Number(cd?.c) || 0 };
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const ov = blogOverview();
  const [everyDays, search, users, extras] = await Promise.all([
    safe(() => getBlogEveryDays()),
    safe(searchSection),
    safe(usersSection),
    safe(extrasSection),
  ]);
  return NextResponse.json(
    {
      site: SITE,
      generatedAt: new Date().toISOString(),
      blog: {
        publishedCount: ov.publishedCount,
        lastPublishedAt: ov.recent[0]?.date ?? null,
        recent: ov.recent.slice(0, 5),
        everyDays,
      },
      search,
      users,
      extras,
    },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: { action?: string; days?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  if (body.action === "set_blog_every_days") {
    try {
      const days = await setBlogEveryDays(body.days);
      return NextResponse.json({ ok: true, everyDays: days });
    } catch {
      return NextResponse.json({ error: "db error" }, { status: 500 });
    }
  }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
