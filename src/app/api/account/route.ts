import { NextResponse } from "next/server";
import { getSessionUser, SESSION_COOKIE, AUTH_FLAG_COOKIE } from "@/lib/session";
import { deleteAccount, softDeleteAllEntries } from "@/lib/journal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DELETE /api/account            → RODO: twarde usunięcie konta + wszystkich danych.
// DELETE /api/account?scope=entries → usunięcie wszystkich wpisów (konto zostaje).
export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const userId = user.id;

  const scope = new URL(request.url).searchParams.get("scope");

  if (scope === "entries") {
    const count = await softDeleteAllEntries(userId);
    return NextResponse.json({ ok: true, deleted: count });
  }

  await deleteAccount(userId); // kaskada usuwa wpisy, symbole, raporty
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE); // wyloguj — konta już nie ma
  res.cookies.delete(AUTH_FLAG_COOKIE);
  return res;
}
