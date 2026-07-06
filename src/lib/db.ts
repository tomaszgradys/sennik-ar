import { neon } from "@neondatabase/serverless";

// Klient Neon (HTTP, idealny na serverless Vercel). DATABASE_URL wstrzykuje Vercel
// w runtime (sekret, niepobierany lokalnie). Inicjalizacja leniwa — build nie potrzebuje URL.
let _sql: ReturnType<typeof neon> | null = null;
export function db() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("Brak DATABASE_URL (baza nie podłączona)");
    _sql = neon(url);
  }
  return _sql;
}

// Tworzenie tabel przy pierwszym użyciu (idempotentne, cache'owane w instancji) —
// zamiast osobnej migracji. Każda operacja na bazie robi najpierw ensureSchema().
let _schema: Promise<void> | null = null;
export function ensureSchema(): Promise<void> {
  if (_schema) return _schema;
  const sql = db();
  _schema = (async () => {
    await sql`CREATE TABLE IF NOT EXISTS users (
      id serial PRIMARY KEY,
      email text UNIQUE NOT NULL,
      password_hash text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS dreams (
      id serial PRIMARY KEY,
      user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title text,
      body text NOT NULL,
      dream_date date,
      mood text,
      created_at timestamptz NOT NULL DEFAULT now()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS submissions (
      id serial PRIMARY KEY,
      body text NOT NULL,
      email text,
      status text NOT NULL DEFAULT 'new',
      created_at timestamptz NOT NULL DEFAULT now()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS search_misses (
      query text PRIMARY KEY,
      hits int NOT NULL DEFAULT 1,
      last_at timestamptz NOT NULL DEFAULT now()
    )`;
    // Całe zdania wpisane w wyszukiwarkę — zbierane do analizy (panel), celowo
    // BEZ możliwości konwersji na sen. found = slugi haseł wyłowionych ze zdania.
    await sql`CREATE TABLE IF NOT EXISTS search_sentences (
      query text PRIMARY KEY,
      hits int NOT NULL DEFAULT 1,
      found jsonb NOT NULL DEFAULT '[]'::jsonb,
      last_at timestamptz NOT NULL DEFAULT now(),
      created_at timestamptz NOT NULL DEFAULT now()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS login_attempts (
      ip text PRIMARY KEY,
      fails int NOT NULL DEFAULT 0,
      locked_until timestamptz,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;
    // Sny dodane z panelu admina (runtime, bo Vercel ma read-only FS na pliki katalogu).
    await sql`CREATE TABLE IF NOT EXISTS custom_dreams (
      slug text PRIMARY KEY,
      phrase text NOT NULL,
      category text,
      content jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`;
    // Edycje snów z panelu (nakładka na treść z plików LUB custom_dreams).
    await sql`CREATE TABLE IF NOT EXISTS dream_overrides (
      slug text PRIMARY KEY,
      phrase text,
      content jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;

    // ── Dziennik snów ─────────────────────────────────────────────────────────
    // Użytkownicy końcowi (Google LUB e-mail+hasło) — ODDZIELNI od admina panelu.
    await sql`CREATE TABLE IF NOT EXISTS app_users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      google_sub text UNIQUE,
      email text NOT NULL,
      password_hash text,
      name text,
      avatar_url text,
      provider text NOT NULL DEFAULT 'google',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      last_login_at timestamptz,
      deleted_at timestamptz
    )`;
    // Migracje dla istniejącej bazy (idempotentne): konto e-mail + unikalny e-mail.
    await sql`ALTER TABLE app_users ALTER COLUMN google_sub DROP NOT NULL`;
    await sql`ALTER TABLE app_users ADD COLUMN IF NOT EXISTS password_hash text`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_app_users_email ON app_users (lower(email))`;

    // Wpisy dziennika. Wszystko domyślnie prywatne. Soft delete przez deleted_at.
    await sql`CREATE TABLE IF NOT EXISTS dream_journal_entries (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      dream_symbol_id text,
      dream_slug text,
      title text NOT NULL,
      dream_date date,
      saved_at timestamptz NOT NULL DEFAULT now(),
      source_url text,
      source_type text NOT NULL DEFAULT 'manual',
      interpretation_snapshot jsonb,
      user_description text,
      user_notes text,
      mood text,
      emotions jsonb NOT NULL DEFAULT '[]'::jsonb,
      people jsonb NOT NULL DEFAULT '[]'::jsonb,
      places jsonb NOT NULL DEFAULT '[]'::jsonb,
      colors jsonb NOT NULL DEFAULT '[]'::jsonb,
      tags jsonb NOT NULL DEFAULT '[]'::jsonb,
      is_recurring boolean NOT NULL DEFAULT false,
      memory_strength int,
      sleep_quality int,
      visibility text NOT NULL DEFAULT 'private',
      status text NOT NULL DEFAULT 'saved',
      premium_analysis_status text NOT NULL DEFAULT 'not_requested',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      deleted_at timestamptz
    )`;
    await sql`CREATE INDEX IF NOT EXISTS idx_journal_user
      ON dream_journal_entries (user_id, deleted_at, saved_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_journal_user_slug
      ON dream_journal_entries (user_id, dream_slug)`;
    // Jeden quick-save danego symbolu na użytkownika (ochrona przed duplikatem przy
    // podwójnym kliknięciu). Ręczne wpisy (source_type='manual') NIE są objęte — można
    // mieć wiele wpisów tego samego symbolu przez „Dodaj jako nowy wpis".
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_journal_symbol_save
      ON dream_journal_entries (user_id, dream_slug)
      WHERE deleted_at IS NULL AND source_type = 'symbol_page'`;

    // Symbole powiązane z wpisem (pod przyszłą analitykę: powtarzające się motywy).
    await sql`CREATE TABLE IF NOT EXISTS dream_journal_entry_symbols (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      entry_id uuid NOT NULL REFERENCES dream_journal_entries(id) ON DELETE CASCADE,
      symbol_slug text NOT NULL,
      symbol_title text,
      confidence real,
      created_at timestamptz NOT NULL DEFAULT now()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS idx_entry_symbols_entry
      ON dream_journal_entry_symbols (entry_id)`;

    // Raporty analizy premium — struktura na przyszłość (obecnie nieaktywne).
    await sql`CREATE TABLE IF NOT EXISTS premium_analysis_reports (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      entry_id uuid REFERENCES dream_journal_entries(id) ON DELETE SET NULL,
      period_start date,
      period_end date,
      analysis_type text NOT NULL DEFAULT 'patterns',
      status text NOT NULL DEFAULT 'not_requested',
      result_json jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;

    // Rate-limit dla akcji dziennika/logowania (DB-backed, bo serverless nie dzieli pamięci).
    await sql`CREATE TABLE IF NOT EXISTS journal_rate_limits (
      key text PRIMARY KEY,
      hits int NOT NULL DEFAULT 0,
      window_start timestamptz NOT NULL DEFAULT now()
    )`;
    // Proste ustawienia serwisu (klucz→wartość), np. częstotliwość bloga.
    await sql`CREATE TABLE IF NOT EXISTS site_settings (
      key text PRIMARY KEY,
      value text NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;
    // Dzienne liczniki (metryka+dzień → wartość): wyszukiwania, trafienia, wejścia bloga.
    await sql`CREATE TABLE IF NOT EXISTS daily_metrics (
      day date NOT NULL,
      metric text NOT NULL,
      value int NOT NULL DEFAULT 0,
      PRIMARY KEY (day, metric)
    )`;
    // Wejścia per artykuł bloga (all-time) — do listy „najczęściej czytane".
    await sql`CREATE TABLE IF NOT EXISTS blog_views (
      slug text PRIMARY KEY,
      views int NOT NULL DEFAULT 0,
      last_at timestamptz NOT NULL DEFAULT now()
    )`;
  })();
  return _schema;
}
