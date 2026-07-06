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

// Kolejność = kolejność na hubie /kolory.
export const COLORS: ColorMeta[] = [
  { slug: "czerwony", name: "czerwony", hex: "#C0392B" },
  { slug: "niebieski", name: "niebieski", hex: "#2E5A88" },
  { slug: "zielony", name: "zielony", hex: "#3E7C5A" },
  { slug: "zolty", name: "żółty", hex: "#E0B84C", light: true },
  { slug: "czarny", name: "czarny", hex: "#2B2B33" },
  { slug: "bialy", name: "biały", hex: "#F3EFE7", light: true },
  { slug: "fioletowy", name: "fioletowy", hex: "#6E5AA0" },
  { slug: "rozowy", name: "różowy", hex: "#D98BA6", light: true },
  { slug: "pomaranczowy", name: "pomarańczowy", hex: "#D98244", light: true },
  { slug: "szary", name: "szary", hex: "#8A8A92" },
  { slug: "brazowy", name: "brązowy", hex: "#7A5A42" },
  { slug: "zloty", name: "złoty", hex: "#C9A44A", light: true },
  { slug: "srebrny", name: "srebrny", hex: "#AEB4BC", light: true },
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
