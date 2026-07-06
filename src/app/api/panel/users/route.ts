import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { listUsersWithStats } from "@/lib/adminUsers";
import { deleteAccount } from "@/lib/journal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/panel/users — lista użytkowników ze statystykami (tylko admin).
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  try {
    const users = await listUsersWithStats();
    return NextResponse.json({ ok: true, users }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}

// DELETE /api/panel/users?id=<uuid> — twarde usunięcie konta użytkownika + jego danych (RODO/admin).
export async function DELETE(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!UUID.test(id)) return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  try {
    await deleteAccount(id); // kaskada usuwa wpisy, symbole, raporty
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
