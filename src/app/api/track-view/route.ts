import { NextResponse } from "next/server";
import { bumpBlogView } from "@/lib/stats";
import { overLimit, clientIp } from "@/lib/ipRateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SLUG = /^[a-z0-9-]{2,120}$/;

// Limit per IP — beacon licznika wejść bloga. Realny czytelnik wywołuje go raz na
// artykuł; wyższy pułap ucina próby sztucznego napompowania „najczęściej czytanych"
// i zalania bazy zapisami. Zawsze 204 (klient-beacon nie oczekuje treści).
const RL_MAX = 30;
const RL_WINDOW_MS = 60_000;

// POST /api/track-view {slug} — zlicza wejście na artykuł bloga (beacon z klienta,
// bo strony bloga są statyczne/ISR i nie wykonują kodu per wejście). Zawsze 204.
export async function POST(request: Request) {
  if (overLimit(`track:${clientIp(request)}`, RL_MAX, RL_WINDOW_MS)) {
    return new NextResponse(null, { status: 204 });
  }
  try {
    const { slug } = (await request.json().catch(() => ({}))) as { slug?: unknown };
    if (typeof slug === "string" && SLUG.test(slug)) {
      await bumpBlogView(slug);
    }
  } catch {
    /* ignore */
  }
  return new NextResponse(null, { status: 204 });
}
