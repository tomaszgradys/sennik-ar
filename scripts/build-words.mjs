// Buduje szeroką listę polskich rzeczowników (do podpowiadania w wyszukiwarce),
// żeby człowiek zawsze „znalazł" swoje słowo. -> src/data/words.json
// Merge między uruchomieniami. Uruchom: node scripts/build-words.mjs

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src", "data", "words.json");
const MODEL = "claude-sonnet-5";
const CONCURRENCY = 5;

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

const PL = { ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z" };
const slugify = (s) =>
  s.toLowerCase().replace(/[ąćęłńóśźż]/g, (c) => PL[c] ?? c).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const THEMES = [
  "zwierzęta (ssaki, ptaki, ryby, owady, gady, morskie)",
  "rośliny, drzewa, kwiaty, warzywa, owoce",
  "jedzenie, potrawy, napoje, słodycze",
  "ciało człowieka, narządy, części ciała",
  "ubrania, obuwie, dodatki, biżuteria",
  "przedmioty domowe, meble, sprzęty, naczynia",
  "narzędzia, materiały, budowa",
  "pojazdy, transport, części pojazdów",
  "budynki, pomieszczenia, miejsca w mieście",
  "natura, krajobraz, pogoda, zjawiska",
  "zawody i profesje",
  "ludzie, role rodzinne, relacje społeczne",
  "emocje, uczucia, stany psychiczne",
  "czynności i zdarzenia (rzeczowniki odczasownikowe: bieganie, spotkanie...)",
  "technologia, urządzenia, internet, media",
  "sport i rekreacja",
  "muzyka, sztuka, instrumenty, rozrywka",
  "szkoła, nauka, przedmioty szkolne, dokumenty",
  "religia, duchowość, symbole, święta",
  "kosmos, ciała niebieskie, zjawiska astronomiczne",
  "kolory, kształty, materiały, tekstury",
  "zdrowie, choroby, medycyna, lekarstwa",
  "pieniądze, praca, biznes, zakupy",
  "wydarzenia życiowe, ceremonie, uroczystości",
  "mitologia, fantastyka, istoty baśniowe",
  "abstrakcyjne pojęcia (los, czas, prawda, wolność...)",
  "podróże, wakacje, geografia, kraje",
  "przestępczość, zagrożenia, wojsko, broń",
];

async function ask(theme) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      system:
        "Jesteś leksykografem języka polskiego. Zwracasz WYŁĄCZNIE poprawny JSON: tablicę stringów, bez markdown.",
      messages: [
        {
          role: "user",
          content: `Podaj jak najwięcej (200-400) popularnych polskich RZECZOWNIKÓW z obszaru: ${theme}. Mianownik, liczba pojedyncza (chyba że słowo istnieje tylko w mnogiej). Tylko rzeczowniki, które ktoś mógłby zobaczyć/przeżyć we śnie. Zwróć JSON: tablica stringów. Bez duplikatów, bez zdań.`,
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`${res.status}: ${(await res.text()).slice(0, 120)}`);
  const data = await res.json();
  const t = data.content.map((b) => b.text ?? "").join("");
  return JSON.parse(t.slice(t.indexOf("["), t.lastIndexOf("]") + 1));
}

const byslug = new Map();
if (existsSync(OUT)) for (const w of JSON.parse(readFileSync(OUT, "utf8"))) byslug.set(w.slug, w);
console.log(`Start z ${byslug.size} słów.`);

const queue = [...THEMES];
async function worker() {
  while (queue.length) {
    const theme = queue.shift();
    try {
      const arr = await ask(theme);
      for (const raw of arr) {
        const word = String(raw).trim().toLowerCase();
        const slug = slugify(word);
        if (!slug || word.length < 2 || word.includes(" ")) continue;
        if (!byslug.has(slug)) byslug.set(slug, { word, slug });
      }
      writeFileSync(OUT, JSON.stringify([...byslug.values()]));
      console.log(`  …${byslug.size} słów (po: ${theme.slice(0, 30)})`);
    } catch (e) {
      console.log(`  ✗ ${e.message}`);
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
const words = [...byslug.values()].sort((a, b) => a.word.localeCompare(b.word, "pl"));
writeFileSync(OUT, JSON.stringify(words));
console.log(`Gotowe: ${words.length} słów -> ${OUT}`);
