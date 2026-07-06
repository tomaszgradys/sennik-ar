import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Content } from "./types";

// Treść dzielona na pliki per rodzic: src/data/content/<parent>.json = { slug: Content }.
// Czytamy synchronicznie z dysku (pliki dołączone do funkcji przez
// outputFileTracingIncludes w next.config) i cache'ujemy shard w pamięci.
// To skaluje się do 15k+ stron bez 15k importów w bundlu.
const CONTENT_DIR = join(process.cwd(), "src", "data", "content");
const cache = new Map<string, Record<string, Content> | null>();

function loadShard(parent: string): Record<string, Content> | null {
  if (cache.has(parent)) return cache.get(parent)!;
  let shard: Record<string, Content> | null = null;
  try {
    shard = JSON.parse(readFileSync(join(CONTENT_DIR, `${parent}.json`), "utf8"));
  } catch {
    shard = null; // rodzic jeszcze niewygenerowany
  }
  cache.set(parent, shard);
  return shard;
}

export function getContent(parent: string, slug: string): Content | null {
  return loadShard(parent)?.[slug] ?? null;
}
