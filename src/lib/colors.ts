import colorsData from "@/data/colors.json";
import { allPublished } from "./dream";

export interface ColorMeta {
  slug: string;
  name: string; // mianownik, np. „czerwony"
  hex: string; // do swatcha/gradientu
  light?: boolean; // jasny kolor -> ciemny tekst na swatchu
}

export interface ColorContent {
  metaDescription: string;
  quickAnswer: string;
  meaning: string[];
  inDreams: string;
  inEmotions: string;
  inRelations: string;
  positive: string;
  warn: string;
  faq: { q: string; a: string }[];
}

// الترتيب = الترتيب في محور /kolory. slug عربي (مطبّع بلا همزة ليطابق slugify).
export const COLORS: ColorMeta[] = [
  { slug: "احمر", name: "أحمر", hex: "#C0392B" },
  { slug: "ازرق", name: "أزرق", hex: "#2E5A88" },
  { slug: "اخضر", name: "أخضر", hex: "#3E7C5A" },
  { slug: "اصفر", name: "أصفر", hex: "#E0B84C", light: true },
  { slug: "اسود", name: "أسود", hex: "#2B2B33" },
  { slug: "ابيض", name: "أبيض", hex: "#F3EFE7", light: true },
  { slug: "بنفسجي", name: "بنفسجي", hex: "#6E5AA0" },
  { slug: "وردي", name: "وردي", hex: "#D98BA6", light: true },
  { slug: "برتقالي", name: "برتقالي", hex: "#D98244", light: true },
  { slug: "رمادي", name: "رمادي", hex: "#8A8A92" },
  { slug: "بني", name: "بني", hex: "#7A5A42" },
  { slug: "ذهبي", name: "ذهبي", hex: "#C9A44A", light: true },
  { slug: "فضي", name: "فضي", hex: "#AEB4BC", light: true },
];

const BY_SLUG = new Map(COLORS.map((c) => [c.slug, c]));
const CONTENT = colorsData as Record<string, ColorContent>;

export function colorMeta(slug: string): ColorMeta | null {
  return BY_SLUG.get(slug) ?? null;
}
export function colorContent(slug: string): ColorContent | null {
  return CONTENT[slug] ?? null;
}
export function colorSlugs(): string[] {
  return COLORS.filter((c) => CONTENT[c.slug]).map((c) => c.slug);
}
export function colorPath(slug: string): string {
  return `/kolory/${slug}/`;
}

// Sny powiązane z kolorem — hasła z sennika, których slug zawiera nazwę koloru
// (np. „czarny" -> „czarny-kot", „czarny-pies"). Naturalne linkowanie kolor -> sennik.
export function dreamsWithColor(slug: string, limit = 8) {
  const out: { slug: string; phrase: string }[] = [];
  for (const e of allPublished()) {
    if (e.type !== "combo") continue;
    const parts = e.slug.split("-");
    if (parts.includes(slug)) out.push({ slug: e.slug, phrase: e.phrase });
    if (out.length >= limit) break;
  }
  return out;
}
