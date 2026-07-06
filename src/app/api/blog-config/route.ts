import { NextResponse } from "next/server";
import { getBlogEveryDays } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/blog-config — PUBLICZNE, tylko odczyt częstotliwości bloga.
// Czytane przez scripts/blog-gate.mjs w GitHub Actions (bez sekretów bazy w CI).
export async function GET() {
  const everyDays = await getBlogEveryDays();
  return NextResponse.json({ everyDays }, { headers: { "cache-control": "no-store" } });
}
