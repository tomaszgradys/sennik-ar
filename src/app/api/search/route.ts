import { NextResponse, after } from "next/server";
import { searchCorpus } from "@/lib/dream";
import { wordsCorpus } from "@/lib/words";
import { slugify } from "@/lib/polish";
import { db, ensureSchema } from "@/lib/db";
import { bumpMetric } from "@/lib/stats";
import { overLimit, clientIp } from "@/lib/ipRateLimit";

// Ochrona przed zalaniem serwera zapytaniami: limit per IP w oknie czasu.
// Wyszukiwarka jest debounce'owana (160 ms) i strzela dopiero po pauzie w pisaniu,
// więc realny człowiek robi kilka zapytań na wyszukanie — 40/10 s to duży zapas,
// a i tak ucina automaty/floody. Po przekroczeniu zwracamy 429 (klient traktuje to
// jak brak wyników — bez błędu w UI).
const RL_MAX = 40;
const RL_WINDOW_MS = 10_000;

// Czy zapytanie warto w ogóle zapisywać do bazy (miss/zdanie). Odsiewa śmieci,
// które mogłyby rozdmuchać tabele: za długie albo prawie bez liter.
function worthLogging(q: string): boolean {
  if (q.length > 80) return false;
  const letters = (q.match(/\p{L}/gu) || []).length;
  return letters >= 2;
}

// Dzienny licznik wyszukiwań: total + trafienie od razu (found) albo nie (miss).
// Liczymy tylko zapytania ≥3 znaki (mniej szumu z pojedynczych liter).
function trackSearch(q: string, found: boolean) {
  if (q.length < 3) return;
  after(async () => {
    await bumpMetric("search_total");
    await bumpMetric(found ? "search_found" : "search_miss");
  });
}

// Log nietrafionego zapytania do bazy (agregacja po treści) — dla panelu admina.
function logMiss(q: string) {
  if (!worthLogging(q)) return;
  after(async () => {
    try {
      await ensureSchema();
      await db()`INSERT INTO search_misses (query, hits, last_at)
        VALUES (${q}, 1, now())
        ON CONFLICT (query) DO UPDATE SET hits = search_misses.hits + 1, last_at = now()`;
    } catch {
      /* baza może nie być gotowa — ignorujemy */
    }
  });
}

// Log całych zdań wpisanych w wyszukiwarkę (osobno od missów — zdania zbieramy
// do analizy, ale NIE tworzymy z nich snów w panelu). found = slugi haseł,
// które udało się z tego zdania wyłowić.
function logSentence(q: string, slugs: string[]) {
  if (!worthLogging(q)) return;
  after(async () => {
    try {
      await ensureSchema();
      await db()`INSERT INTO search_sentences (query, hits, found, last_at)
        VALUES (${q}, 1, ${JSON.stringify(slugs)}::jsonb, now())
        ON CONFLICT (query) DO UPDATE SET hits = search_sentences.hits + 1,
          found = EXCLUDED.found, last_at = now()`;
      // Sprzątanie po debounce: usuń zapisane wcześniej urwane początki tego zdania
      // („śniło mi się że czarny", „śniło mi się że czarny pies”…).
      await db()`DELETE FROM search_sentences
        WHERE query <> ${q} AND ${q} LIKE query || '%'`;
    } catch {
      /* baza może nie być gotowa — ignorujemy */
    }
  });
}

// Wyszukiwarka: dokładne/podłańcuchowe dopasowanie; dla zdań i zapytań bez
// trafień — wyłowienie znanych haseł ze zdania (dopasowanie z grubsza odporne
// na odmianę); na końcu podpowiedzi rozmyte. Zwraca flagę exact + mode.

function bigrams(s: string): Set<string> {
  const set = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
  return set;
}
function dice(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return (2 * inter) / (a.size + b.size);
}

// Bigramy korpusu liczone raz (na potrzeby dopasowania rozmytego).
let _bg: { slug: string; phrase: string; parent: string; kind: string; hay: string; bg: Set<string> }[] | null =
  null;
function corpusBg() {
  if (_bg) return _bg;
  _bg = searchCorpus().map((r) => ({ ...r, bg: bigrams(r.hay) }));
  return _bg;
}

// Słowa-wypełniacze pomijane przy dopasowaniu (żeby „sen o czarnym kocie" trafiał
// w „czarny kot"). Zawiera też narracyjne wypełniacze zdań („śniło mi się, że…").
const STOP = new Set([
  // مفاتيح البحث الشائعة عن الأحلام
  "حلم", "حلمت", "حلمنا", "الحلم", "احلام", "منام", "المنام", "رؤيا", "رؤيه", "تفسير", "معنى", "معنا",
  "رايت", "رايته", "شفت", "شاهدت", "اري", "ارى", "كنت", "كان", "كانت",
  // أدوات وضمائر وحروف جر
  "ان", "انه", "انها", "في", "فى", "عن", "على", "الى", "من", "مع", "او", "ثم", "لكن", "بعد", "قبل",
  "ما", "ماذا", "هذا", "هذه", "ذلك", "الذي", "التي", "عندما", "حين", "حينما", "فجاه", "فجأه",
  "جدا", "قد", "لقد", "هل", "يا", "به", "بها", "له", "لها", "نفسي", "امس", "اليوم", "البارحه",
  "و", "ال", "اني", "انا",
]);

// اقتراحات «مثيرة» حين لا يطابق شيء — رموز شائعة في الثقافة العربية (موجودة في الكتالوج).
const INTERESTING = ["كلب", "ثعبان-اسود", "الموت", "الجن", "الكعبه", "تمر", "السحر", "الدم"];

function out(r: { slug: string; phrase: string; parent: string; kind: string }) {
  return { slug: r.slug, phrase: r.phrase, symbol: r.parent, kind: r.kind };
}

// Uproszczony rdzeń słowa: obcięcie typowych końcówek fleksyjnych (na slugach,
// więc bez diakrytyków). Od najdłuższej, rdzeń musi mieć ≥3 znaki.
const ENDINGS = [
  "iami", "iach", "owie", "ego", "emu", "iej", "ymi", "imi", "ami", "ach", "owi",
  "iem", "ym", "im", "ej", "om", "ow", "ie", "em", "e", "a", "y", "u", "o", "i",
];
function stem(t: string): string {
  for (const suf of ENDINGS) {
    if (t.endsWith(suf) && t.length - suf.length >= 3) return t.slice(0, -suf.length);
  }
  return t;
}
// Wyrównanie typowych wymian głosek w rdzeniu (wąż→węża, woda→wodzie, las→lesie).
// Uwaga: bez rz→r — łańcuch rz→r + e→a robił z „rzeki" fałszywe „rak"/„ręka".
function norm(t: string): string {
  return stem(t).replace(/dz/g, "d").replace(/e/g, "a");
}

// Dopasowanie tokenu odporne (z grubsza) na polską odmianę — rdzeń + wymiany
// głosek, bez pełnej lematyzacji: kot→kotem, czarny→czarnego, wąż→węża.
// Celowo ostrożne (pies≠piec, bałam≠bałagan): lepiej przegapić niż podpowiadać bzdury.
function tokenSim(a: string, b: string): boolean {
  if (a === b) return true;
  const sa = stem(a);
  const sb = stem(b);
  if (sa === sb) return true;
  if (norm(a) === norm(b)) return true;
  const short = Math.min(sa.length, sb.length);
  let l = 0;
  while (l < short && sa[l] === sb[l]) l++;
  return l >= 5 && l >= short - 1; // spadam→spadanie, wypadały→wypadające
}

// Łączniki pomijane w hasłach przy sprawdzaniu pokrycia („wąż W wodzie").
const CONNECT = new Set(["w", "we", "o", "z", "ze", "na", "do", "od", "u", "i", "a", "po", "dla", "bez", "pod", "nad", "przy", "sie"]);

// Wyłowienie znanych haseł ze zdania: hasło pasuje, gdy KAŻDY jego znaczący
// token (poza łącznikami) występuje wśród tokenów zdania (z tolerancją odmiany).
// Dłuższe/dokładniejsze frazy wyżej, słowa bez snu na końcu.
function extractPhrases(sentToks: string[]) {
  const found: (ReturnType<typeof out> & { toks: number; ex: number; prio: number })[] = [];

  function coverage(hay: string): { toks: number; ex: number } | null {
    const etoks = hay.split("-").filter((t) => !CONNECT.has(t));
    if (!etoks.length) return null;
    let ex = 0;
    for (const et of etoks) {
      let matched = false;
      let exact = false;
      for (const st of sentToks) {
        if (st === et) {
          matched = true;
          exact = true;
          break;
        }
        if (tokenSim(st, et)) matched = true;
      }
      if (!matched) return null;
      if (exact) ex++;
    }
    return { toks: etoks.length, ex };
  }

  for (const r of searchCorpus()) {
    const c = coverage(r.hay);
    if (c) found.push({ ...out(r), ...c, prio: 1 });
  }
  for (const r of wordsCorpus()) {
    const c = coverage(r.hay);
    if (c) found.push({ slug: r.slug, phrase: r.word, symbol: "", kind: "combo", ...c, prio: 0 });
  }

  found.sort(
    (a, b) => b.toks - a.toks || b.prio - a.prio || b.ex - a.ex || a.phrase.length - b.phrase.length
  );
  const seen = new Set<string>();
  const results: ReturnType<typeof out>[] = [];
  for (const f of found) {
    if (seen.has(f.slug)) continue;
    seen.add(f.slug);
    results.push({ slug: f.slug, phrase: f.phrase, symbol: f.symbol, kind: f.kind });
    if (results.length >= 10) break;
  }
  return results;
}

export function GET(request: Request) {
  // Limit per IP — chroni serwer i bazę przed zalaniem zapytaniami.
  if (overLimit(`search:${clientIp(request)}`, RL_MAX, RL_WINDOW_MS)) {
    return NextResponse.json(
      { results: [], exact: true, mode: "exact" },
      { status: 429, headers: { "Retry-After": "10" } }
    );
  }

  const raw = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  const q = raw.slice(0, 200);
  if (q.length < 2) return NextResponse.json({ results: [], exact: true, mode: "exact" });
  const needle = slugify(q);
  if (!needle) return NextResponse.json({ results: [], exact: true, mode: "exact" });

  // Tokeny zapytania bez słów-wypełniaczy (żeby „sen o czarnym kocie" == „czarny kot").
  // Cap na 12 znaczących tokenów — ogranicza pracę CPU (pętle korpus × tokeny)
  // przy złośliwie długich zapytaniach.
  const tokens = needle.split("-").filter((t) => t.length >= 2 && !STOP.has(t)).slice(0, 12);
  const query = tokens.length ? tokens : [needle];
  const joined = query.join("-");

  // Zdanie: dłuższa wypowiedź — zapisujemy ją do bazy (do analizy, bez tworzenia snu).
  const rawWords = q.split(/\s+/).filter(Boolean).length;
  const isSentence = rawWords >= 5 || tokens.length >= 4;

  // 1) Dopasowanie tokenowe (WSZYSTKIE tokeny muszą wystąpić — precyzja).
  const hits: { r: ReturnType<typeof searchCorpus>[number]; score: number }[] = [];
  for (const r of searchCorpus()) {
    let score = 0;
    let ok = true;
    for (const tok of query) {
      const idx = r.hay.indexOf(tok);
      if (idx === -1) {
        ok = false;
        break;
      }
      if (r.hay === tok) score += 60; // całe hasło == token
      else if (idx === 0 || r.hay[idx - 1] === "-") score += 15; // token na początku słowa
      else score += 4;
    }
    if (!ok) continue;
    if (r.hay.includes(joined)) score += 30; // spójne, w tej kolejności
    if (r.hay === joined) score += 60; // idealne trafienie całości
    if (r.kind === "symbol") score += 20; // symbole wyżej niż kombinacje
    score -= r.phrase.length * 0.05; // krótsze nieco wyżej
    hits.push({ r, score });
  }
  // Dopasowanie słów ze słownika (bez snu) — żeby człowiek zawsze „znalazł" słowo.
  const wordHits: { slug: string; word: string; score: number }[] = [];
  for (const r of wordsCorpus()) {
    let score = 0;
    let ok = true;
    for (const tok of query) {
      const idx = r.hay.indexOf(tok);
      if (idx === -1) {
        ok = false;
        break;
      }
      if (r.hay === tok) score += 60;
      else if (idx === 0 || r.hay[idx - 1] === "-") score += 15;
      else score += 4;
    }
    if (!ok) continue;
    if (r.hay === joined) score += 40;
    score -= r.word.length * 0.05;
    wordHits.push({ slug: r.slug, word: r.word, score });
  }

  if (hits.length || wordHits.length) {
    // Najpierw hasła z treścią, potem słowa bez snu (prowadzą do strony z alternatywami).
    const pub = hits.sort((a, b) => b.score - a.score).slice(0, 12).map(({ r }) => out(r));
    const seen = new Set(pub.map((x) => x.slug));
    const merged: ReturnType<typeof out>[] = [...pub];
    for (const w of wordHits.sort((a, b) => b.score - a.score)) {
      if (merged.length >= 14) break;
      if (seen.has(w.slug)) continue;
      seen.add(w.slug);
      merged.push({ slug: w.slug, phrase: w.word, symbol: "", kind: "combo" });
    }
    if (isSentence) logSentence(q, merged.slice(0, 6).map((m) => m.slug));
    trackSearch(q, true);
    return NextResponse.json({ results: merged, exact: true, mode: "exact" });
  }

  // 2) Brak ścisłych trafień -> wyłów znane hasła ze zdania/zapytania
  // (odporne na odmianę i dodatkowe słowa: „śniło mi się, że czarny pies…").
  const extracted = extractPhrases(tokens.length ? tokens : [needle]);
  if (extracted.length) {
    if (isSentence) logSentence(q, extracted.map((r) => r.slug));
    else if (q.length >= 3) logMiss(q);
    trackSearch(q, false);
    return NextResponse.json({
      results: extracted,
      exact: false,
      mode: isSentence ? "phrases" : "fuzzy",
    });
  }

  // 3) Nic nie wyłowiono -> zaloguj + podpowiedzi rozmyte + ciekawe.
  if (isSentence) logSentence(q, []);
  else if (q.length >= 3) logMiss(q);
  const results: ReturnType<typeof out>[] = [];
  if (!isSentence) {
    // Bigramy tylko dla krótkich zapytań — dla całych zdań dają przypadkowe wyniki.
    const nbg = bigrams(needle);
    results.push(
      ...corpusBg()
        .map((r) => ({ r, s: dice(nbg, r.bg) }))
        .filter((x) => x.s >= 0.3)
        .sort((a, b) => b.s - a.s)
        .slice(0, 6)
        .map((x) => out(x.r))
    );
  }

  const have = new Set(results.map((r) => r.slug));
  const bySlug = new Map(searchCorpus().map((r) => [r.slug, r]));
  for (const slug of INTERESTING) {
    if (results.length >= 8) break;
    const r = bySlug.get(slug);
    if (r && !have.has(r.slug)) {
      results.push(out(r));
      have.add(r.slug);
    }
  }

  trackSearch(q, false);
  return NextResponse.json({ results, exact: false, mode: "fuzzy" });
}
