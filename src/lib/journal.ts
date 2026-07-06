import { db, ensureSchema } from "@/lib/db";
import type { NormalizedEntry } from "@/lib/journalValidation";
import type { GoogleProfile, PendingSave } from "@/lib/googleOAuth";
import { catalogEntry } from "@/lib/catalog";
import { thumbSrc, imageKey } from "@/lib/dream";

// Miniatura wpisu: TA SAMA logika co strona snu — obrazek slugu, a jak go nie ma,
// obrazek rodzica (reuse). Dzięki temu np. „nowa-ciaza" pokazuje obrazek „ciaza".
function resolveThumb(slug: string | null): string | null {
  if (!slug) return null;
  const parent = catalogEntry(slug)?.parent ?? slug;
  return thumbSrc(imageKey(slug, parent));
}

// Warstwa danych Dziennika snów. KAŻDE zapytanie mutujące/czytające wpis filtruje po
// user_id — użytkownik nigdy nie dosięgnie cudzego wpisu (IDOR/ownership). Soft delete
// przez deleted_at; hard delete tylko przy usunięciu konta (RODO).

export interface EntryRow {
  id: string;
  user_id: string;
  dream_symbol_id: string | null;
  dream_slug: string | null;
  title: string;
  dream_date: string | null;
  saved_at: string;
  source_url: string | null;
  source_type: string;
  interpretation_snapshot: unknown;
  user_description: string | null;
  user_notes: string | null;
  mood: string | null;
  emotions: string[];
  people: string[];
  places: string[];
  colors: string[];
  tags: string[];
  is_recurring: boolean;
  memory_strength: number | null;
  sleep_quality: number | null;
  visibility: string;
  status: string;
  premium_analysis_status: string;
  created_at: string;
  updated_at: string;
}

// Upsert użytkownika po zalogowaniu Google. Kluczem jest e-mail (lower) — dzięki temu
// logowanie Google łączy się z ewentualnym kontem e-mail o tym samym adresie (jedno
// konto, jeden dziennik). Zwraca wewnętrzne user_id (uuid).
//
// BEZPIECZEŃSTWO (anti pre-hijacking): rejestracja e-mailem nie weryfikuje adresu, więc
// napastnik mógłby założyć konto na cudzy e-mail i czekać, aż ofiara zaloguje się przez
// Google (Google potwierdza własność adresu). Przy PIERWSZYM połączeniu z Google
// (gdy istniejące konto nie miało jeszcze google_sub) zerujemy password_hash — ewentualne
// hasło ustawione wcześniej przez napastnika przestaje działać; kontrolę przejmuje
// zweryfikowany właściciel adresu z Google.
export async function upsertGoogleUser(p: GoogleProfile): Promise<string> {
  await ensureSchema();
  const email = p.email.toLowerCase();
  const rows = (await db()`
    INSERT INTO app_users (google_sub, email, name, avatar_url, provider, last_login_at)
    VALUES (${p.sub}, ${email}, ${p.name}, ${p.picture}, 'google', now())
    ON CONFLICT (lower(email)) DO UPDATE SET
      google_sub = COALESCE(app_users.google_sub, EXCLUDED.google_sub),
      name = COALESCE(EXCLUDED.name, app_users.name),
      avatar_url = COALESCE(EXCLUDED.avatar_url, app_users.avatar_url),
      password_hash = CASE WHEN app_users.google_sub IS NULL THEN NULL ELSE app_users.password_hash END,
      last_login_at = now(),
      updated_at = now(),
      deleted_at = NULL
    RETURNING id`) as { id: string }[];
  return rows[0].id;
}

// Szybki zapis (jedno kliknięcie / pending save po loginie). Dedup: jeśli symbol już
// zapisany jako quick-save i nieusunięty, zwraca istniejący wpis z duplicate=true.
export async function quickSave(
  userId: string,
  save: PendingSave,
  again = false,
): Promise<{ entry: EntryRow; duplicate: boolean }> {
  await ensureSchema();
  const slug = save.slug ?? null;
  const sourceType = save.sourceType === "search_result" ? "search_result" : "symbol_page";

  // „again": ten sam sen przyśnił się znowu — świadomie dodajemy KOLEJNY wpis.
  // Pomijamy deduplikację, a osobny source_type omija indeks unikalny (user_id, dream_slug).
  if (slug && !again) {
    const existing = (await db()`SELECT * FROM dream_journal_entries
      WHERE user_id = ${userId} AND dream_slug = ${slug} AND source_type = ${sourceType}
        AND deleted_at IS NULL
      ORDER BY saved_at DESC LIMIT 1`) as EntryRow[];
    if (existing[0]) return { entry: existing[0], duplicate: true };
  }

  const insertType = again ? "symbol_page_repeat" : sourceType;
  const tags = slug ? [slug] : [];
  const rows = (await db()`
    INSERT INTO dream_journal_entries
      (user_id, dream_slug, dream_symbol_id, title, dream_date, source_url, source_type, tags, is_recurring, status)
    VALUES (${userId}, ${slug}, ${save.symbolId ?? null}, ${save.title}, CURRENT_DATE,
            ${save.sourceUrl ?? null}, ${insertType}, ${JSON.stringify(tags)}::jsonb, ${again}, 'saved')
    ON CONFLICT (user_id, dream_slug) WHERE deleted_at IS NULL AND source_type = 'symbol_page'
    DO NOTHING
    RETURNING *`) as EntryRow[];

  if (!rows[0]) {
    // Wyścig (podwójne kliknięcie) — wpis powstał równolegle, pobierz istniejący.
    const race = (await db()`SELECT * FROM dream_journal_entries
      WHERE user_id = ${userId} AND dream_slug = ${slug} AND source_type = ${sourceType}
        AND deleted_at IS NULL
      ORDER BY saved_at DESC LIMIT 1`) as EntryRow[];
    return { entry: race[0], duplicate: true };
  }

  if (slug) {
    try {
      await db()`INSERT INTO dream_journal_entry_symbols (entry_id, symbol_slug, symbol_title)
        VALUES (${rows[0].id}, ${slug}, ${save.title})`;
    } catch {
      /* symbol powiązany opcjonalny */
    }
    // Powtórka → oznacz wszystkie wpisy tego snu jako powtarzające się.
    if (again) {
      await db()`UPDATE dream_journal_entries SET is_recurring = true, updated_at = now()
        WHERE user_id = ${userId} AND dream_slug = ${slug} AND deleted_at IS NULL`;
    }
  }
  return { entry: rows[0], duplicate: false };
}

// Pełny wpis ręczny (formularz „dodaj własny sen").
export async function createEntry(userId: string, n: NormalizedEntry): Promise<EntryRow> {
  await ensureSchema();
  const rows = (await db()`
    INSERT INTO dream_journal_entries
      (user_id, dream_slug, dream_symbol_id, title, dream_date, source_url, source_type,
       user_description, user_notes, mood, emotions, people, places, colors, tags,
       is_recurring, memory_strength, sleep_quality, status)
    VALUES (${userId}, ${n.dream_slug}, ${n.dream_symbol_id}, ${n.title}, ${n.dream_date},
            ${n.source_url}, ${n.source_type}, ${n.user_description}, ${n.user_notes}, ${n.mood},
            ${JSON.stringify(n.emotions)}::jsonb, ${JSON.stringify(n.people)}::jsonb,
            ${JSON.stringify(n.places)}::jsonb, ${JSON.stringify(n.colors)}::jsonb,
            ${JSON.stringify(n.tags)}::jsonb, ${n.is_recurring}, ${n.memory_strength},
            ${n.sleep_quality}, ${n.status})
    RETURNING *`) as EntryRow[];
  return rows[0];
}

export interface ListFilters {
  status?: string | null;
  symbol?: string | null;
  tag?: string | null;
  emotion?: string | null;
  recurring?: boolean | null;
  incompleteOnly?: boolean;
  sort?: "saved_at" | "dream_date";
}

export async function listEntries(userId: string, f: ListFilters = {}): Promise<EntryRow[]> {
  await ensureSchema();
  const status = f.status ?? null;
  const symbol = f.symbol ?? null;
  const tag = f.tag ?? null;
  const emotion = f.emotion ?? null;
  const recurring = f.recurring ?? null;
  const incompleteOnly = !!f.incompleteOnly;
  const byDate = f.sort === "dream_date";
  return (await db()`
    SELECT * FROM dream_journal_entries
    WHERE user_id = ${userId} AND deleted_at IS NULL
      AND (${status}::text IS NULL OR status = ${status})
      AND (${symbol}::text IS NULL OR dream_slug = ${symbol})
      AND (${tag}::text IS NULL OR jsonb_exists(tags, ${tag}))
      AND (${emotion}::text IS NULL OR jsonb_exists(emotions, ${emotion}))
      AND (${recurring}::bool IS NULL OR is_recurring = ${recurring})
      AND (NOT ${incompleteOnly} OR status <> 'completed')
    ORDER BY
      CASE WHEN ${byDate} THEN dream_date END DESC NULLS LAST,
      saved_at DESC`) as EntryRow[];
}

export async function getEntry(userId: string, id: string): Promise<EntryRow | null> {
  await ensureSchema();
  const rows = (await db()`SELECT * FROM dream_journal_entries
    WHERE id = ${id} AND user_id = ${userId} AND deleted_at IS NULL`) as EntryRow[];
  return rows[0] ?? null;
}

// Edycja: dociąga szczegóły do istniejącego wpisu. Zwraca null, jeśli nie należy do usera.
export async function updateEntry(
  userId: string,
  id: string,
  patch: Partial<NormalizedEntry>,
): Promise<EntryRow | null> {
  const cur = await getEntry(userId, id);
  if (!cur) return null;
  const m = {
    title: patch.title ?? cur.title,
    dream_slug: patch.dream_slug !== undefined ? patch.dream_slug : cur.dream_slug,
    dream_symbol_id: patch.dream_symbol_id !== undefined ? patch.dream_symbol_id : cur.dream_symbol_id,
    dream_date: patch.dream_date !== undefined ? patch.dream_date : cur.dream_date,
    source_url: patch.source_url !== undefined ? patch.source_url : cur.source_url,
    source_type: patch.source_type ?? cur.source_type,
    user_description: patch.user_description !== undefined ? patch.user_description : cur.user_description,
    user_notes: patch.user_notes !== undefined ? patch.user_notes : cur.user_notes,
    mood: patch.mood !== undefined ? patch.mood : cur.mood,
    emotions: patch.emotions ?? cur.emotions,
    people: patch.people ?? cur.people,
    places: patch.places ?? cur.places,
    colors: patch.colors ?? cur.colors,
    tags: patch.tags ?? cur.tags,
    is_recurring: patch.is_recurring ?? cur.is_recurring,
    memory_strength: patch.memory_strength !== undefined ? patch.memory_strength : cur.memory_strength,
    sleep_quality: patch.sleep_quality !== undefined ? patch.sleep_quality : cur.sleep_quality,
    status: patch.status ?? cur.status,
  };
  const rows = (await db()`
    UPDATE dream_journal_entries SET
      title = ${m.title}, dream_slug = ${m.dream_slug}, dream_symbol_id = ${m.dream_symbol_id},
      dream_date = ${m.dream_date}, source_url = ${m.source_url}, source_type = ${m.source_type},
      user_description = ${m.user_description}, user_notes = ${m.user_notes}, mood = ${m.mood},
      emotions = ${JSON.stringify(m.emotions)}::jsonb, people = ${JSON.stringify(m.people)}::jsonb,
      places = ${JSON.stringify(m.places)}::jsonb, colors = ${JSON.stringify(m.colors)}::jsonb,
      tags = ${JSON.stringify(m.tags)}::jsonb, is_recurring = ${m.is_recurring},
      memory_strength = ${m.memory_strength}, sleep_quality = ${m.sleep_quality},
      status = ${m.status}, updated_at = now()
    WHERE id = ${id} AND user_id = ${userId} AND deleted_at IS NULL
    RETURNING *`) as EntryRow[];
  return rows[0] ?? null;
}

// Soft delete pojedynczego wpisu (tylko własnego).
export async function softDeleteEntry(userId: string, id: string): Promise<boolean> {
  await ensureSchema();
  const rows = (await db()`UPDATE dream_journal_entries SET deleted_at = now()
    WHERE id = ${id} AND user_id = ${userId} AND deleted_at IS NULL
    RETURNING id`) as { id: string }[];
  return rows.length > 0;
}

// Soft delete wszystkich wpisów użytkownika (bez usuwania konta).
export async function softDeleteAllEntries(userId: string): Promise<number> {
  await ensureSchema();
  const rows = (await db()`UPDATE dream_journal_entries SET deleted_at = now()
    WHERE user_id = ${userId} AND deleted_at IS NULL RETURNING id`) as { id: string }[];
  return rows.length;
}

// Hard delete konta (RODO). Kasuje app_users -> kaskada usuwa wpisy i raporty.
export async function deleteAccount(userId: string): Promise<void> {
  await ensureSchema();
  await db()`DELETE FROM app_users WHERE id = ${userId}`;
}

// Kształt bezpieczny do wysłania klientowi (bez user_id itd. — choć to własne dane).
export function toClientEntry(e: EntryRow) {
  return {
    id: e.id,
    dreamSlug: e.dream_slug,
    thumbUrl: resolveThumb(e.dream_slug),
    title: e.title,
    dreamDate: e.dream_date,
    savedAt: e.saved_at,
    sourceUrl: e.source_url,
    sourceType: e.source_type,
    userDescription: e.user_description,
    userNotes: e.user_notes,
    mood: e.mood,
    emotions: e.emotions,
    people: e.people,
    places: e.places,
    colors: e.colors,
    tags: e.tags,
    isRecurring: e.is_recurring,
    memoryStrength: e.memory_strength,
    sleepQuality: e.sleep_quality,
    status: e.status,
    premiumAnalysisStatus: e.premium_analysis_status,
    createdAt: e.created_at,
    updatedAt: e.updated_at,
  };
}
