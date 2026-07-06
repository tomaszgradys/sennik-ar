// Alternatywy dla słów bez snu: AI (Haiku, Batch API) wybiera 4-6 najbardziej
// powiązanych symboli z naszej listy. Raz, potem statycznie (0 tokenów w runtime).
//   node scripts/build-alts.mjs submit
//   node scripts/build-alts.mjs fetch
// Wynik: src/data/words-alt.json = { wordSlug: [altSlug, ...] }

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src", "data", "words-alt.json");
const STATE = join(ROOT, "scripts", ".alts.json");
const API = "https://api.anthropic.com/v1/messages/batches";
const MODEL = "claude-haiku-4-5-20251001";

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
const slugify = (s) =>
  s.toLowerCase().replace(/[ąćęłńóśźż]/g, (c) => PL[c] ?? c).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const CATALOG = JSON.parse(readFileSync(join(ROOT, "src", "data", "catalog.json"), "utf8"));
const PUB = new Set(JSON.parse(readFileSync(join(ROOT, "src", "data", "content", "_published.json"), "utf8")));
const symbols = CATALOG.filter((e) => e.type === "symbol" && PUB.has(e.slug));
const symbolSlugs = new Set(symbols.map((e) => e.slug));
const symbolList = symbols.map((e) => e.phrase).join(", ");
const words = JSON.parse(readFileSync(join(ROOT, "src", "data", "words.json"), "utf8"));
const missing = words.filter((w) => !PUB.has(w.slug));

const SYSTEM =
  "Wskazujesz alternatywne hasła sennika. Wybierasz WYŁĄCZNIE z podanej listy. Zwracasz WYŁĄCZNIE JSON: tablicę wybranych nazw (dokładnie jak w liście).";
const prompt = (word) =>
  `Użytkownik szukał snu o: "${word}". Nie mamy tego hasła. Z listy naszych symboli sennika wybierz 4-6 NAJBARDZIEJ powiązanych znaczeniowo (podobny obiekt, temat lub skojarzenie senne) jako sensowne alternatywy. Nie wymyślaj nowych. Zwróć JSON: tablica ich nazw z listy.\n\nLista: ${symbolList}`;

async function submit() {
  const requests = missing.map((w, i) => ({
    custom_id: `r${i}`,
    params: { model: MODEL, max_tokens: 200, system: SYSTEM, messages: [{ role: "user", content: prompt(w.word) }] },
  }));
  console.log(`Wysyłam batch alternatyw: ${requests.length} słów…`);
  const res = await fetch(API, { method: "POST", headers: H, body: JSON.stringify({ requests }) });
  if (!res.ok) throw new Error(`${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  writeFileSync(STATE, JSON.stringify({ id: data.id, slugs: missing.map((w) => w.slug) }));
  console.log(`OK. Batch id: ${data.id} (${data.processing_status}). Sprawdzaj: fetch`);
}

async function fetchResults() {
  const { id, slugs } = JSON.parse(readFileSync(STATE, "utf8"));
  const st = await (await fetch(`${API}/${id}`, { headers: H })).json();
  console.log(`Status: ${st.processing_status}`, st.request_counts);
  if (st.processing_status !== "ended") return console.log("Jeszcze się liczy.");
  const raw = await (await fetch(st.results_url, { headers: H })).text();
  const alt = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
  let ok = 0, bad = 0;
  for (const line of raw.split(/\r?\n/).filter(Boolean)) {
    const r = JSON.parse(line);
    const slug = slugs[Number(r.custom_id.slice(1))];
    if (r.result?.type !== "succeeded") { bad++; continue; }
    try {
      const text = r.result.message.content.map((b) => b.text ?? "").join("");
      const arr = JSON.parse(text.slice(text.indexOf("["), text.lastIndexOf("]") + 1));
      const chosen = [...new Set(arr.map((x) => slugify(String(x))))].filter((s) => symbolSlugs.has(s)).slice(0, 6);
      if (chosen.length) { alt[slug] = chosen; ok++; } else bad++;
    } catch { bad++; }
  }
  writeFileSync(OUT, JSON.stringify(alt));
  console.log(`Zapisano alternatywy: ${ok} ok, ${bad} bez wyniku. Łącznie: ${Object.keys(alt).length}.`);
}

const cmd = process.argv[2];
if (cmd === "submit") await submit();
else if (cmd === "fetch") await fetchResults();
else console.log("Użycie: node scripts/build-alts.mjs submit | fetch");
