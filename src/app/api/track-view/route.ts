import { NextResponse } from "next/server";
import { bumpBlogView } from "@/lib/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SLUG = /^[a-z0-9-]{2,120}$/;

// POST /api/track-view {slug} — zlicza wejście na artykuł bloga (beacon z klienta,
// bo strony bloga są statyczne/ISR i nie wykonują kodu per wejście). Zawsze 204.
export async function POST(request: Request) {
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
