import type { DreamEntry } from "./types";
import { resolveEntry } from "./dream";
import { getCustomDream, getOverride } from "./custom";

// Jedno źródło prawdy dla strony snu: najpierw pliki (17k), potem sny z panelu
// (custom_dreams), a na końcu nakładka edycji (dream_overrides) nadpisuje phrase/treść.
export async function resolveDream(slug: string): Promise<DreamEntry | null> {
  let entry = resolveEntry(slug); // pliki (sync)
  if (!entry) entry = await getCustomDream(slug); // baza (custom)
  if (!entry) return null;

  const ov = await getOverride(slug);
  if (ov) {
    const phrase = ov.phrase || entry.phrase;
    entry = {
      ...entry,
      phrase,
      // dla symbolu parentPhrase == własna fraza; dla combo zostaje rodzica
      parentPhrase: entry.kind === "symbol" ? phrase : entry.parentPhrase,
      content: ov.content,
    };
  }
  return entry;
}
