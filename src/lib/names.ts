import namesMeta from "@/data/names-meta.json";
import namesData from "@/data/names.json";

export type NameGender = "m" | "f";

export interface NameMeta {
  slug: string; // pismo arabskie znormalizowane (klucz URL)
  name: string; // pełny zapis z hamzą/tāʾ marbūṭa do wyświetlenia
  translit: string; // transliteracja łacińska (pomoc dla użytkownika + long-tail)
  gender: NameGender;
  origin: string; // pochodzenie (عربي / عبري itd.)
  meaning: string; // krótkie znaczenie leksykalne (na kafelku + nagłówku)
}

export interface NameContent {
  metaDescription: string;
  quickAnswer: string;
  meaningLong: string; // rozwinięcie znaczenia leksykalnego
  inDream: string[]; // akapity: تفسير رؤية الاسم في المنام
  forHer: string; // dla kobiety (dla imion widzianych przez/o kobiecie)
  positive: string;
  advice: string;
  faq: { q: string; a: string }[];
}

// Kolejność = kolejność wyświetlania w hubie (grupowane wg płci w komponencie).
export const NAMES: NameMeta[] = namesMeta as NameMeta[];

const BY_SLUG = new Map(NAMES.map((n) => [n.slug, n]));
const CONTENT = namesData as Record<string, NameContent>;

export function nameMeta(slug: string): NameMeta | null {
  return BY_SLUG.get(slug) ?? null;
}
export function nameContent(slug: string): NameContent | null {
  return CONTENT[slug] ?? null;
}
export function nameSlugs(): string[] {
  return NAMES.filter((n) => CONTENT[n.slug]).map((n) => n.slug);
}
export function namePath(slug: string): string {
  return `/asma/${slug}/`;
}
export function isKnownName(slug: string): boolean {
  return CONTENT[slug] != null;
}
export function namesByGender(gender: NameGender): NameMeta[] {
  return NAMES.filter((n) => n.gender === gender && CONTENT[n.slug]);
}
// Podobne imiona: tej samej płci, sąsiednie z listy — do sekcji „أسماء مشابهة".
export function relatedNames(slug: string, limit = 6): NameMeta[] {
  const cur = BY_SLUG.get(slug);
  if (!cur) return [];
  const same = namesByGender(cur.gender).filter((n) => n.slug !== slug);
  const i = same.findIndex((n) => n.slug === slug);
  const around = [...same.slice(Math.max(0, i - 3), i), ...same.slice(i + 1, i + 4)];
  return (around.length ? around : same).slice(0, limit);
}
