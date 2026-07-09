import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/admin";
import { saveOverride } from "@/lib/custom";
import type { Content } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const slug = String(body.slug ?? "").trim();
  const phrase = String(body.phrase ?? "").trim();
  const content = body.content as Content | undefined;

  if (!slug) return NextResponse.json({ ok: false, error: "bad_slug" }, { status: 400 });
  if (!content || typeof content !== "object" || !Array.isArray(content.paragraphs) || !Array.isArray(content.faq)) {
    return NextResponse.json({ ok: false, error: "bad_content" }, { status: 400 });
  }

  // Porządkujemy: puste akapity/FAQ out.
  const clean: Content = {
    ...content,
    paragraphs: content.paragraphs.map((p) => String(p).trim()).filter(Boolean),
    faq: content.faq
      .map((f) => ({ q: String(f.q ?? "").trim(), a: String(f.a ?? "").trim() }))
      .filter((f) => f.q && f.a),
  };

  try {
    await saveOverride(slug, phrase || slug, clean);
  } catch {
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }

  try { revalidatePath(`/hulm/${slug}/`); } catch {}
  return NextResponse.json({ ok: true, path: `/hulm/${slug}/` });
}
