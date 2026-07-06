import type { Metadata } from "next";
import { isAdmin } from "@/lib/admin";
import { db, ensureSchema } from "@/lib/db";
import { catalogEntry, isPublished } from "@/lib/catalog";
import { slugify } from "@/lib/polish";
import PanelLogin from "@/components/PanelLogin";
import PanelDashboard from "@/components/PanelDashboard";
import { blogOverview } from "@/lib/blogSchedule";
import { estimateBlogCost, estimateSelfHostedCost } from "@/lib/blogCosts";
import { getBlogEveryDays } from "@/lib/settings";
import { getStats } from "@/lib/stats";

export const metadata: Metadata = {
  title: { absolute: "Panel — Znaczenie snu" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface Submission {
  id: number;
  body: string;
  email: string | null;
  status: string;
  created_at: string;
}
interface Miss {
  query: string;
  hits: number;
  last_at: string;
}
interface Sentence {
  query: string;
  hits: number;
  found: string[] | null;
  last_at: string;
}

export default async function PanelPage() {
  if (!(await isAdmin())) return <PanelLogin />;

  let submissions: Submission[] = [];
  let misses: Miss[] = [];
  let sentences: Sentence[] = [];
  try {
    await ensureSchema();
    submissions = (await db()`SELECT id, body, email, status, created_at
      FROM submissions ORDER BY created_at DESC LIMIT 200`) as Submission[];
    misses = (await db()`SELECT query, hits, last_at
      FROM search_misses ORDER BY hits DESC, last_at DESC LIMIT 200`) as Miss[];
    sentences = (await db()`SELECT query, hits, found, last_at
      FROM search_sentences ORDER BY last_at DESC LIMIT 200`) as Sentence[];

    // Ukryj hasła, które już MAMY (jako gotowa strona z plików albo dodane z panelu).
    // Stare wpisy „miss" sprzed dodania hasła nie mają się pokazywać (np. „mama").
    const custom = (await db()`SELECT slug FROM custom_dreams`) as { slug: string }[];
    const customSlugs = new Set(custom.map((r) => r.slug));
    misses = misses.filter((m) => {
      const slug = slugify(m.query);
      const exists = (!!catalogEntry(slug) && isPublished(slug)) || customSlugs.has(slug);
      return !exists;
    });
  } catch {
    /* baza chwilowo niedostępna */
  }

  const blog = blogOverview();
  const costs = estimateBlogCost();
  const selfHosted = estimateSelfHostedCost(costs.perBlogUsd);
  const blogEveryDays = await getBlogEveryDays();
  const stats = await getStats();

  return (
    <PanelDashboard
      submissions={submissions}
      misses={misses}
      sentences={sentences}
      blog={blog}
      costs={costs}
      selfHosted={selfHosted}
      blogEveryDays={blogEveryDays}
      stats={stats}
    />
  );
}
