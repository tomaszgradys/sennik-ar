import catalogData from "@/data/catalog.json";
import publishedData from "@/data/content/_published.json";
import imagesData from "@/data/content/_images.json";
import type { CatalogEntry } from "./types";
import { slugify, arNorm } from "./polish";

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
    if (SECONDARY.has(e.slug)) continue; // nie proponuj wtórnych duplikatów
    out.push(e);
  }
  return out;
}

// Duplikaty tłumaczeń: różne polskie hasła dały tę samą arabską frazę (أرنب بري ×3,
// فهد ×2 z gepard/jaguar…), tworząc slugi „-2/-3". Wybieramy jeden wpis GŁÓWNY na
// frazę; pozostałe są WTÓRNE: kanonikalizowane do głównego, wypadają z sitemap,
// z korpusu wyszukiwarki i z list kategorii (żeby nie robić duplicate content).
const PRIMARY_OF = new Map<string, string>();
const SECONDARY = new Set<string>();
(() => {
  const groups = new Map<string, CatalogEntry[]>();
  for (const e of CATALOG) {
    if (!PUBLISHED.has(e.slug)) continue;
    const key = e.phrase.trim();
    const g = groups.get(key);
    if (g) g.push(e);
    else groups.set(key, [e]);
  }
  const hasNumSuffix = (s: string) => /-\d+$/.test(s);
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    // Główny = slug bez sufiksu „-N", potem najwyższy priorytet, potem krótszy/pierwszy.
    list.sort(
      (a, b) =>
        Number(hasNumSuffix(a.slug)) - Number(hasNumSuffix(b.slug)) ||
        a.priority - b.priority ||
        a.slug.length - b.slug.length ||
        a.slug.localeCompare(b.slug)
    );
    const primary = list[0].slug;
    for (const e of list.slice(1)) {
      PRIMARY_OF.set(e.slug, primary);
      SECONDARY.add(e.slug);
    }
  }
})();

// Slug kanoniczny hasła: dla duplikatu wtórnego → slug wpisu głównego, inaczej sam siebie.
export function canonicalSlug(slug: string): string {
  return PRIMARY_OF.get(slug) ?? slug;
}
// Czy to wtórny duplikat (ta sama fraza co inny, już wybrany, wpis główny).
export function isDuplicateSecondary(slug: string): boolean {
  return SECONDARY.has(slug);
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
// hay = slug العبارة؛ hayN = نسخته المسوّاة عربيًا (بلا «ال»/سوابق) لكل كلمة —
// تتيح مطابقة «الكلب» مع «كلب» دون خسارة دقة التطابق الحرفي على hay.
let _corpus:
  | { slug: string; phrase: string; parent: string; kind: string; hay: string; hayN: string }[]
  | null = null;
export function searchCorpus() {
  if (_corpus) return _corpus;
  _corpus = allPublished()
    .filter((e) => !SECONDARY.has(e.slug)) // wtórne duplikaty poza wyszukiwarką
    .map((e) => {
    const hay = slugify(e.phrase);
    return {
      slug: e.slug,
      phrase: e.phrase,
      parent: parentPhrase(e.parent),
      kind: e.type,
      hay,
      hayN: hay.split("-").map(arNorm).join("-"),
    };
  });
  return _corpus;
}
