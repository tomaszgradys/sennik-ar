// Walidator jakości treści snów (A06 audytu) — strażnik pre-publish / CI.
// Skanuje wszystkie OPUBLIKOWANE wpisy (_published.json) w shardach content/*.json
// i odrzuca: placeholdery, puste pola wymagane, za krótkie akapity, zdublowane
// metaDescription/quickAnswer, uszkodzone FAQ. ERROR => exit 1 (blokuje build/CI).
// WARN => tylko raport. Użycie: node scripts/validate-content.mjs [--strict]
//   --strict: traktuj też WARN jako błąd (exit 1).
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT_DIR = join(ROOT, "src", "data", "content");
const STRICT = process.argv.includes("--strict");

const PUBLISHED = new Set(JSON.parse(readFileSync(join(CONTENT_DIR, "_published.json"), "utf8")));

// Zbierz treść wszystkich slugów ze wszystkich shardów (plik rodzica = {parent, combos…}).
const content = new Map();
for (const f of readdirSync(CONTENT_DIR)) {
  if (!f.endsWith(".json") || f.startsWith("_")) continue;
  const shard = JSON.parse(readFileSync(join(CONTENT_DIR, f), "utf8"));
  for (const [slug, c] of Object.entries(shard)) content.set(slug, c);
}

// Reguły długości (na podstawie diagnozy audytu: min. akapitów ~506 zn, meta 135-160).
// Arabski jest gęstszy niż łaciński — 95-120 zn to zdrowa meta. WARN dopiero poza szerokim zakresem.
const META_MIN = 90, META_MAX = 180;          // WARN poza; twardy błąd tylko gdy skrajnie
const META_HARD_MIN = 60;                       // ERROR: meta krótsza niż to = zepsuta
const PROSE_MIN = 300;                           // ERROR: suma intro+akapity poniżej = thin
const PARA_MIN = 40;                             // ERROR: akapit krótszy = pusty/urwany
const REQUIRED = ["metaDescription", "quickAnswer", "intro", "positive", "negative", "advice"];
const PLACEHOLDER = /placeholder|lorem ipsum|\bTODO\b|\bTBD\b|xxxx/i;

const errors = [];
const warns = [];
const metaSeen = new Map();   // metaDescription -> pierwszy slug (wykrywanie duplikatów)
const quickSeen = new Map();

function isBlank(v) { return v == null || (typeof v === "string" && v.trim() === ""); }
function hasPlaceholder(v) {
  if (typeof v === "string") return PLACEHOLDER.test(v);
  if (Array.isArray(v)) return v.some(hasPlaceholder);
  if (v && typeof v === "object") return Object.values(v).some(hasPlaceholder);
  return false;
}

let checked = 0;
for (const slug of PUBLISHED) {
  const c = content.get(slug);
  if (!c) { errors.push(`${slug}: BRAK treści (opublikowany bez wpisu w content/)`); continue; }
  checked++;

  // Placeholder w jakimkolwiek polu.
  if (hasPlaceholder(c)) errors.push(`${slug}: zawiera placeholder/lorem/TODO`);

  // Pola wymagane niepuste.
  for (const field of REQUIRED) {
    if (isBlank(c[field])) errors.push(`${slug}: puste pole „${field}"`);
  }

  // metaDescription długość.
  const meta = (c.metaDescription || "").trim();
  if (meta) {
    if (meta.length < META_HARD_MIN) errors.push(`${slug}: metaDescription skrajnie krótka (${meta.length} zn)`);
    else if (meta.length < META_MIN || meta.length > META_MAX) warns.push(`${slug}: metaDescription ${meta.length} zn (poza ${META_MIN}-${META_MAX})`);
    // Duplikat metaDescription.
    if (metaSeen.has(meta)) errors.push(`${slug}: metaDescription zduplikowana z „${metaSeen.get(meta)}"`);
    else metaSeen.set(meta, slug);
  }

  // quickAnswer duplikat.
  const qa = (c.quickAnswer || "").trim();
  if (qa) {
    if (quickSeen.has(qa)) errors.push(`${slug}: quickAnswer zduplikowany z „${quickSeen.get(qa)}"`);
    else quickSeen.set(qa, slug);
  }

  // Akapity: tablica, każdy sensownej długości, suma prozy nie thin.
  const paras = Array.isArray(c.paragraphs) ? c.paragraphs : [];
  if (paras.length === 0) errors.push(`${slug}: brak akapitów (paragraphs)`);
  for (const [i, p] of paras.entries()) {
    if (isBlank(p)) errors.push(`${slug}: akapit ${i + 1} pusty`);
    else if (p.trim().length < PARA_MIN) errors.push(`${slug}: akapit ${i + 1} za krótki (${p.trim().length} zn)`);
  }
  const prose = ((c.intro || "") + " " + paras.join(" ")).trim().length;
  if (prose < PROSE_MIN) errors.push(`${slug}: treść thin (${prose} zn intro+akapity < ${PROSE_MIN})`);

  // FAQ: tablica, każdy z niepustym q i a, bez placeholderów.
  const faq = Array.isArray(c.faq) ? c.faq : [];
  if (faq.length === 0) warns.push(`${slug}: brak FAQ`);
  for (const [i, item] of faq.entries()) {
    if (!item || isBlank(item.q) || isBlank(item.a)) errors.push(`${slug}: FAQ ${i + 1} ma puste q/a`);
  }
}

console.log(`Sprawdzono ${checked}/${PUBLISHED.size} opublikowanych wpisów.`);
if (warns.length) {
  console.log(`\n⚠ Ostrzeżenia (${warns.length}):`);
  for (const w of warns.slice(0, 40)) console.log(`  - ${w}`);
  if (warns.length > 40) console.log(`  …i ${warns.length - 40} więcej`);
}
if (errors.length) {
  console.log(`\n✗ BŁĘDY (${errors.length}):`);
  for (const e of errors.slice(0, 60)) console.log(`  - ${e}`);
  if (errors.length > 60) console.log(`  …i ${errors.length - 60} więcej`);
}

const fail = errors.length > 0 || (STRICT && warns.length > 0);
if (fail) {
  console.log(`\nWYNIK: ODRZUCONE (${errors.length} błędów${STRICT ? `, ${warns.length} ostrzeżeń [strict]` : ""}).`);
  process.exit(1);
}
console.log(`\nWYNIK: OK${warns.length ? ` (${warns.length} ostrzeżeń, nieblokujących)` : ""}.`);
