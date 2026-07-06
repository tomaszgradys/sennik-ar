import { after } from "next/server";
import Link from "next/link";
import { wordLabel, alternativesFor } from "@/lib/words";
import { catalogEntry, dreamPath } from "@/lib/dream";
import { capitalize } from "@/lib/polish";
import { db, ensureSchema } from "@/lib/db";
import SymbolImage from "@/components/SymbolImage";
import SearchBox from "@/components/SearchBox";
import MissingDreamForm from "@/components/MissingDreamForm";

// Strona słowa, którego snu jeszcze nie mamy: proponujemy sprawdzone alternatywy
// i logujemy kliknięcie (czego ludzie szukają) — do panelu admina.
export default function MissingWord({ slug }: { slug: string }) {
  const word = wordLabel(slug) ?? slug;
  const alts = alternativesFor(slug)
    .map((s) => ({ slug: s, entry: catalogEntry(s) }))
    .filter((a) => a.entry);

  after(async () => {
    try {
      await ensureSchema();
      await db()`INSERT INTO search_misses (query, hits, last_at)
        VALUES (${word}, 1, now())
        ON CONFLICT (query) DO UPDATE SET hits = search_misses.hits + 1, last_at = now()`;
    } catch {
      /* ignoruj */
    }
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <header className="text-center">
        <div aria-hidden className="text-4xl">🌙</div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-text sm:text-4xl">
          Sen o „{word}"
        </h1>
        <p className="mx-auto mt-3 max-w-md text-text-muted">
          Nie mamy jeszcze osobnej interpretacji dla tego snu, ale zajmiemy się nim.
          W międzyczasie zobacz podobne sny, które mogą pasować:
        </p>
      </header>

      {alts.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {alts.map((a) => (
            <Link
              key={a.slug}
              href={dreamPath(a.slug)}
              className="group overflow-hidden rounded-2xl border border-border bg-bg-elev no-underline shadow-sm card"
            >
              <SymbolImage symbolSlug={a.slug} label={a.entry!.phrase} className="h-24 w-full" />
              <div className="p-3">
                <div className="font-semibold text-text">{capitalize(a.entry!.phrase)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div>
        <p className="mb-2 text-center text-sm text-text-muted">
          A może chodziło o coś innego? Poszukaj:
        </p>
        <SearchBox />
      </div>

      <div className="rounded-2xl border border-border bg-bg-soft p-4">
        <MissingDreamForm />
      </div>
    </div>
  );
}
