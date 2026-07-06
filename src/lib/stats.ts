import { db, ensureSchema } from "@/lib/db";

// Lekki, agregowany tracking (dzienne liczniki) — bez logowania pojedynczych zdarzeń.
// Metryki: 'search_total', 'search_found', 'search_miss', 'blog_view'.

export async function bumpMetric(metric: string, by = 1): Promise<void> {
  try {
    await ensureSchema();
    await db()`
      INSERT INTO daily_metrics (day, metric, value)
      VALUES (CURRENT_DATE, ${metric}, ${by})
      ON CONFLICT (day, metric) DO UPDATE SET value = daily_metrics.value + ${by}`;
  } catch {
    /* best-effort */
  }
}

export async function bumpBlogView(slug: string): Promise<void> {
  try {
    await ensureSchema();
    await db()`
      INSERT INTO daily_metrics (day, metric, value) VALUES (CURRENT_DATE, 'blog_view', 1)
      ON CONFLICT (day, metric) DO UPDATE SET value = daily_metrics.value + 1`;
    await db()`
      INSERT INTO blog_views (slug, views, last_at) VALUES (${slug}, 1, now())
      ON CONFLICT (slug) DO UPDATE SET views = blog_views.views + 1, last_at = now()`;
  } catch {
    /* best-effort */
  }
}

export interface DayPoint {
  day: string; // YYYY-MM-DD
  searchTotal: number;
  searchFound: number;
  searchMiss: number;
  blogView: number;
}
export interface StatsData {
  days: DayPoint[]; // ostatnie 30 dni, rosnąco
  totals: { searchTotal: number; searchFound: number; searchMiss: number; blogView: number };
  topArticles: { slug: string; views: number }[];
  hasData: boolean;
}

const EMPTY: StatsData = {
  days: [],
  totals: { searchTotal: 0, searchFound: 0, searchMiss: 0, blogView: 0 },
  topArticles: [],
  hasData: false,
};

// Odczyt danych do panelu: 30 dni wstecz, uzupełnione zerami dla dni bez zdarzeń.
export async function getStats(): Promise<StatsData> {
  try {
    await ensureSchema();
    const rows = (await db()`
      SELECT to_char(day, 'YYYY-MM-DD') AS day, metric, value
      FROM daily_metrics
      WHERE day >= CURRENT_DATE - INTERVAL '29 days'`) as { day: string; metric: string; value: number }[];

    const map = new Map<string, DayPoint>();
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map.set(key, { day: key, searchTotal: 0, searchFound: 0, searchMiss: 0, blogView: 0 });
    }
    for (const r of rows) {
      const p = map.get(r.day);
      if (!p) continue;
      const v = Number(r.value) || 0;
      if (r.metric === "search_total") p.searchTotal = v;
      else if (r.metric === "search_found") p.searchFound = v;
      else if (r.metric === "search_miss") p.searchMiss = v;
      else if (r.metric === "blog_view") p.blogView = v;
    }
    const days = [...map.values()];
    const totals = days.reduce(
      (a, d) => ({
        searchTotal: a.searchTotal + d.searchTotal,
        searchFound: a.searchFound + d.searchFound,
        searchMiss: a.searchMiss + d.searchMiss,
        blogView: a.blogView + d.blogView,
      }),
      { searchTotal: 0, searchFound: 0, searchMiss: 0, blogView: 0 },
    );

    const top = (await db()`SELECT slug, views FROM blog_views ORDER BY views DESC LIMIT 8`) as {
      slug: string; views: number;
    }[];

    return {
      days,
      totals,
      topArticles: top.map((t) => ({ slug: t.slug, views: Number(t.views) || 0 })),
      hasData: totals.searchTotal + totals.blogView > 0,
    };
  } catch {
    return EMPTY;
  }
}
