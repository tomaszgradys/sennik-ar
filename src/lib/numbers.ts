import numbersData from "@/data/numbers.json";

export interface NumberContent {
  metaDescription: string;
  quickAnswer: string;
  symbolism: string[];
  inDreams: string;
  inDates: string;
  asDayMotif: string;
  positive: string;
  warn: string;
  advice: string;
  faq: { q: string; a: string }[];
}

// Sensowny, obszerny zbiór: 0-100 (najczęściej wyszukiwane) + liczby powtarzające
// się / „anielskie". Kolejność = kolejność na hubie /liczby.
export const NUMBERS: number[] = [
  ...Array.from({ length: 101 }, (_, i) => i), // 0-100
  // أرقام «ملائكية» متكررة رائجة على شبكات التواصل العربية
  111, 222, 333, 444, 555, 666, 777, 888, 999, 1010, 1111, 1212, 1234,
];

const CONTENT = numbersData as Record<string, NumberContent>;

export function isKnownNumber(n: string): boolean {
  return /^\d{1,4}$/.test(n) && CONTENT[n] != null;
}
export function numberContent(n: string): NumberContent | null {
  return CONTENT[n] ?? null;
}
export function numberSlugs(): string[] {
  return NUMBERS.filter((n) => CONTENT[String(n)]).map((n) => String(n));
}
export function numberPath(n: number | string): string {
  return `/liczby/${n}/`;
}
// Podobne liczby: sąsiednie z listy — do sekcji „podobne".
export function relatedNumbers(n: number, limit = 4): number[] {
  const i = NUMBERS.indexOf(n);
  if (i < 0) return NUMBERS.slice(0, limit);
  const around = [...NUMBERS.slice(Math.max(0, i - 2), i), ...NUMBERS.slice(i + 1, i + 3)];
  return around.slice(0, limit);
}
