"use client";
import { useState } from "react";
import Link from "next/link";

// Wyszukiwarka liczb: natychmiastowy filtr po wpisanej cyfrze (client-side).
export default function NumberSearch({ numbers }: { numbers: number[] }) {
  const [q, setQ] = useState("");
  const t = q.replace(/[^0-9]/g, "").trim();
  const filtered = t ? numbers.filter((n) => String(n).includes(t)) : numbers;

  return (
    <div className="flex flex-col gap-5">
      <div className="mx-auto w-full max-w-sm">
        <input
          type="search"
          inputMode="numeric"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Wpisz liczbę, np. 7, 21, 333"
          aria-label="Szukaj liczby"
          className="w-full rounded-full border border-border bg-bg-elev px-5 py-3 text-center text-text shadow-sm outline-none focus:border-accent"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-6">
          {filtered.map((n) => (
            <Link
              key={n}
              href={`/liczby/${n}/`}
              className="number-tile group flex aspect-square items-center justify-center rounded-2xl no-underline shadow-sm"
            >
              <span className="num font-display text-2xl font-semibold transition-transform duration-500 group-hover:scale-110 sm:text-3xl">
                {n}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-center text-text-muted">
          Nie mamy jeszcze znaczenia liczby „{t}". Spróbuj innej.
        </p>
      )}
    </div>
  );
}
