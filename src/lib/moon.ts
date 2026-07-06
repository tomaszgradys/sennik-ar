// Fazy Księżyca liczone astronomicznie (bez zewnętrznego API, bez praw autorskich):
// wiek Księżyca = dni od znanego nowiu (2000-01-06 18:14 UTC) modulo miesiąc
// synodyczny. Dokładność ± kilka godzin — w zupełności wystarcza dla serwisu.
const SYNODIC = 29.53058867;
const REF_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

export interface MoonPhase {
  slug: string;
  name: string;
  emoji: string;
  // Opis fazy (stabilny dla całej fazy).
  starting: string;
  // Pula wskazówek „na dziś" w klimacie fazy — wybór rotuje po dacie (dailyMoonTip).
  tips: string[];
}

export const PHASES: MoonPhase[] = [
  {
    slug: "now",
    name: "Nów",
    emoji: "🌑",
    starting:
      "To symboliczny początek cyklu — najlepszy moment na planowanie i wyznaczanie intencji, jeszcze nie na wielkie starty.",
    tips: [
      "Zapisz dziś jeden cel na nadchodzący miesiąc. Mały, konkretny — i bądź dla siebie łagodny.",
      "Zamiast wielkich planów, nazwij dziś jedną intencję. Reszta z niej wyrośnie.",
      "Dobry wieczór na chwilę ciszy i pytanie: czego naprawdę chcę w tym miesiącu?",
      "Posprzątaj dziś jedno małe miejsce — zrobisz przestrzeń na nowe.",
      "Nie musisz dziś zaczynać wielkich spraw. Wystarczy je sobie wyobrazić.",
    ],
  },
  {
    slug: "przybywajacy-sierp",
    name: "Przybywający sierp",
    emoji: "🌒",
    starting:
      "Energia rośnie — dobry czas, by zrobić pierwszy mały krok w nowej sprawie.",
    tips: [
      "Zacznij od kwadransa pracy nad tym, co odkładasz. Potem nagrodź się spacerem.",
      "Zrób dziś pierwszy mały krok — nawet najmniejszy liczy się podwójnie.",
      "Wyślij tę jedną wiadomość, którą odkładasz. Otworzy więcej, niż myślisz.",
      "Dorzuć dziś jedną cegiełkę do sprawy, na której ci zależy.",
      "Energia rośnie — wykorzystaj poranek na to, co wymaga zapału.",
    ],
  },
  {
    slug: "pierwsza-kwadra",
    name: "Pierwsza kwadra",
    emoji: "🌓",
    starting:
      "Moment decyzji i pokonywania pierwszych przeszkód — działaj, nawet jeśli nie wszystko idzie gładko.",
    tips: [
      "Jedna trudna rozmowa lub decyzja dziś zdejmie ci ciężar z ramion. Dasz radę.",
      "Nie czekaj na idealny moment — dziś działanie znaczy więcej niż plan.",
      "Pokonaj dziś jedną małą przeszkodę, którą omijasz od tygodnia.",
      "Podejmij decyzję, którą odkładasz. Ulga przyjdzie szybciej niż żal.",
      "Postaw dziś granicę tam, gdzie od dawna jej brakuje.",
    ],
  },
  {
    slug: "przybywajacy-garb",
    name: "Przybywający garb",
    emoji: "🌔",
    starting:
      "Dopracowuj i poprawiaj — nowe sprawy zaczęte teraz zdążą dojrzeć przed pełnią.",
    tips: [
      "Dokończ coś, co jest „prawie gotowe”. Wieczorem odpocznij bez ekranu.",
      "Dopracuj dziś jeden szczegół, który do tej pory pomijałeś.",
      "Sprawdź, co jeszcze wymaga poprawki, zanim sprawa dojrzeje.",
      "Zrób dziś krok, który przybliża domknięcie, nie nowy początek.",
      "Wieczorem odłóż telefon wcześniej — jutro podziękujesz sobie za sen.",
    ],
  },
  {
    slug: "pelnia",
    name: "Pełnia",
    emoji: "🌕",
    starting:
      "Kulminacja cyklu — emocje bywają silniejsze, a sen płytszy. Świętuj efekty, ale wielkie starty przełóż o kilka dni.",
    tips: [
      "Zadbaj dziś o wyciszenie przed snem: ciepły prysznic, herbata, książka zamiast telefonu.",
      "Emocje bywają dziś silniejsze — daj sobie prawo do spokojniejszego wieczoru.",
      "Świętuj dziś jeden efekt, z którego jesteś dumny. Zasłużyłeś.",
      "Jeśli sen jest dziś płytszy, przyciemnij światła godzinę wcześniej.",
      "Wielkie starty przełóż o kilka dni. Dziś po prostu bądź.",
    ],
  },
  {
    slug: "ubywajacy-garb",
    name: "Ubywający garb",
    emoji: "🌖",
    starting:
      "Czas wniosków i dzielenia się tym, co się udało. Zamiast zaczynać — podsumuj.",
    tips: [
      "Podziękuj dziś komuś, kto ci ostatnio pomógł. Obojgu wam to poprawi dzień.",
      "Podsumuj dziś, co się udało — docenienie siebie też jest pracą.",
      "Podziel się z kimś tym, czego się ostatnio nauczyłeś.",
      "Zamiast zaczynać nowe, dopieść to, co już masz.",
      "Zwolnij dziś tempo — najlepsze wnioski przychodzą w ciszy.",
    ],
  },
  {
    slug: "ostatnia-kwadra",
    name: "Ostatnia kwadra",
    emoji: "🌗",
    starting:
      "Dobry moment na porządki i domykanie spraw — odpuść to, co już nie służy.",
    tips: [
      "Wykreśl z listy jedną rzecz, której naprawdę nie musisz robić. Ulga gwarantowana.",
      "Odpuść dziś jedną sprawę, która już ci nie służy.",
      "Zrób porządek w jednej szufladzie — głowa też to poczuje.",
      "Domknij dziś coś, co wisi od dawna. Nie musi być idealnie, ma być skończone.",
      "Powiedz „nie” tam, gdzie od dawna ciśnie się „tak z obowiązku”.",
    ],
  },
  {
    slug: "ubywajacy-sierp",
    name: "Ubywający sierp",
    emoji: "🌘",
    starting:
      "Cykl się domyka — zwolnij, regeneruj się i zbieraj siły na nowy początek.",
    tips: [
      "Połóż się dziś spać pół godziny wcześniej. Twoje sny będą wdzięczne.",
      "Zwolnij i zbieraj siły — nowy cykl zaraz się zacznie.",
      "Dziś nic nie musisz zaczynać. Regeneracja to też działanie.",
      "Zadbaj wieczorem o ciało: woda, ciepło, cisza.",
      "Odpuść dziś jedną rzecz z listy i po prostu odpocznij.",
    ],
  },
];

// Wiek Księżyca w dniach (0 = nów).
export function moonAge(date: Date): number {
  const days = (date.getTime() - REF_NEW_MOON) / 86400000;
  return ((days % SYNODIC) + SYNODIC) % SYNODIC;
}

// Oświetlenie tarczy 0–100%.
export function moonIllumination(date: Date): number {
  const age = moonAge(date);
  return Math.round(((1 - Math.cos((2 * Math.PI * age) / SYNODIC)) / 2) * 100);
}

export function moonPhase(date: Date): MoonPhase {
  const age = moonAge(date);
  if (age < 1.0) return PHASES[0];
  if (age < 6.38) return PHASES[1];
  if (age < 8.38) return PHASES[2];
  if (age < 13.77) return PHASES[3];
  if (age < 15.77) return PHASES[4];
  if (age < 21.15) return PHASES[5];
  if (age < 23.15) return PHASES[6];
  if (age < 28.5) return PHASES[7];
  return PHASES[0];
}

function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Wskazówka „na dziś": z puli danej fazy, ale rotowana po DACIE — więc zmienia się
// każdego dnia (a nie stoi przez całą fazę, jak wcześniej). Deterministyczna: ta sama
// dla wszystkich w danym dniu, stabilna w ciągu dnia.
export function dailyMoonTip(date = new Date()): string {
  const phase = moonPhase(date);
  const day = date.toISOString().slice(0, 10);
  return phase.tips[hashSeed(`moontip:${phase.slug}:${day}`) % phase.tips.length];
}
