// Buduje bazę polskich imion z datami imienin (AI) -> src/data/names.json.
// UWAGA: daty imienin z modelu warto zweryfikować z oficjalnym kalendarzem
// (mogą być drobne rozbieżności). To wersja startowa.
// Uruchom: node scripts/build-names.mjs

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src", "data", "names.json");
const MODEL = "claude-sonnet-5";

function loadEnv() {
  const f = join(ROOT, ".env.local");
  if (!existsSync(f)) return;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv();
const KEY = process.env.ANTHROPIC_API_KEY;
if (!KEY) throw new Error("Brak ANTHROPIC_API_KEY");

const PL = { ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z" };
const slugify = (s) =>
  s.toLowerCase().replace(/[ąćęłńóśźż]/g, (c) => PL[c] ?? c).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

async function ask(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8000,
      system:
        "Jesteś ekspertem od polskich imion i kalendarza imienin. Zwracasz WYŁĄCZNIE poprawny JSON (bez markdown).",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const t = data.content.map((b) => b.text ?? "").join("");
  return JSON.parse(t.slice(t.indexOf("["), t.lastIndexOf("]") + 1));
}

function q(gender, group) {
  const g = gender === "f" ? "żeńskich" : "męskich";
  return `Podaj ${group} popularnych polskich imion ${g}. Dla każdego zwróć obiekt:
{"name":"Imię","gender":"${gender}","days":["DD.MM", ...]}
days = główne daty imienin w formacie DD.MM (1-3 najważniejsze). Zwróć JSON: tablicę obiektów. Bez duplikatów, tylko realne polskie imiona.`;
}

const calls = [
  q("m", "100 najbardziej"),
  q("m", "kolejnych 100 popularnych (inne niż wcześniej)"),
  q("m", "kolejnych 100 mniej popularnych, ale używanych"),
  q("f", "100 najbardziej"),
  q("f", "kolejnych 100 popularnych (inne niż wcześniej)"),
  q("f", "kolejnych 100 mniej popularnych, ale używanych"),
];

const byName = new Map();
// Dołącz do już zebranych (merge między uruchomieniami).
if (existsSync(OUT)) {
  for (const it of JSON.parse(readFileSync(OUT, "utf8"))) byName.set(it.slug, it);
  console.log(`Start z ${byName.size} istniejących imion.`);
}
for (const prompt of calls) {
  try {
    const arr = await ask(prompt);
    for (const it of arr) {
      if (!it?.name) continue;
      const slug = slugify(it.name);
      if (!slug || byName.has(slug)) continue;
      byName.set(slug, {
        name: it.name.trim(),
        slug,
        gender: it.gender === "f" ? "f" : "m",
        days: Array.isArray(it.days) ? it.days.filter(Boolean).slice(0, 3) : [],
      });
    }
    console.log(`  …zebrano ${byName.size} imion`);
  } catch (e) {
    console.log(`  ✗ ${e.message}`);
  }
}

const names = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name, "pl"));
writeFileSync(OUT, JSON.stringify(names));
console.log(`Gotowe: ${names.length} imion -> ${OUT}`);
