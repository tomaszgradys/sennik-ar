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
    // UWAGA: serwis NIE zbiera danych osobowych ani wrażliwych (brak logowania,
    // kont, dziennika snów i formularza zgłoszeń). Tabele poniżej to wyłącznie
    // anonimowa analityka wyszukiwarki, treści z panelu admina i liczniki.

    // ── Sprzątanie compliance (idempotentne) ──────────────────────────────────
    // Trwale usuwa tabele danych osobowych/wrażliwych z każdej bazy, do której
    // ten kod się podłączy (produkcja + ewentualne klony). DROP ... IF EXISTS jest
    // bezpieczne i staje się no-opem, gdy tabele już nie istnieją. CASCADE zdejmuje
    // zależne klucze obce (dziennik, symbole, raporty).
    await sql`DROP TABLE IF EXISTS premium_analysis_reports CASCADE`;
    await sql`DROP TABLE IF EXISTS dream_journal_entry_symbols CASCADE`;
    await sql`DROP TABLE IF EXISTS dream_journal_entries CASCADE`;
    await sql`DROP TABLE IF EXISTS app_users CASCADE`;
    await sql`DROP TABLE IF EXISTS submissions CASCADE`;
    await sql`DROP TABLE IF EXISTS journal_rate_limits CASCADE`;
    await sql`DROP TABLE IF EXISTS dreams CASCADE`;
    await sql`DROP TABLE IF EXISTS users CASCADE`;

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
