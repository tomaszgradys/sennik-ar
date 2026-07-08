import { publishedSymbols, allPublished } from "./dream";
import { COLORS, colorSlugs, type ColorMeta } from "./colors";
import { NUMBERS, numberSlugs } from "./numbers";
import { moonPhase, type MoonPhase } from "./moon";

// Deterministyczny wybór „dnia": ten sam dla wszystkich w danej dacie, zmienia się
// codziennie. Bez żadnych danych — czysta funkcja daty. To NIE statystyka, tylko
// łagodna rotacja motywów (patrz etykiety w UI: „na dziś", nie „najczęstsze").
function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function pickBy<T>(arr: T[], seed: string): T {
  return arr[hashSeed(seed) % arr.length];
}
export function dayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export interface DailyPicks {
  date: Date;
  symbol: { slug: string; phrase: string };
  dream: { slug: string; phrase: string };
  color: ColorMeta;
  number: number;
  moon: MoonPhase;
}

export function dailyPicks(date = new Date()): DailyPicks {
  const day = dayKey(date);
  const symbols = publishedSymbols();
  const dreams = allPublished();
  const cSlugs = colorSlugs();
  const nSlugs = numberSlugs();
  const symbol = pickBy(symbols, `symbol:${day}`);
  const dream = pickBy(dreams, `dream:${day}`);
  const colorSlug = cSlugs.length ? pickBy(cSlugs, `color:${day}`) : COLORS[0].slug;
  const numberSlug = nSlugs.length ? pickBy(nSlugs, `number:${day}`) : String(NUMBERS[0]);
  return {
    date,
    symbol: { slug: symbol.slug, phrase: symbol.phrase },
    dream: { slug: dream.slug, phrase: dream.phrase },
    color: COLORS.find((c) => c.slug === colorSlug) ?? COLORS[0],
    number: Number(numberSlug),
    moon: moonPhase(date),
  };
}

// „أحلام شائعة" — statyczna lista najpopularniejszych snów w kulturze
// arabsko-muzułmańskiej, uszeregowana wg popularności (najczęściej wyszukiwane
// najpierw). Bez rotacji: ta sama, stała kolejność każdego dnia.
//
// UWAGA (klon arabski hulm.pro): slugi są ARABSKIE, nie polskie — poprzednia
// polska lista (kot, waz…) nie trafiała w żadne hasło, przez co strona główna
// cicho spadała do kolejności katalogu (pies, koń, krowa, cielę, ŚWINIA…).
// Ta lista ŚWIADOMIE pomija motywy drażliwe/haram (świnia, alkohol, krzyż itp.).
// Wszystkie slugi są opublikowanymi symbolami (parent === slug).
export const POPULAR_SYMBOLS = [
  "الحمل",            // ciąża — pozytywny, jeden z najczęściej wyszukiwanych
  "الماء",            // woda — życie/rizq
  "الاسنان",          // zęby (wypadające) — uniwersalny top
  "افعي",             // wąż/żmija — „wróg", jeden z najczęstszych
  "الذهب",            // złoto — bardzo popularne (rizq)
  "طفل",              // dziecko/niemowlę
  "سمك",              // ryba — rizq, pozytywne
  "عرس",              // wesele/ślub
  "نقود",             // pieniądze
  "القران",           // Koran — islamskie, pozytywne
  "عروس",             // panna młoda
  "مطر",              // deszcz — miłosierdzie/rizq
];

// Najpopularniejsze symbole w stałej, kulturowej kolejności (do listy na froncie).
export function popularSymbols(n = 8): string[] {
  return POPULAR_SYMBOLS.slice(0, n);
}
