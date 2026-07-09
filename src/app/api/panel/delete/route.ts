import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { db, ensureSchema } from "@/lib/db";

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ ok: false }, { status: 401 });
  const { type, id } = await request.json().catch(() => ({ type: "", id: "" }));
  await ensureSchema();
  if (type === "miss") {
    await db()`DELETE FROM search_misses WHERE query = ${String(id)}`;
  } else if (type === "sentence") {
    await db()`DELETE FROM search_sentences WHERE query = ${String(id)}`;
  }
  return NextResponse.json({ ok: true });
}
