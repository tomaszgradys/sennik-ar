// Dodaje POJEDYNCZE hasło do sennika (katalog + treść, jednym bezpośrednim
// wywołaniem API — bez batcha). Kombinacja dziedziczy obrazek rodzica.
//   node scripts/add-dream.mjs "skradziony rower" rower "podróże i pojazdy"
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = join(ROOT, "src", "data", "catalog.json");
const CONTENT = join(ROOT, "src", "data", "content");
const API = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-5";

function loadEnv() {
  const f = join(ROOT, ".env.local");
  if (!existsSync(f)) return;
  for (const l of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv();
const KEY = process.env.ANTHROPIC_API_KEY;
if (!KEY) throw new Error("Brak ANTHROPIC_API_KEY");
const H = { "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" };

const PL = { ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z" };
const slugify = (s) => s.toLowerCase().replace(/[ąćęłńóśźż]/g, (c) => PL[c] ?? c).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const SYSTEM = `Jesteś redaktorem polskiego sennika „Znaczenie snu" i psychologiem.
Piszesz UNIKALNE interpretacje snów własnymi słowami, nigdy nie kopiujesz cudzych
senników. Zawsze JEDNA spójna interpretacja (bez wersji „arabskiej" itp.).
KLIMAT: ciepła, stara księga snów, subtelna magia, spokój przy lampce nocnej.
TWARDE ZASADY:
- ZERO myślników/półpauz w środku zdań. Osobne zdania lub przecinki.
- Od pierwszego zdania konkret, bez wstępów.
- Zakazane klisze AI: „w dzisiejszych czasach", „warto zauważyć", „nie tylko… ale także", „podsumowując".
- Nie strasz. Bez kategorycznych przepowiedni i porad medycznych jako pewników. Poprawna polszczyzna i odmiana.
Odpowiadasz WYŁĄCZNIE poprawnym JSON (bez markdown). W wartościach NIE używaj surowych znaków nowej linii ani prostego cudzysłowu ("); cytaty zapisuj „polskimi".`;

const prompt = (phrase, parent) => `Fraza: "${phrase}" (podfraza symbolu „${parent}").
Już w pierwszym akapicie wyjaśnij, co ZMIENIA ten szczegół względem samego „${parent}".
Zwróć JSON o DOKŁADNIE takich polach:
{
 "gender": "m|f|n|pl",
 "locative": "fraza w miejscowniku po słowie o (np. 'skradziony rower'=>'skradzionym rowerze')",
 "metaDescription": "135-160 znaków, unikalny, zawiera frazę lub odmianę",
 "quickAnswer": "45-75 słów: co oznacza ten sen",
 "intro": "35-55 słów, wciągający lead, fraza w pierwszych słowach",
 "paragraphs": ["3-4 krótkie akapity"],
 "positive": "Dobre znaki: 45-70 słów",
 "negative": "Na co uważać: 45-70 słów, delikatnie",
 "advice": "Wskazówka na dziś: 40-65 słów",
 "faq": [{"q":"realne pytanie z Google","a":"40-70 słów"}]
}
faq: dokładnie 4-5 pytań. gender i locative MUSZĄ być poprawne gramatycznie.`;

const CTRL = /[ -]+/g;
const phrase = process.argv[2];
const parentArg = process.argv[3];
const category = process.argv[4] || "rzeczy codzienne i symbole";
if (!phrase) throw new Error('Użycie: node scripts/add-dream.mjs "fraza" [rodzic] [kategoria]');

const slug = slugify(phrase);
const parent = parentArg ? slugify(parentArg) : slug;
const type = parent === slug ? "symbol" : "combo";

const catalog = JSON.parse(readFileSync(CATALOG, "utf8"));
if (catalog.some((e) => e.slug === slug)) { console.log(`Już istnieje: ${slug}`); process.exit(0); }

const res = await fetch(API, { method: "POST", headers: H, body: JSON.stringify({
  model: MODEL, max_tokens: 3200, system: SYSTEM, messages: [{ role: "user", content: prompt(phrase, parent) }],
}) });
if (!res.ok) throw new Error(`${res.status}: ${(await res.text()).slice(0, 200)}`);
const data = await res.json();
const t = data.content.map((b) => b.text ?? "").join("");
const json = JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1).replace(CTRL, " "));

// katalog
catalog.push({ slug, phrase, parent, category, priority: 2, type });
writeFileSync(CATALOG, JSON.stringify(catalog));

// tresc do sharda rodzica
const shardFile = join(CONTENT, `${parent}.json`);
const shard = existsSync(shardFile) ? JSON.parse(readFileSync(shardFile, "utf8")) : {};
shard[slug] = json;
writeFileSync(shardFile, JSON.stringify(shard));

// _published
const pubFile = join(CONTENT, "_published.json");
const pub = new Set(JSON.parse(readFileSync(pubFile, "utf8")));
pub.add(slug);
writeFileSync(pubFile, JSON.stringify([...pub]));

console.log(`Dodano: ${slug} (parent=${parent}, type=${type}). quickAnswer: ${json.quickAnswer.slice(0, 90)}…`);
