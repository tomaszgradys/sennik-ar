import catalogData from "@/data/catalog.json";
import publishedData from "@/data/content/_published.json";
import imagesData from "@/data/content/_images.json";
import type { CatalogEntry } from "./types";
import { slugify } from "./polish";

// Katalog (15k haseł z CSV) + indeksy „co jest opublikowane" i „które rodzice
// mają obrazek". Wszystko server-side (duże dane nie trafiają do klienta).
const CATALOG = catalogData as CatalogEntry[];
const PUBLISHED = new Set(publishedData as string[]);
const IMAGES = new Set(imagesData as string[]);

const BY_SLUG = new Map(CATALOG.map((e) => [e.slug, e]));
const BY_PARENT = new Map<string, CatalogEntry[]>();
for (const e of CATALOG) {
  if (!BY_PARENT.has(e.parent)) BY_PARENT.set(e.parent, []);
  BY_PARENT.get(e.parent)!.push(e);
}

export function catalogEntry(slug: string): CatalogEntry | null {
  return BY_SLUG.get(slug) ?? null;
}
export function isPublished(slug: string): boolean {
  return PUBLISHED.has(slug);
}
export function hasImage(parent: string): boolean {
  return IMAGES.has(parent);
}
export function parentPhrase(parent: string): string {
  return BY_SLUG.get(parent)?.phrase ?? parent;
}

// Opublikowane podfrazy danego rodzica (bez samego symbolu) — „warianty".
export function publishedChildren(parentSlug: string): CatalogEntry[] {
  return (BY_PARENT.get(parentSlug) ?? []).filter(
    (e) => e.slug !== parentSlug && PUBLISHED.has(e.slug)
  );
}

// Powiązane symbole: inne opublikowane symbole z tej samej kategorii (CSV nie ma
// kolumny „powiązane", więc bierzemy kategorię — sensowne i zawsze trafne).
export function relatedSymbols(entry: CatalogEntry, limit = 8): CatalogEntry[] {
  const out: CatalogEntry[] = [];
  for (const e of CATALOG) {
    if (out.length >= limit) break;
    if (e.type !== "symbol") continue;
    if (e.slug === entry.parent || e.slug === entry.slug) continue;
    if (e.category !== entry.category) continue;
    if (!PUBLISHED.has(e.slug)) continue;
    out.push(e);
  }
  return out;
}

export function publishedSymbols(): CatalogEntry[] {
  return CATALOG.filter((e) => e.type === "symbol" && PUBLISHED.has(e.slug));
}
export function allPublished(): CatalogEntry[] {
  return CATALOG.filter((e) => PUBLISHED.has(e.slug));
}

// Slugi do pre-renderu (generateStaticParams): opublikowane symbole priorytetu 1
// (rdzeń, ~600). Reszta (długi ogon: kombinacje + elementarne hasła prio 2/3)
// renderuje się na żądanie i cache'uje (ISR) — build szybki, a strony i tak w pełni
// indeksowalne od pierwszego wejścia (są też w sitemap).
export function staticSlugs(): string[] {
  return CATALOG.filter(
    (e) => e.type === "symbol" && e.priority === 1 && PUBLISHED.has(e.slug)
  ).map((e) => e.slug);
}

// Korpus wyszukiwania (tylko opublikowane) — budowany raz.
let _corpus: { slug: string; phrase: string; parent: string; kind: string; hay: string }[] | null =
  null;
export function searchCorpus() {
  if (_corpus) return _corpus;
  _corpus = allPublished().map((e) => ({
    slug: e.slug,
    phrase: e.phrase,
    parent: parentPhrase(e.parent),
    kind: e.type,
    hay: slugify(e.phrase),
  }));
  return _corpus;
}
