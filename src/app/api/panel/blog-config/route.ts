import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { getBlogEveryDays, setBlogEveryDays } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET  /api/panel/blog-config        — bieżąca częstotliwość (admin).
// POST /api/panel/blog-config {everyDays} — ustawienie częstotliwości bloga (admin).
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true, everyDays: await getBlogEveryDays() });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { everyDays?: unknown };
  try {
    const everyDays = await setBlogEveryDays(body.everyDays);
    return NextResponse.json({ ok: true, everyDays });
  } catch {
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
