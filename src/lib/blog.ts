import { readFileSync } from "node:fs";
import { join } from "node:path";
import indexData from "@/data/blog/_index.json";

// Blog plikowy: metadane w _index.json (lekki, do listy/hubа), pełna treść w
// src/data/blog/<slug>.json (czytana z dysku, dołączona przez outputFileTracingIncludes).
const BLOG_DIR = join(process.cwd(), "src", "data", "blog");

export interface BlogMeta {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // ISO YYYY-MM-DD
  category: string;
  readMinutes: number;
  hero?: boolean;
}

export interface BlogSection { h2: string; paragraphs: string[] }
export interface BlogPost extends BlogMeta {
  h1: string;
  metaDescription: string;
  intro: string;
  sections: BlogSection[];
  takeaways: string[];
  faq: { q: string; a: string }[];
  sources: { title: string; url: string }[];
  related: { href: string; label: string }[];
}

const INDEX = (indexData as BlogMeta[]).slice().sort((a, b) => (a.date < b.date ? 1 : -1));
const cache = new Map<string, BlogPost | null>();

export function listPosts(): BlogMeta[] {
  return INDEX;
}
export function postSlugs(): string[] {
  return INDEX.map((p) => p.slug);
}
export function blogPath(slug: string): string {
  return `/blog/${slug}/`;
}
export function heroSrcBlog(slug: string, hero?: boolean): string | null {
  return hero ? `/blog-img/${slug}.webp` : null;
}
export function getPost(slug: string): BlogPost | null {
  if (cache.has(slug)) return cache.get(slug)!;
  let post: BlogPost | null = null;
  try {
    post = JSON.parse(readFileSync(join(BLOG_DIR, `${slug}.json`), "utf8"));
  } catch {
    post = null;
  }
  cache.set(slug, post);
  return post;
}
// Kilka najnowszych innych wpisów (do „Przeczytaj też").
export function otherPosts(slug: string, limit = 3): BlogMeta[] {
  return INDEX.filter((p) => p.slug !== slug).slice(0, limit);
}
