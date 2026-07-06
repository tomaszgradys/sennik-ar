import Link from "next/link";
import { T } from "@/locales/pl";
import { moonPhase } from "@/lib/moon";
import { currentSign } from "@/lib/horoscope";

// Karty „Sprawdź też" z DYNAMICZNYMI ikonami odzwierciedlającymi treść:
// - Faza Księżyca: prawdziwy obraz dzisiejszej fazy,
// - Horoskop: glif aktualnego (kalendarzowego) znaku zodiaku.
// Renderowane serwerowo (ISR) — odświeżają się w oknie rewalidacji.
export default function DiscoverCards() {
  const phase = moonPhase(new Date());
  const sign = currentSign();

  return (
    <section className="grid gap-4 sm:grid-cols-2">
      <Link
        href="/faza-ksiezyca/"
        className="group flex items-center gap-4 rounded-2xl border border-border bg-bg-elev p-4 no-underline shadow-sm card"
      >
        <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border/70 shadow-inner">
          {/* eslint-disable-next-line @next/next/no-img-element -- lokalny obraz fazy */}
          <img
            src={`/moon/${phase.slug}.jpg`}
            alt={`Faza Księżyca: ${phase.name}`}
            width={56}
            height={56}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </span>
        <div>
          <div className="font-semibold text-text">{T.discover.moonTitle}</div>
          <div className="mt-1 text-sm text-text-muted">
            Dziś: {phase.name.toLowerCase()}. {T.discover.moonLead}
          </div>
        </div>
      </Link>

      <Link
        href="/horoskop/"
        className="group flex items-center gap-4 rounded-2xl border border-border bg-bg-elev p-4 no-underline shadow-sm card"
      >
        <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border/70 shadow-inner">
          {/* eslint-disable-next-line @next/next/no-img-element -- lokalna ilustracja znaku */}
          <img
            src={`/zodiac/${sign.slug}.jpg`}
            alt={`Znak zodiaku: ${sign.name}`}
            width={56}
            height={56}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </span>
        <div>
          <div className="font-semibold text-text">{T.discover.horoscopeTitle}</div>
          <div className="mt-1 text-sm text-text-muted">
            Teraz: {sign.name}. {T.discover.horoscopeLead}
          </div>
        </div>
      </Link>
    </section>
  );
}
