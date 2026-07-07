import Link from "next/link";
import { T } from "@/locales/pl";
import { moonPhase } from "@/lib/moon";

// Karty „اكتشف أيضًا": faza księżyca (dynamiczny obraz dzisiejszej fazy) + hub
// تفسير ابن سيرين. Horoskop usunięty (التنجيم nie pasuje kulturowo do wersji AR).
// Renderowane serwerowo (ISR) — odświeżają się w oknie rewalidacji.
export default function DiscoverCards() {
  const phase = moonPhase(new Date());

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
            alt={`طور القمر: ${phase.name}`}
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
            اليوم: {phase.name}. {T.discover.moonLead}
          </div>
        </div>
      </Link>

      <Link
        href="/tafsir-ibn-sirin/"
        className="group flex items-center gap-4 rounded-2xl border border-border bg-bg-elev p-4 no-underline shadow-sm card"
      >
        <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-bg-soft text-2xl shadow-inner">
          <span aria-hidden className="transition-transform duration-700 group-hover:scale-110">☾✦</span>
        </span>
        <div>
          <div className="font-semibold text-text">تفسير الأحلام لابن سيرين</div>
          <div className="mt-1 text-sm text-text-muted">
            أشهر رموز الأحلام بقراءة هادئة تجمع بين التراث وعلم النفس.
          </div>
        </div>
      </Link>
    </section>
  );
}
