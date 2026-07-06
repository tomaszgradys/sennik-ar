// Walidacja i normalizacja danych wpisu dziennika — WYŁĄCZNIE server-side.
// Nie ufamy niczemu z frontendu. Rzuca ValidationError przy błędnych danych.
// XSS: treści tekstowe zapisujemy surowe, ale renderujemy przez React (auto-escape) i
// NIGDY nie wstrzykujemy jako HTML — dlatego tu nie „czyścimy" tekstu, tylko limitujemy.

export class ValidationError extends Error {
  constructor(public field: string, msg: string) {
    super(msg);
  }
}

const SOURCE_TYPES = new Set(["manual", "symbol_page", "search_result"]);
const STATUSES = new Set(["saved", "draft", "completed"]);

// Usuwa znaki sterujące (poza tab=9 i newline=10 oraz DEL=127) bez regexa z surowymi
// znakami sterującymi w źródle.
function clean(s: string): string {
  let out = "";
  for (const ch of s) {
    const code = ch.codePointAt(0)!;
    if (code < 32 && code !== 9 && code !== 10) continue;
    if (code === 127) continue;
    out += ch;
  }
  return out.trim();
}

function str(v: unknown, field: string, max: number, required = false): string | null {
  if (v == null || v === "") {
    if (required) throw new ValidationError(field, "wymagane");
    return null;
  }
  if (typeof v !== "string") throw new ValidationError(field, "musi być tekstem");
  const c = clean(v);
  if (c.length === 0) {
    if (required) throw new ValidationError(field, "wymagane");
    return null;
  }
  if (c.length > max) throw new ValidationError(field, `za długie (max ${max})`);
  return c;
}

function slug(v: unknown, field: string): string | null {
  const s = str(v, field, 120);
  if (s == null) return null;
  if (!/^[a-z0-9-]+$/.test(s)) throw new ValidationError(field, "nieprawidłowy slug");
  return s;
}

function dateISO(v: unknown, field: string): string | null {
  const s = str(v, field, 10);
  if (s == null) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new ValidationError(field, "data w formacie YYYY-MM-DD");
  const d = new Date(`${s}T00:00:00Z`);
  const y = d.getUTCFullYear();
  if (Number.isNaN(d.getTime()) || y < 1900 || y > 2100) throw new ValidationError(field, "nieprawidłowa data");
  return s;
}

function int1to5(v: unknown, field: string): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1 || n > 5) throw new ValidationError(field, "wartość 1–5");
  return n;
}

function bool(v: unknown): boolean {
  return v === true || v === "true" || v === 1 || v === "1";
}

// Lista krótkich tagów/emocji: tablica stringów, każdy <=50 zn., max 30, bez pustych/duplikatów.
function stringList(v: unknown, field: string): string[] {
  if (v == null) return [];
  if (!Array.isArray(v)) throw new ValidationError(field, "musi być listą");
  const out: string[] = [];
  for (const item of v) {
    if (typeof item !== "string") continue;
    const c = clean(item);
    if (!c) continue;
    if (c.length > 50) throw new ValidationError(field, "element za długi (max 50)");
    if (!out.includes(c)) out.push(c);
    if (out.length >= 30) break;
  }
  return out;
}

export interface NormalizedEntry {
  title: string;
  dream_slug: string | null;
  dream_symbol_id: string | null;
  dream_date: string | null;
  source_url: string | null;
  source_type: string;
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
  status: string;
}

// Waliduje pełny wpis (tworzenie ręczne / quick-save). partial=true dla PATCH (edycja).
export function validateEntry(body: Record<string, unknown>, partial = false): Partial<NormalizedEntry> {
  const has = (k: string) => Object.prototype.hasOwnProperty.call(body, k);
  const out: Partial<NormalizedEntry> = {};

  if (!partial || has("title")) out.title = str(body.title, "title", 200, true)!;
  if (!partial || has("dream_slug")) out.dream_slug = slug(body.dream_slug, "dream_slug");
  if (!partial || has("dream_symbol_id")) out.dream_symbol_id = str(body.dream_symbol_id, "dream_symbol_id", 120);
  if (!partial || has("dream_date")) out.dream_date = dateISO(body.dream_date, "dream_date");
  if (!partial || has("source_url")) out.source_url = str(body.source_url, "source_url", 500);
  if (!partial || has("source_type")) {
    const st = str(body.source_type, "source_type", 30) ?? "manual";
    if (!SOURCE_TYPES.has(st)) throw new ValidationError("source_type", "nieprawidłowy typ źródła");
    out.source_type = st;
  }
  if (!partial || has("user_description")) out.user_description = str(body.user_description, "user_description", 5000);
  if (!partial || has("user_notes")) out.user_notes = str(body.user_notes, "user_notes", 5000);
  if (!partial || has("mood")) out.mood = str(body.mood, "mood", 50);
  if (!partial || has("emotions")) out.emotions = stringList(body.emotions, "emotions");
  if (!partial || has("people")) out.people = stringList(body.people, "people");
  if (!partial || has("places")) out.places = stringList(body.places, "places");
  if (!partial || has("colors")) out.colors = stringList(body.colors, "colors");
  if (!partial || has("tags")) out.tags = stringList(body.tags, "tags");
  if (!partial || has("is_recurring")) out.is_recurring = bool(body.is_recurring);
  if (!partial || has("memory_strength")) out.memory_strength = int1to5(body.memory_strength, "memory_strength");
  if (!partial || has("sleep_quality")) out.sleep_quality = int1to5(body.sleep_quality, "sleep_quality");
  if (!partial || has("status")) {
    const s = str(body.status, "status", 20) ?? "saved";
    if (!STATUSES.has(s)) throw new ValidationError("status", "nieprawidłowy status");
    out.status = s;
  }

  return out;
}
