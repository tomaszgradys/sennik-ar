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

// Miękka rotacja „popularnych snów na dziś": stały rdzeń najczęstszych motywów
// + delikatne przetasowanie zależne od daty, żeby strona nie była codziennie
// identyczna. Etykieta w UI: „أحلام شائعة" (nie statystyka).
//
// UWAGA (klon arabski hulm.pro): slugi są ARABSKIE, a nie polskie — poprzednia
// polska lista nie trafiała w żadne hasło, przez co strona główna cicho spadała
// do kolejności katalogu (pies, koń, krowa, cielę, ŚWINIA…). Poniżej kuratorska
// pula najczęściej wyszukiwanych snów w kulturze arabsko-muzułmańskiej,
// uszeregowana wg popularności i ŚWIADOMIE bez motywów drażliwych/haram na
// froncie (świnia, pies, alkohol, krzyż itp.). Wszystkie slugi są published.
const CORE_POPULAR = [
  "الماء",            // woda — życie/rizq, najczęstszy i pozytywny
  "الحمل",            // ciąża — bardzo często wyszukiwane
  "الاسنان",          // zęby (wypadające zęby) — uniwersalny top
  "افعي",             // wąż/żmija — „wróg", jeden z najczęstszych
  "طفل",              // dziecko/niemowlę
  "الذهب",            // złoto — bardzo popularne (rizq)
  "عرس",              // wesele/ślub
  "سمك",              // ryba — rizq, pozytywne
  "نقود",             // pieniądze
  "الموت",            // śmierć / widzenie zmarłego — jeden z najczęstszych
  "مطر",              // deszcz — miłosierdzie/rizq
  "عروس",             // panna młoda
  "القران",           // Koran — islamskie, pozytywne
  "الكعبه",           // Kaaba — islamskie, pozytywne
  "حصان",             // koń — szlachetny
  "بقره",             // krowa — koraniczny motyw, rizq
];
export function popularToday(date = new Date(), n = 8): string[] {
  const day = dayKey(date);
  const scored = CORE_POPULAR.map((slug) => ({ slug, s: hashSeed(`${slug}:${day}`) }));
  scored.sort((a, b) => a.s - b.s);
  return scored.slice(0, n).map((x) => x.slug);
}
