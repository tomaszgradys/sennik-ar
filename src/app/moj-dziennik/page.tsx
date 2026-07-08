import type { Metadata } from "next";
import { getSessionUser } from "@/lib/session";
import { listEntries, toClientEntry } from "@/lib/journal";
import { oauthConfigured } from "@/lib/googleOAuth";
import JournalLogin from "@/components/JournalLogin";
import JournalDashboard, { type Entry } from "@/components/JournalDashboard";

// Prywatny panel — poza indeksem wyszukiwarek.
export const metadata: Metadata = {
  title: { absolute: "دفتر أحلامي — hulm.pro" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function MyJournalPage() {
  const user = await getSessionUser();
  if (!user) return <JournalLogin loginAvailable={oauthConfigured()} />;

  let entries: Entry[] = [];
  try {
    const rows = await listEntries(user.id);
    entries = rows.map(toClientEntry) as Entry[];
  } catch {
    /* baza chwilowo niedostępna — pokaż pusty panel */
  }

  return <JournalDashboard initialEntries={entries} userName={user.name} />;
}
