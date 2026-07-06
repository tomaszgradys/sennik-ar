import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateEntry, ValidationError } from "@/lib/journalValidation";
import { getEntry, updateEntry, softDeleteEntry, toClientEntry } from "@/lib/journal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Prosta walidacja uuid, żeby nie odpytywać bazy śmieciami.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function auth(): Promise<string | null> {
  const u = await getSessionUser(); // sprawdza też, czy konto istnieje (deleted_at IS NULL)
  return u?.id ?? null;
}

// GET /api/journal/:id — jeden wpis (tylko własny). 404 nie ujawnia, czy cudzy istnieje.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  const entry = await getEntry(userId, id);
  if (!entry) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  return NextResponse.json(
    { ok: true, entry: toClientEntry(entry) },
    { headers: { "cache-control": "no-store" } },
  );
}

// PATCH /api/journal/:id — dociąga/edytuje szczegóły własnego wpisu.
export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!(await checkRateLimit(`journal_write:${userId}`, 120, 3600))) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }
  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  try {
    const patch = validateEntry(body, true);
    const entry = await updateEntry(userId, id, patch);
    if (!entry) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true, entry: toClientEntry(entry) });
  } catch (e) {
    if (e instanceof ValidationError) {
      return NextResponse.json({ ok: false, error: "validation", field: e.field, message: e.message }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}

// DELETE /api/journal/:id — soft delete własnego wpisu.
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  const ok = await softDeleteEntry(userId, id);
  if (!ok) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
