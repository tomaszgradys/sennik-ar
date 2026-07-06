// Dodaje ELEMENTARNE hasła (rzeczowniki pospolite: mama, człowiek, chleb…) do
// katalogu sennika, żeby nie było luk w podstawach. Źródło: AI generuje per
// kategoria listę najbardziej podstawowych słów + twardy rdzeń „must-have".
//   node scripts/build-basics.mjs list    # generuj + dedupe -> scripts/.basics.json
//   node scripts/build-basics.mjs apply   # dopisz do src/data/catalog.json (type=symbol)
// Potem treść: node scripts/batch.mjs submit / fetch.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG_FILE = join(ROOT, "src", "data", "catalog.json");
const OUT = join(ROOT, "scripts", ".basics.json");
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
const slugify = (s) =>
  s.toLowerCase().trim().replace(/[ąćęłńóśźż]/g, (c) => PL[c] ?? c)
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// 12 kategorii sennika (jak w katalogu) — trzymamy spójność.
const CATEGORIES = [
  "zwierzęta",
  "ludzie i relacje",
  "ciało i zdrowie",
  "dom i miejsca",
  "natura i pogoda",
  "podróże i pojazdy",
  "technologia i internet",
  "praca pieniądze i szkoła",
  "rzeczy codzienne i symbole",
  "zagrożenia emocje i wydarzenia",
  "czynności i ruch",
  "jedzenie i napoje",
];

// Twardy rdzeń — absolutne podstawy, których model bywa zapomina. Gwarancja braku luk.
const CORE = {
  "ludzie i relacje": ["mama", "tata", "matka", "ojciec", "syn", "córka", "brat", "siostra",
    "babcia", "dziadek", "wnuk", "wnuczka", "ciocia", "wujek", "kuzyn", "kuzynka", "teść", "teściowa",
    "mąż", "żona", "narzeczony", "narzeczona", "chłopak", "dziewczyna", "przyjaciel", "przyjaciółka",
    "kolega", "koleżanka", "sąsiad", "sąsiadka", "człowiek", "ludzie", "dziecko", "niemowlę",
    "kobieta", "mężczyzna", "chłopiec", "dziewczynka", "rodzina", "rodzice", "znajomy", "obcy",
    "bliźniak", "wróg", "gość", "tłum", "para", "ksiądz", "lekarz", "nauczyciel", "policjant"],
  "ciało i zdrowie": ["głowa", "twarz", "oko", "oczy", "nos", "usta", "zęby", "ząb", "język",
    "ucho", "włosy", "broda", "ręka", "ręce", "dłoń", "palec", "noga", "nogi", "stopa", "kolano",
    "brzuch", "plecy", "serce", "krew", "kość", "skóra", "paznokieć", "łzy", "rana", "blizna",
    "choroba", "gorączka", "ból", "szpital"],
  "jedzenie i napoje": ["chleb", "woda", "mleko", "jajko", "mięso", "ryba", "owoc", "jabłko",
    "warzywo", "ziemniak", "zupa", "ciasto", "cukier", "sól", "kawa", "herbata", "wino", "piwo",
    "miód", "ser", "masło", "makaron", "ryż", "cebula", "czosnek", "orzech", "grzyb", "jagody"],
  "natura i pogoda": ["słońce", "księżyc", "gwiazda", "niebo", "chmura", "deszcz", "śnieg",
    "wiatr", "burza", "tęcza", "woda", "morze", "rzeka", "jezioro", "góra", "las", "drzewo",
    "kwiat", "trawa", "kamień", "ogień", "ziemia", "błyskawica", "mgła", "słońce"],
  "dom i miejsca": ["dom", "mieszkanie", "pokój", "kuchnia", "łazienka", "sypialnia", "okno",
    "drzwi", "dach", "schody", "ściana", "podłoga", "ogród", "kościół", "szkoła", "cmentarz",
    "most", "droga", "miasto", "wieś", "sklep", "łóżko", "stół", "krzesło", "lustro", "klucz"],
  "rzeczy codzienne i symbole": ["pieniądze", "złoto", "pierścionek", "zegar", "książka",
    "list", "zdjęcie", "nóż", "igła", "nić", "świeca", "lampa", "torba", "buty", "ubranie",
    "sukienka", "koszula", "czapka", "parasol", "walizka", "portfel", "telefon", "prezent"],
};

const SYSTEM =
  "Tworzysz listę haseł do polskiego sennika. Podajesz WYŁĄCZNIE elementarne, powszechnie znane rzeczowniki pospolite w mianowniku (l. pojedyncza, lub mnoga gdy naturalniejsza), które zwykli ludzie realnie wpisują szukając znaczenia snu. ZAKAZ: słowa rzadkie, techniczne, naukowe, wulgarne, obraźliwe, marki, nazwy własne, przymiotniki, czasowniki, hasła wieloczłonowe. Jedno hasło w jednym wierszu, bez numeracji, bez komentarzy, bez kropek.";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function askCategory(cat) {
  const body = {
    model: MODEL,
    max_tokens: 4000,
    system: SYSTEM,
    messages: [{
      role: "user",
      content: `Kategoria: „${cat}". Wypisz jak najwięcej (cel: 300-450) NAJBARDZIEJ podstawowych, codziennych rzeczowników z tej kategorii, o których może być sen. Od najpopularniejszych. Po jednym w wierszu, mianownik.`,
    }],
  };
  // Retry z backoffem — API bywa przeciążone (429/529) i zwraca pusto.
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(API, { method: "POST", headers: H, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 150)}`);
      const data = await res.json();
      const text = data.content.map((b) => b.text ?? "").join("");
      const words = parseWords(text);
      if (words.length >= 20) return words;
      throw new Error(`za mało słów (${words.length}, stop=${data.stop_reason})`);
    } catch (e) {
      if (attempt === 4) throw e;
      console.log(`    retry ${cat} (${attempt}): ${e.message}`);
      await sleep(2500 * attempt);
    }
  }
}

function parseWords(text) {
  return text.split(/\r?\n/).map((l) =>
    l.replace(/^[\s\-\*\d\.\)]+/, "").replace(/[.,;:]+$/, "").trim().toLowerCase()
  ).filter((w) =>
    w && w.length >= 2 && w.length <= 30 &&
    /^[a-ząćęłńóśźż]+(\s[a-ząćęłńóśźż]+)?$/.test(w) // 1-2 słowa, tylko litery
  );
}

async function list() {
  const catalog = JSON.parse(readFileSync(CATALOG_FILE, "utf8"));
  const existing = new Set(catalog.map((e) => e.slug));
  const picked = new Map(); // slug -> {phrase, category}

  const add = (word, cat) => {
    const phrase = word.trim().toLowerCase();
    const slug = slugify(phrase);
    if (!slug || slug.length < 2) return;
    if (existing.has(slug) || picked.has(slug)) return;
    picked.set(slug, { slug, phrase, parent: slug, category: cat, priority: 2, type: "symbol" });
  };

  // 0) Wczytaj dotychczasowy postęp (żeby douzupełniać, nie zaczynać od zera).
  if (existsSync(OUT)) {
    for (const e of JSON.parse(readFileSync(OUT, "utf8"))) {
      if (!existing.has(e.slug)) picked.set(e.slug, e);
    }
    console.log(`Wczytano z .basics.json: ${picked.size}`);
  }

  // 1) Twardy rdzeń (gwarancja podstaw).
  for (const [cat, words] of Object.entries(CORE)) for (const w of words) add(w, cat);

  // 2) AI per kategoria — pomijamy te już dobrze pokryte (>=100 słów).
  const perCat = (c) => [...picked.values()].filter((e) => e.category === c).length;
  for (const cat of CATEGORIES) {
    if (perCat(cat) >= 100) {
      console.log(`  ${cat}: mam ${perCat(cat)} — pomijam`);
      continue;
    }
    try {
      const before = picked.size;
      const words = await askCategory(cat);
      for (const w of words) add(w, cat);
      console.log(`  ${cat}: +${picked.size - before} (surowo ${words.length})`);
    } catch (e) {
      console.log(`  ✗ ${cat}: ${e.message}`);
    }
  }

  const out = [...picked.values()];
  writeFileSync(OUT, JSON.stringify(out, null, 0));
  console.log(`\nRAZEM nowych elementarnych haseł: ${out.length}`);
  console.log(`Zapisano: ${OUT}. Podgląd: apply doda je do catalog.json.`);
}

function apply() {
  if (!existsSync(OUT)) throw new Error("Brak scripts/.basics.json — najpierw: list");
  const catalog = JSON.parse(readFileSync(CATALOG_FILE, "utf8"));
  const existing = new Set(catalog.map((e) => e.slug));
  const basics = JSON.parse(readFileSync(OUT, "utf8")).filter((e) => !existing.has(e.slug));
  const merged = catalog.concat(basics);
  writeFileSync(CATALOG_FILE, JSON.stringify(merged));
  console.log(`Dopisano ${basics.length} symboli. Katalog: ${catalog.length} -> ${merged.length}.`);
  console.log("Następnie: node scripts/batch.mjs submit  (treść), potem fetch.");
}

const CLEAN_SYS =
  "Jesteś korektorem listy haseł do polskiego sennika. Dostajesz listę słów. Zwracasz WYŁĄCZNIE te, które są: poprawnie zapisanym, elementarnym, powszechnie znanym polskim rzeczownikiem pospolitym, o którym ludzie realnie śnią. USUWASZ: literówki i błędy ortograficzne, słowa rzadkie/naukowe/techniczne/gatunkowe (atlas), przymiotniki, czasowniki, hasła nienaturalne. Jeśli słowo ma oczywistą literówkę, podaj poprawną pisownię. Odpowiadasz samą listą: jedno słowo w wierszu, mianownik, bez numeracji i komentarzy.";

async function cleanChunk(words) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(API, {
        method: "POST", headers: H,
        body: JSON.stringify({
          model: MODEL, max_tokens: 4000, system: CLEAN_SYS,
          messages: [{ role: "user", content: `Lista do korekty:\n${words.join("\n")}` }],
        }),
      });
      if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 120)}`);
      const data = await res.json();
      const out = parseWords(data.content.map((b) => b.text ?? "").join(""));
      if (out.length >= Math.min(10, words.length / 3)) return out;
      throw new Error(`podejrzanie mało (${out.length}/${words.length}, stop=${data.stop_reason})`);
    } catch (e) {
      if (attempt === 4) { console.log(`    ✗ chunk: ${e.message}`); return words; }
      await sleep(2000 * attempt);
    }
  }
}

async function clean() {
  const catalog = JSON.parse(readFileSync(CATALOG_FILE, "utf8"));
  const existing = new Set(catalog.map((e) => e.slug));
  const raw = JSON.parse(readFileSync(OUT, "utf8"));
  // Tylko jednowyrazowe (odsiewamy compoundy/atlas). Grupujemy po kategorii.
  const byCat = new Map();
  for (const e of raw) {
    if (e.phrase.includes(" ")) continue;
    if (!byCat.has(e.category)) byCat.set(e.category, []);
    byCat.get(e.category).push(e.phrase);
  }
  const droppedMulti = raw.length - [...byCat.values()].reduce((n, a) => n + a.length, 0);
  console.log(`Wielowyrazowe odrzucone: ${droppedMulti}. Czyszczę resztę AI…`);

  const picked = new Map();
  const add = (word, cat) => {
    const phrase = word.trim().toLowerCase();
    const slug = slugify(phrase);
    if (!slug || slug.length < 2 || phrase.includes(" ")) return;
    if (existing.has(slug) || picked.has(slug)) return;
    picked.set(slug, { slug, phrase, parent: slug, category: cat, priority: 2, type: "symbol" });
  };
  for (const [cat, words] of byCat) {
    let kept = 0;
    for (let i = 0; i < words.length; i += 250) {
      const chunk = words.slice(i, i + 250);
      const out = await cleanChunk(chunk);
      const before = picked.size;
      for (const w of out) add(w, cat);
      kept += picked.size - before;
    }
    console.log(`  ${cat}: ${words.length} -> ${kept}`);
  }
  const result = [...picked.values()];
  writeFileSync(OUT, JSON.stringify(result, null, 0));
  console.log(`\nPo czyszczeniu: ${result.length} elementarnych haseł. Zapisano.`);
}

// Celowana korekta literówek: pytamy tylko o błędne hasła (mały output => niezawodne).
async function fixTypos() {
  const catalog = JSON.parse(readFileSync(CATALOG_FILE, "utf8"));
  const existing = new Set(catalog.map((e) => e.slug));
  const raw = JSON.parse(readFileSync(OUT, "utf8"));
  const words = raw.map((e) => e.phrase);
  const fixes = {}; // zle -> dobre  (dobre="" => usuń)
  const SYS =
    "Jesteś korektorem języka polskiego. Dostajesz listę słów. Znajdź TYLKO te z błędem ortograficznym/literówką LUB niebędące poprawnym polskim rzeczownikiem pospolitym. Zwróć WYŁĄCZNIE JSON: obiekt {\"błędne\":\"poprawne\"}. Jeśli słowa nie da się poprawić (nie istnieje, nonsens), wartość = \"\". Poprawne słowa POMIJASZ. Bez komentarzy.";
  for (let i = 0; i < words.length; i += 300) {
    const chunk = words.slice(i, i + 300);
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(API, {
          method: "POST", headers: H,
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001", max_tokens: 4000, system: SYS,
            messages: [
              { role: "user", content: chunk.join(", ") },
              { role: "assistant", content: "{" }, // prefill => wymusza czysty JSON
            ],
          }),
        });
        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json();
        const t = "{" + data.content.map((b) => b.text ?? "").join("");
        const obj = JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1));
        Object.assign(fixes, obj);
        break;
      } catch (e) {
        if (attempt === 3) console.log(`  ✗ chunk ${i}: ${e.message}`);
        else await sleep(1500 * attempt);
      }
    }
  }
  console.log(`Znalezione do poprawy/usunięcia: ${Object.keys(fixes).length}`);
  const seen = new Set();
  const out = [];
  for (const e of raw) {
    const fix = fixes[e.phrase];
    let phrase = e.phrase;
    if (fix !== undefined) {
      if (!fix || fix.trim() === "") { console.log(`  usuń: ${e.phrase}`); continue; }
      console.log(`  ${e.phrase} -> ${fix}`);
      phrase = fix.trim().toLowerCase();
    }
    const slug = slugify(phrase);
    if (!slug || slug.length < 2 || phrase.includes(" ")) continue;
    if (existing.has(slug) || seen.has(slug)) continue;
    seen.add(slug);
    out.push({ slug, phrase, parent: slug, category: e.category, priority: 2, type: "symbol" });
  }
  writeFileSync(OUT, JSON.stringify(out, null, 0));
  console.log(`Po korekcie: ${out.length} haseł. Zapisano.`);
}

const cmd = process.argv[2];
if (cmd === "list") await list();
else if (cmd === "clean") await clean();
else if (cmd === "fixtypos") await fixTypos();
else if (cmd === "apply") apply();
else console.log("Użycie: node scripts/build-basics.mjs list | clean | fixtypos | apply");
