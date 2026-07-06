import { db, ensureSchema } from "./db";

// Podgląd użytkowników dla panelu admina: kto, ile ma snów, kiedy ostatnio aktywny.
// TYLKO metadane konta i liczby — nigdy treści snów (pozostają prywatne).
export interface AdminUserRow {
  id: string;
  email: string;
  name: string | null;
  provider: string;
  avatarUrl: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  entryCount: number;
  lastEntryAt: string | null;
}

export async function listUsersWithStats(): Promise<AdminUserRow[]> {
  await ensureSchema();
  const rows = (await db()`
    SELECT
      u.id, u.email, u.name, u.provider, u.avatar_url,
      u.created_at, u.last_login_at,
      COUNT(e.id) FILTER (WHERE e.deleted_at IS NULL)::int AS entry_count,
      MAX(e.saved_at) FILTER (WHERE e.deleted_at IS NULL) AS last_entry_at
    FROM app_users u
    LEFT JOIN dream_journal_entries e ON e.user_id = u.id
    WHERE u.deleted_at IS NULL
    GROUP BY u.id
    ORDER BY u.created_at DESC
    LIMIT 500`) as Array<{
    id: string;
    email: string;
    name: string | null;
    provider: string;
    avatar_url: string | null;
    created_at: string;
    last_login_at: string | null;
    entry_count: number;
    last_entry_at: string | null;
  }>;

  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name,
    provider: r.provider,
    avatarUrl: r.avatar_url,
    createdAt: r.created_at,
    lastLoginAt: r.last_login_at,
    entryCount: r.entry_count ?? 0,
    lastEntryAt: r.last_entry_at,
  }));
}
