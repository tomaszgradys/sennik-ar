"use client";

import { useState } from "react";
import Link from "next/link";

// Chipsy „doprecyzuj sen" pod nagłówkiem. Najważniejsze (pierwsze wg priorytetu
// katalogu) od razu, reszta chowana pod „Pokaż więcej" — żeby nie przytłoczyć.
export default function VariantChips({
  items,
  title,
}: {
  items: { href: string; phrase: string }[];
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const INITIAL = 14;
  const hasMore = items.length > INITIAL;
  const shown = open ? items : items.slice(0, INITIAL);
  const rest = items.length - INITIAL;

  return (
    <section className="rounded-2xl border border-border bg-bg-elev/60 p-4">
      <h2 className="mb-3 text-sm font-semibold text-text">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {shown.map((v) => (
          <Link
            key={v.href}
            href={v.href}
            className="rounded-full border border-border bg-bg-elev px-3 py-1.5 text-sm text-text no-underline chip"
          >
            {v.phrase}
          </Link>
        ))}
        {hasMore && !open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={false}
            className="rounded-full border border-accent/50 bg-accent-soft px-3 py-1.5 text-sm font-medium text-accent transition-colors hover:border-accent"
          >
            عرض المزيد ({rest}) ↓
          </button>
        )}
      </div>
      {hasMore && open && (
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-expanded
          className="mt-3 text-sm text-text-muted transition-colors hover:text-accent"
        >
          طيّ ↑
        </button>
      )}
    </section>
  );
}
