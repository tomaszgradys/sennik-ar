import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";

// Zgłoszenia z formularza „nie znalazłeś snu?" -> tabela submissions -> panel admina.
export async function POST(request: Request) {
  const data = await request.json().catch(() => null);
  const body = String(data?.body ?? "").trim().slice(0, 1000);
  const email = data?.email ? String(data.email).trim().slice(0, 200) : null;
  if (body.length < 3) {
    return NextResponse.json({ ok: false, error: "صف الحلم في بضع كلمات." }, { status: 400 });
  }
  try {
    await ensureSchema();
    await db()`INSERT INTO submissions (body, email) VALUES (${body}, ${email})`;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "حدث خطأ ما." }, { status: 500 });
  }
}
