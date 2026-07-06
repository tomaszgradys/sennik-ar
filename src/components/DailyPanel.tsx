import Link from "next/link";
import SymbolImage from "@/components/SymbolImage";
import { dailyPicks } from "@/lib/daily";
import { dreamPath } from "@/lib/dream";
import { colorPath, colorContent } from "@/lib/colors";
import { numberPath, numberContent } from "@/lib/numbers";
import { capitalize } from "@/lib/polish";

// „Dziś w senniku" — deterministyczne z daty (to samo dla wszystkich, zmienia się
// codziennie). To NIE statystyka — łagodne motywy na dziś, świeżość strony głównej.
export default function DailyPanel() {
  const d = dailyPicks();
  const hasColor = colorContent(d.color.slug) != null;
  const hasNumber = numberContent(String(d.number)) != null;

  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">Dziś w senniku</h2>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {/* Sen dnia */}
        <Link href={dreamPath(d.dream.slug)} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-bg-elev no-underline shadow-sm card">
          <SymbolImage symbolSlug={d.dream.slug} label={d.dream.phrase} className="h-20 w-full" />
          <div className="p-3">
            <div className="text-xs text-text-muted">Sen dnia</div>
            <div className="font-semibold text-text">{capitalize(d.dream.phrase)}</div>
          </div>
        </Link>

        {/* Symbol dnia */}
        <Link href={dreamPath(d.symbol.slug)} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-bg-elev no-underline shadow-sm card">
          <SymbolImage symbolSlug={d.symbol.slug} label={d.symbol.phrase} className="h-20 w-full" />
          <div className="p-3">
            <div className="text-xs text-text-muted">Symbol dnia</div>
            <div className="font-semibold text-text">{capitalize(d.symbol.phrase)}</div>
          </div>
        </Link>

        {/* Kolor dnia */}
        <Link href={hasColor ? colorPath(d.color.slug) : "/kolory"} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-bg-elev no-underline shadow-sm card">
          <span aria-hidden className="h-20 w-full" style={{ background: `radial-gradient(circle at 40% 30%, ${d.color.hex}, color-mix(in srgb, ${d.color.hex} 68%, #1a1420) 130%)` }} />
          <div className="p-3">
            <div className="text-xs text-text-muted">Kolor dnia</div>
            <div className="font-semibold text-text">{capitalize(d.color.name)}</div>
          </div>
        </Link>

        {/* Liczba dnia */}
        <Link href={hasNumber ? numberPath(d.number) : "/liczby"} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-bg-elev no-underline shadow-sm card">
          <span className="flex h-20 w-full items-center justify-center bg-bg-soft">
            <span className="font-display text-4xl font-semibold text-accent">{d.number}</span>
          </span>
          <div className="p-3">
            <div className="text-xs text-text-muted">Liczba dnia</div>
            <div className="font-semibold text-text">{d.number}</div>
          </div>
        </Link>

        {/* Faza Księżyca */}
        <Link href="/faza-ksiezyca" className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-bg-elev no-underline shadow-sm card">
          <span className="flex h-20 w-full items-center justify-center bg-bg-soft text-4xl">{d.moon.emoji}</span>
          <div className="p-3">
            <div className="text-xs text-text-muted">Faza Księżyca</div>
            <div className="font-semibold text-text">{d.moon.name}</div>
          </div>
        </Link>
      </div>
    </section>
  );
}
