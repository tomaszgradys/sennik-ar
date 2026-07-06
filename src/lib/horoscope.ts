// Horoskop dzienny: deterministyczny wybór zdań z puli, zasiany (znak + data) —
// każdy znak ma codziennie inny, ale stabilny w ciągu dnia tekst. Styl celowo
// inny niż faza Księżyca: relacje/finanse/energia zamiast "zaczynania spraw".
// TODO(AI): docelowo teksty dzienne może pisać model — pula to solidny fallback.

export interface ZodiacSign {
  slug: string;
  name: string;
  emoji: string;
  dates: string;
}

export const SIGNS: ZodiacSign[] = [
  { slug: "baran", name: "Baran", emoji: "♈", dates: "21.03–19.04" },
  { slug: "byk", name: "Byk", emoji: "♉", dates: "20.04–22.05" },
  { slug: "blizneta", name: "Bliźnięta", emoji: "♊", dates: "23.05–21.06" },
  { slug: "rak", name: "Rak", emoji: "♋", dates: "22.06–22.07" },
  { slug: "lew", name: "Lew", emoji: "♌", dates: "23.07–23.08" },
  { slug: "panna", name: "Panna", emoji: "♍", dates: "24.08–22.09" },
  { slug: "waga", name: "Waga", emoji: "♎", dates: "23.09–22.10" },
  { slug: "skorpion", name: "Skorpion", emoji: "♏", dates: "23.10–21.11" },
  { slug: "strzelec", name: "Strzelec", emoji: "♐", dates: "22.11–21.12" },
  { slug: "koziorozec", name: "Koziorożec", emoji: "♑", dates: "22.12–19.01" },
  { slug: "wodnik", name: "Wodnik", emoji: "♒", dates: "20.01–18.02" },
  { slug: "ryby", name: "Ryby", emoji: "♓", dates: "19.02–20.03" },
];

export const SIGN_BY_SLUG = new Map(SIGNS.map((s) => [s.slug, s]));

// Znak zodiaku dla danej daty (domyślnie dziś). Granice zgodne z SIGNS (md = mm*100+dd).
const SIGN_RANGES: { slug: string; from: number; to: number }[] = [
  { slug: "koziorozec", from: 1222, to: 1231 },
  { slug: "koziorozec", from: 101, to: 119 },
  { slug: "wodnik", from: 120, to: 218 },
  { slug: "ryby", from: 219, to: 320 },
  { slug: "baran", from: 321, to: 419 },
  { slug: "byk", from: 420, to: 522 },
  { slug: "blizneta", from: 523, to: 621 },
  { slug: "rak", from: 622, to: 722 },
  { slug: "lew", from: 723, to: 823 },
  { slug: "panna", from: 824, to: 922 },
  { slug: "waga", from: 923, to: 1022 },
  { slug: "skorpion", from: 1023, to: 1121 },
  { slug: "strzelec", from: 1122, to: 1221 },
];
export function currentSign(date = new Date()): ZodiacSign {
  const md = (date.getMonth() + 1) * 100 + date.getDate();
  const r = SIGN_RANGES.find((x) => md >= x.from && md <= x.to);
  return SIGN_BY_SLUG.get(r?.slug ?? "baran")!;
}

const LOVE = [
  "Masz dziś szansę poznać kogoś ciekawego — nie chowaj się za telefonem.",
  "Ktoś bliski czeka na twoją uwagę. Krótka, szczera rozmowa zdziała więcej niż prezent.",
  "Dobry dzień, by wyjaśnić drobne nieporozumienie — druga strona jest bardziej otwarta, niż myślisz.",
  "Twój urok osobisty działa dziś mocniej niż zwykle. Wykorzystaj to z klasą.",
  "Zamiast analizować — zapytaj wprost. Szczerość dziś zbliża.",
  "Miły gest bez okazji zostanie dziś zapamiętany na długo.",
  "Nie porównuj swojej relacji z cudzymi — dziś szczególnie mylą pozory.",
  "Samotność też bywa dobrym towarzystwem. Zrób dziś coś tylko dla siebie.",
];

const MONEY = [
  "Uważaj na zbędne wydatki — impuls z południa może wieczorem żałować.",
  "Dobry moment, by dokończyć zaległą sprawę zawodową. Docenią to szybciej, niż sądzisz.",
  "Nie podpisuj dziś niczego w pośpiechu. Jedna noc namysłu nic nie kosztuje.",
  "Twoja praca zostaje dziś zauważona — nie umniejszaj swoich zasług.",
  "Drobna oszczędność dziś to spokój za miesiąc. Odpuść jeden kaprys.",
  "Pomysł, który wraca do ciebie od tygodni, zasługuje na pierwszą notatkę.",
  "Współpraca zamiast rywalizacji — dziś to się po prostu opłaca.",
  "Sprawdź dziś jedną rzecz w swoich finansach, którą odkładasz. Zajmie 10 minut.",
];

const ENERGY = [
  "Energia dopisuje — zaplanuj ruch, choćby krótki spacer po zmroku.",
  "Twoje ciało prosi dziś o wodę i sen, nie o kolejną kawę.",
  "Napięcie zbiera się w karku — dwie minuty rozciągania zrobią różnicę.",
  "Dobry dzień na porządek w jednej szufladzie. Głowa też to poczuje.",
  "Nie bierz dziś wszystkiego na siebie. Jedno „nie” ochroni cały wieczór.",
  "Śniadanie zjedz dziś bez pośpiechu — reszta dnia pójdzie gładszym rytmem.",
  "Krótka drzemka lub chwila ciszy po południu odda ci wieczór z nawiązką.",
  "Świeże powietrze załatwi dziś więcej niż trzecia kawa.",
];

const ADVICE = [
  "Zaufaj pierwszej myśli — dziś intuicja ma dobrą passę.",
  "Nie wszystko wymaga twojej reakcji. Wybierz jedną bitwę.",
  "Uśmiech do nieznajomego wróci dziś do ciebie szybciej, niż myślisz.",
  "Zrób dziś jedną rzecz wolniej, ale porządnie.",
  "Poproś o pomoc — to znak siły, nie słabości.",
  "Mała życzliwość dla siebie samego to najlepsza inwestycja dnia.",
  "Odłóż telefon na godzinę. Świat poczeka, ty odpoczniesz.",
  "Dokończ zanim zaczniesz nowe — poczucie domknięcia doda ci skrzydeł.",
];

function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface DailyHoroscope {
  love: string;
  money: string;
  energy: string;
  advice: string;
}

export function dailyHoroscope(signSlug: string, date: Date): DailyHoroscope {
  const day = date.toISOString().slice(0, 10);
  const rnd = mulberry32(hashSeed(`${signSlug}:${day}`));
  const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
  return {
    love: pick(LOVE),
    money: pick(MONEY),
    energy: pick(ENERGY),
    advice: pick(ADVICE),
  };
}
