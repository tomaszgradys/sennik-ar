import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateEntry, ValidationError } from "@/lib/journalValidation";
import { createEntry, quickSave, listEntries, toClientEntry } from "@/lib/journal";
import type { PendingSave } from "@/lib/googleOAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/journal — quick-save (body.quick===true) albo pełny wpis ręczny.
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const userId = user.id;

  if (!(await checkRateLimit(`journal_write:${userId}`, 60, 3600))) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    if (body.quick === true) {
      const title = typeof body.title === "string" ? body.title.trim() : "";
      if (!title) return NextResponse.json({ ok: false, error: "bad_request", field: "title" }, { status: 400 });
      const save: PendingSave = {
        title: title.slice(0, 200),
        slug: typeof body.slug === "string" ? body.slug.slice(0, 120) : undefined,
        sourceUrl: typeof body.sourceUrl === "string" ? body.sourceUrl.slice(0, 500) : undefined,
        sourceType: body.sourceType === "search_result" ? "search_result" : "symbol_page",
        symbolId: typeof body.symbolId === "string" ? body.symbolId.slice(0, 120) : undefined,
      };
      const { entry, duplicate } = await quickSave(userId, save, body.again === true);
      return NextResponse.json({ ok: true, duplicate, entry: toClientEntry(entry) });
    }

    const normalized = validateEntry(body, false);
    const entry = await createEntry(userId, normalized as Required<typeof normalized>);
    return NextResponse.json({ ok: true, entry: toClientEntry(entry) });
  } catch (e) {
    if (e instanceof ValidationError) {
      return NextResponse.json({ ok: false, error: "validation", field: e.field, message: e.message }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}

// GET /api/journal?status=&symbol=&tag=&emotion=&recurring=&incomplete=&sort=
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const userId = user.id;

  const q = new URL(request.url).searchParams;
  const entries = await listEntries(userId, {
    status: q.get("status"),
    symbol: q.get("symbol"),
    tag: q.get("tag"),
    emotion: q.get("emotion"),
    recurring: q.get("recurring") === "1" ? true : q.get("recurring") === "0" ? false : null,
    incompleteOnly: q.get("incomplete") === "1",
    sort: q.get("sort") === "dream_date" ? "dream_date" : "saved_at",
  });
  return NextResponse.json(
    { ok: true, entries: entries.map(toClientEntry) },
    { headers: { "cache-control": "no-store" } },
  );
}
