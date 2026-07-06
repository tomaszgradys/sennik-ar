import { db, ensureSchema } from "./db";
import type { DreamEntry, Content } from "./types";

// Sny dodane z panelu admina żyją w bazie (custom_dreams), bo Vercel nie pozwala
// zapisywać plików katalogu w runtime. Strona /sen/[slug] sięga tu, gdy sluga nie
// ma w plikach. Renderują się tym samym szablonem (bez obrazka -> gradient fallback).

interface Row {
  slug: string;
  phrase: string;
  category: string | null;
  content: unknown;
}

function toEntry(r: Row): DreamEntry {
  const content = (typeof r.content === "string" ? JSON.parse(r.content) : r.content) as Content;
  return {
    slug: r.slug,
    phrase: r.phrase,
    parent: r.slug,
    category: r.category || "rzeczy codzienne i symbole",
    priority: 2,
    type: "symbol",
    kind: "symbol",
    parentPhrase: r.phrase,
    content,
  };
}

export async function getCustomDream(slug: string): Promise<DreamEntry | null> {
  try {
    await ensureSchema();
    const rows = (await db()`SELECT slug, phrase, category, content FROM custom_dreams WHERE slug = ${slug}`) as Row[];
    return rows[0] ? toEntry(rows[0]) : null;
  } catch {
    return null; // baza niedostępna — po prostu brak
  }
}

// Nakładka edycji: nadpisuje phrase/treść snu (plikowego lub custom). Zapis z panelu.
export interface Override {
  phrase: string | null;
  content: Content;
}
export async function getOverride(slug: string): Promise<Override | null> {
  try {
    await ensureSchema();
    const rows = (await db()`SELECT phrase, content FROM dream_overrides WHERE slug = ${slug}`) as {
      phrase: string | null;
      content: unknown;
    }[];
    const r = rows[0];
    if (!r) return null;
    return { phrase: r.phrase, content: (typeof r.content === "string" ? JSON.parse(r.content) : r.content) as Content };
  } catch {
    return null;
  }
}
export async function saveOverride(slug: string, phrase: string, content: Content): Promise<void> {
  await ensureSchema();
  await db()`INSERT INTO dream_overrides (slug, phrase, content, updated_at)
    VALUES (${slug}, ${phrase}, ${JSON.stringify(content)}, now())
    ON CONFLICT (slug) DO UPDATE SET phrase = ${phrase}, content = ${JSON.stringify(content)}, updated_at = now()`;
}

// Slugi snów z bazy — do sitemap (żeby admin-owe sny też były indeksowane).
export async function customDreamSlugs(): Promise<string[]> {
  try {
    await ensureSchema();
    const rows = (await db()`SELECT slug FROM custom_dreams`) as { slug: string }[];
    return rows.map((r) => r.slug);
  } catch {
    return [];
  }
}

// Lista snów z panelu (slug/fraza/kategoria) — do hubów kategorii, żeby sny z bazy
// nie były osierocone (dostają link wewnętrzny z huba swojej kategorii).
export async function listCustomDreams(): Promise<{ slug: string; phrase: string; category: string }[]> {
  try {
    await ensureSchema();
    const rows = (await db()`SELECT slug, phrase, category FROM custom_dreams`) as {
      slug: string; phrase: string; category: string | null;
    }[];
    return rows.map((r) => ({
      slug: r.slug,
      phrase: r.phrase,
      category: r.category || "rzeczy codzienne i symbole",
    }));
  } catch {
    return [];
  }
}
