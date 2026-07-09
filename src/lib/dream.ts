import type { DreamEntry } from "./types";
import { catalogEntry, isPublished, hasImage, parentPhrase } from "./catalog";
import { getContent } from "./content";
import { capitalize, dreamedVerb } from "./polish";

export {
  publishedChildren,
  relatedSymbols,
  publishedSymbols,
  allPublished,
  staticSlugs,
  searchCorpus,
  parentPhrase,
  isPublished,
  catalogEntry,
} from "./catalog";

// URL hasła: /sen/<slug>/ (struktura folderowa Z ukośnikiem, zgodnie z CSV).
export function dreamPath(slug: string): string {
  return `/sen/${slug}/`;
}

// Rozwiązanie sluga: katalog + treść. null => strona jeszcze nieopublikowana
// (brak treści) => 404, żeby nie serwować cienkich stron.
export function resolveEntry(slug: string): DreamEntry | null {
  const cat = catalogEntry(slug);
  if (!cat || !isPublished(cat.slug)) return null;
  const content = getContent(cat.parent, cat.slug);
  if (!content) return null;
  return {
    ...cat,
    kind: cat.type,
    parentPhrase: parentPhrase(cat.parent),
    content,
  };
}

// H1 كسؤال — لنيّة البحث والمقتطفات المميزة.
export function entryH1(entry: DreamEntry): string {
  return `ما تفسير حلم ${entry.content.locative} في المنام؟`;
}

// إسناد المصدر في العنوان — يُشتق من نص المحتوى فقط (دقّة، بلا حشو).
// يطابق النمط المهيمن لاستعلامات الأحلام العربية «تفسير حلم X لابن سيرين/النابلسي»،
// وهو ما يتصدّر به المنافسون (سيدتي/لها/ليالينا) نتائج البحث.
function sourceSuffix(entry: DreamEntry): string {
  const c = entry.content;
  const text = [c.quickAnswer, c.intro, c.positive, c.negative, ...c.paragraphs, ...c.faq.map((f) => f.a)].join(" ");
  const ibn = text.includes("ابن سيرين");
  const nab = text.includes("النابلسي") || text.includes("نابلسي");
  if (ibn && nab) return " لابن سيرين والنابلسي";
  if (ibn) return " لابن سيرين";
  if (nab) return " للنابلسي";
  return "";
}

// <title> مختلف عمدًا عن H1 (نقر أفضل في نتائج البحث، كلمات «تفسير حلم» + «في المنام»).
export function metaTitle(entry: DreamEntry): string {
  return `تفسير حلم ${capitalize(entry.phrase)} في المنام${sourceSuffix(entry)}`;
}

// عنوان اجتماعي (OG): "رأيت X في المنام؟ اعرف التفسير".
export function ogTitle(entry: DreamEntry): string {
  void dreamedVerb;
  return `رأيت ${entry.phrase} في المنام؟ اعرف ماذا يعني`;
}

// وصف اجتماعي قصير (لا يُبتر على واتساب).
export function ogDescription(entry: DreamEntry): string {
  return `تفسير حلم ${entry.content.locative} في المنام. اعرف ماذا يعني هذا الحلم.`;
}

// Prawdziwy obrazek (FLUX) rodzica — reuse per symbol.
export function dreamImageSrc(parent: string): string | null {
  return hasImage(parent) ? `/dreams/${parent}.jpg` : null;
}

// Zoptymalizowane warianty WebP (szybkość): miniatura do kart, hero na stronę snu.
export function thumbSrc(parent: string): string | null {
  return hasImage(parent) ? `/thumbs/${parent}.webp` : null;
}
export function heroSrc(parent: string): string | null {
  return hasImage(parent) ? `/hero/${parent}.webp` : null;
}

// Klucz obrazka: własny obrazek slugu (np. „skradziony-rower"), a jak go nie ma —
// obrazek rodzica (reuse). Pozwala pojedynczym kombinacjom mieć unikalną grafikę.
export function imageKey(slug: string, parent: string): string {
  return hasImage(slug) ? slug : parent;
}

// Lekka karta OG (1200x630 JPEG) — karta rodzica obsługuje wszystkie warianty.
export function ogImagePath(parent: string): string {
  return hasImage(parent) ? `/og/${parent}.jpg` : "/og/default.jpg";
}

export { capitalize };
