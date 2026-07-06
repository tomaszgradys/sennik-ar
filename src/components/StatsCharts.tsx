import type { StatsData } from "@/lib/stats";

const fmtShort = (iso: string) => {
  const [, m, d] = iso.split("-");
  return `${d}.${m}`;
};

// Słupkowy (CSS, responsywny): a = dolna warstwa, b = warstwa nad nią (stack).
function BarChart({
  points,
  colorA,
  colorB,
}: {
  points: { day: string; a: number; b: number }[];
  colorA: string;
  colorB?: string;
}) {
  const max = Math.max(1, ...points.map((p) => p.a + p.b));
  const labelIdx = new Set([0, Math.floor(points.length / 2), points.length - 1]);
  return (
    <div>
      <div className="flex h-40 items-end gap-[2px]">
        {points.map((p) => {
          const total = p.a + p.b;
          return (
            <div
              key={p.day}
              className="flex flex-1 flex-col justify-end"
              title={`${fmtShort(p.day)}: ${total}`}
            >
              {p.b > 0 && (
                <div className="w-full rounded-t-sm" style={{ height: `${(p.b / max) * 100}%`, background: colorB }} />
              )}
              <div
                className={p.b > 0 ? "w-full" : "w-full rounded-t-sm"}
                style={{ height: `${(p.a / max) * 100}%`, background: colorA, minHeight: total > 0 ? 2 : 0 }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-text-muted">
        {points.map((p, i) => (
          <span key={p.day} className={labelIdx.has(i) ? "" : "opacity-0"}>{fmtShort(p.day)}</span>
        ))}
      </div>
    </div>
  );
}

function Donut({ pct }: { pct: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <svg viewBox="0 0 100 100" className="h-32 w-32 -rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--bg-soft)" strokeWidth="12" />
      <circle
        cx="50" cy="50" r={r} fill="none"
        stroke="var(--accent)" strokeWidth="12" strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
      />
      <text x="50" y="50" transform="rotate(90 50 50)" textAnchor="middle" dominantBaseline="central"
        className="fill-text" style={{ fontSize: 20, fontWeight: 700 }}>
        {pct}%
      </text>
    </svg>
  );
}

export default function StatsCharts({ stats }: { stats: StatsData }) {
  const { days, totals, topArticles } = stats;
  const foundPct = totals.searchTotal ? Math.round((totals.searchFound / totals.searchTotal) * 100) : 0;

  if (!stats.hasData) {
    return (
      <p className="rounded-xl border border-border bg-bg-elev p-4 text-sm text-text-muted">
        Brak danych do pokazania. Statystyki zaczną się zbierać od pierwszych wyszukiwań i wejść na bloga
        (po wdrożeniu tej wersji). Zajrzyj tu za dzień lub dwa.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Podsumowanie */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "Wyszukiwania (30 dni)", value: totals.searchTotal },
          { label: "Trafione od razu", value: `${foundPct}%` },
          { label: "Nietrafione / niedokł.", value: totals.searchMiss },
          { label: "Wejścia na bloga", value: totals.blogView },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-bg-elev p-3 text-center">
            <div className="text-xl font-bold text-text">{k.value}</div>
            <div className="text-[11px] text-text-muted">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Wyszukiwania dziennie (stack: trafione + nietrafione) */}
      <div className="rounded-2xl border border-border bg-bg-elev p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="m-0 text-sm font-semibold text-text">Wyszukiwania snów — dziennie</h3>
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--accent)" }} /> trafione</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "color-mix(in srgb, var(--negative) 55%, transparent)" }} /> nietrafione</span>
          </div>
        </div>
        <BarChart
          points={days.map((d) => ({ day: d.day, a: d.searchFound, b: d.searchMiss }))}
          colorA="var(--accent)"
          colorB="color-mix(in srgb, var(--negative) 55%, transparent)"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Skuteczność (donut) */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-bg-elev p-4">
          <h3 className="m-0 mb-2 self-start text-sm font-semibold text-text">Skuteczność wyszukiwarki</h3>
          <Donut pct={foundPct} />
          <p className="m-0 mt-2 text-center text-xs text-text-muted">
            {foundPct}% zapytań trafia od razu; {100 - foundPct}% wymaga doprecyzowania lub brakuje snu.
          </p>
        </div>

        {/* Najczęściej czytane artykuły */}
        <div className="rounded-2xl border border-border bg-bg-elev p-4">
          <h3 className="m-0 mb-2 text-sm font-semibold text-text">Najczęściej czytane artykuły</h3>
          {topArticles.length === 0 ? (
            <p className="m-0 text-xs text-text-muted">Brak danych o wejściach.</p>
          ) : (
            <ol className="m-0 flex list-none flex-col gap-1.5 p-0">
              {topArticles.map((a) => (
                <li key={a.slug} className="flex items-center justify-between gap-2 text-sm">
                  <a href={`/blog/${a.slug}/`} target="_blank" rel="noreferrer" className="truncate text-text-muted hover:text-accent">{a.slug}</a>
                  <span className="shrink-0 font-semibold text-text">{a.views}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Wejścia na bloga dziennie */}
      <div className="rounded-2xl border border-border bg-bg-elev p-4">
        <h3 className="m-0 mb-3 text-sm font-semibold text-text">Wejścia na bloga — dziennie</h3>
        <BarChart points={days.map((d) => ({ day: d.day, a: d.blogView, b: 0 }))} colorA="var(--gold)" />
      </div>

      <p className="text-xs text-text-muted">
        Zliczane od wdrożenia tej wersji. „Wyszukiwania" to zapytania w wyszukiwarce snów (min. 3 znaki);
        „trafione od razu" = dokładne dopasowanie bez doprecyzowania.
      </p>
    </div>
  );
}
