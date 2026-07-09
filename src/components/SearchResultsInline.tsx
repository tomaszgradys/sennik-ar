"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Result {
  slug: string;
  phrase: string;
  symbol: string;
  kind: "symbol" | "combo";
}

// Wyniki wyszukiwania na dedykowanej stronie /szukaj (dla SearchAction/Sitelinks
// Searchbox). Korzysta z istniejącego /api/search (ta sama logika co podpowiedzi).
export default function SearchResultsInline({ query }: { query: string }) {
  const [results, setResults] = useState<Result[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [exact, setExact] = useState(true);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setState("idle");
      return;
    }
    const ctrl = new AbortController();
    setState("loading");
    fetch(`/api/search/?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => {
        setResults(d.results ?? []);
        setExact(d.exact !== false);
        setState("done");
      })
      .catch(() => {
        /* przerwane — ignoruj */
      });
    return () => ctrl.abort();
  }, [query]);

  if (query.trim().length < 2) return null;
  if (state === "loading")
    return (
      <p role="status" aria-live="polite" className="text-text-muted">
        جارٍ البحث…
      </p>
    );
  if (state === "done" && results.length === 0)
    return (
      <p role="status" aria-live="polite" className="text-text-muted">
        لا نتائج لـ «{query.trim()}». جرّب كلمة أبسط أو صف حلمك بجملة أخرى.
      </p>
    );

  return (
    <div className="flex flex-col gap-3">
      {!exact && (
        <p className="text-sm text-text-muted">
          لا نملك «{query.trim()}» تحديدًا. أقرب ما لدينا:
        </p>
      )}
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {results.map((r) => (
          <li key={r.slug}>
            <Link
              href={`/sen/${r.slug}/`}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-bg-elev px-4 py-3 text-text no-underline card"
            >
              <span className="font-medium">{r.phrase}</span>
              <span className="text-xs text-text-muted">{r.kind === "symbol" ? "رمز" : r.symbol}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
