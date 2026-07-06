import wordsData from "@/data/words.json";
import altData from "@/data/words-alt.json";
import { isPublished, publishedSymbols } from "./catalog";

interface Word {
  word: string;
  slug: string;
}
const WORDS = wordsData as Word[];
const BY_SLUG = new Map(WORDS.map((w) => [w.slug, w]));
const ALT = altData as Record<string, string[]>;

export function isKnownWord(slug: string): boolean {
  return BY_SLUG.has(slug);
}
export function wordLabel(slug: string): string | null {
  return BY_SLUG.get(slug)?.word ?? null;
}

// Alternatywy sprawdzone przez AL (words-alt.json). Fallback: popularne symbole.
export function alternativesFor(slug: string): string[] {
  const a = ALT[slug];
  if (a && a.length) return a.filter((s) => isPublished(s));
  return publishedSymbols().slice(0, 6).map((s) => s.slug);
}

// Korpus słów do podpowiadania — TYLKO te bez snu (reszta jest w searchCorpus).
// hay == slug (już bez polskich znaków).
let _wc: { slug: string; word: string; hay: string }[] | null = null;
export function wordsCorpus() {
  if (_wc) return _wc;
  _wc = WORDS.filter((w) => !isPublished(w.slug)).map((w) => ({
    slug: w.slug,
    word: w.word,
    hay: w.slug,
  }));
  return _wc;
}
