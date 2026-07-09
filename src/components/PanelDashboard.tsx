"use client";

import { useState } from "react";
import type { BlogOverview } from "@/lib/blogSchedule";
import type { CostEstimate, SelfHostedEstimate } from "@/lib/blogCosts";
import type { StatsData } from "@/lib/stats";
import StatsCharts from "./StatsCharts";

interface Miss {
  query: string;
  hits: number;
  last_at: string;
}
interface Sentence {
  query: string;
  hits: number;
  found: string[] | null;
  last_at: string;
}

function fmt(d: string) {
  return new Date(d).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
}
function fmtDay(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pl-PL", {
    weekday: "short", day: "numeric", month: "short",
  });
}
const usd = (n: number) => `$${n.toFixed(2)}`;
const pln = (n: number) => `${n.toFixed(2).replace(".", ",")} zł`;
const FREQ_OPTIONS: { days: number; label: string }[] = [
  { days: 1, label: "Codziennie" },
  { days: 2, label: "Co 2 dni" },
  { days: 3, label: "Co 3 dni" },
  { days: 7, label: "Raz w tygodniu" },
];
const freqLabel = (days: number) => FREQ_OPTIONS.find((o) => o.days === days)?.label ?? `co ${days} dni`;

type TabId = "sny" | "statystyka" | "blog" | "koszty" | "szukane" | "zdania";

export default function PanelDashboard({
  misses,
  sentences,
  blog,
  costs,
  selfHosted,
  blogEveryDays,
  stats,
}: {
  misses: Miss[];
  sentences: Sentence[];
  blog: BlogOverview;
  costs: CostEstimate;
  selfHosted: SelfHostedEstimate;
  blogEveryDays: number;
  stats: StatsData;
}) {
  const [ms, setMs] = useState(misses);
  const [sents, setSents] = useState(sentences);
  const [busy, setBusy] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { ok: boolean; text: string; path?: string }>>({});
  const [tab, setTab] = useState<TabId>("sny");
  const [newPhrase, setNewPhrase] = useState("");

  // Częstotliwość bloga (co ile dni) — sterowana z panelu.
  const [freq, setFreq] = useState<number>(blogEveryDays);
  const [freqSaved, setFreqSaved] = useState<number>(blogEveryDays);
  const [freqBusy, setFreqBusy] = useState(false);
  const [freqMsg, setFreqMsg] = useState<string | null>(null);

  async function saveFreq() {
    setFreqBusy(true);
    setFreqMsg(null);
    try {
      const res = await fetch("/api/panel/blog-config/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ everyDays: freq }),
      });
      const d = await res.json().catch(() => ({}));
      if (d.ok) { setFreqSaved(d.everyDays); setFreq(d.everyDays); setFreqMsg("Zapisano ✓"); }
      else setFreqMsg("Nie udało się zapisać.");
    } catch {
      setFreqMsg("Błąd sieci.");
    } finally {
      setFreqBusy(false);
    }
  }

  async function createDream(query: string) {
    const q = query.trim();
    if (!q) return;
    setBusy(q);
    setResults((r) => ({ ...r, [q]: { ok: true, text: "Tworzę sen…" } }));
    try {
      const res = await fetch("/api/panel/create-dream/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const d = await res.json().catch(() => ({}));
      if (d.ok && d.status === "created") {
        setResults((r) => ({ ...r, [q]: { ok: true, text: "Utworzono ✓", path: d.path } }));
      } else if (d.status === "exists") {
        setResults((r) => ({ ...r, [q]: { ok: true, text: "Już istnieje", path: d.path } }));
      } else {
        const msg =
          d.error === "no_api_key" ? "Brak ANTHROPIC_API_KEY w Vercel"
          : d.error === "no_db" ? "Brak bazy"
          : d.error === "generation_failed" ? "AI nie odpowiedziało, spróbuj ponownie"
          : "Nie udało się utworzyć";
        setResults((r) => ({ ...r, [q]: { ok: false, text: msg } }));
      }
    } catch {
      setResults((r) => ({ ...r, [q]: { ok: false, text: "Błąd sieci" } }));
    } finally {
      setBusy(null);
    }
  }

  async function del(type: "miss" | "sentence", id: number | string) {
    await fetch("/api/panel/delete/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type, id }),
    });
    if (type === "miss") setMs((m) => m.filter((x) => x.query !== id));
    else setSents((s) => s.filter((x) => x.query !== id));
  }

  async function logout() {
    await fetch("/api/panel/login/", { method: "DELETE" });
    window.location.reload();
  }

  const [editQ, setEditQ] = useState("");
  const PL: Record<string, string> = { ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z" };
  const toSlug = (s: string) =>
    s.toLowerCase().replace(/[ąćęłńóśźż]/g, (ch) => PL[ch] ?? ch).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  function goEdit() {
    const slug = toSlug(editQ);
    if (slug) window.location.href = `/panel/edit/${slug}/`;
  }

  const TABS: { id: TabId; label: string; count?: number }[] = [
    { id: "sny", label: "Sny" },
    { id: "statystyka", label: "Statystyka" },
    { id: "blog", label: "Blog" },
    { id: "koszty", label: "Koszty" },
    { id: "szukane", label: "Szukane", count: ms.length },
    { id: "zdania", label: "Zdania", count: sents.length },
  ];

  const newRes = results[newPhrase.trim()];

  // Live estymacja kosztu bloga przy wybranej częstotliwości.
  const freqPostsPerMonth = Math.round(30 / freq);
  const freqPerMonthUsd = costs.perBlogUsd * freqPostsPerMonth;
  const freqPerMonthPln = costs.perBlogPln * freqPostsPerMonth;

  return (
    <div className="flex flex-col gap-5">
      {/* Nagłówek + menu (przyklejone u góry, wygodne na telefonie i kompie) */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-border bg-bg/95 px-4 pb-2 pt-3 backdrop-blur">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-text">Panel admina</h1>
          <div className="flex items-center gap-2">
            <a href="/" className="rounded-full border border-border px-3 py-1.5 text-sm text-text-muted no-underline">
              Strona
            </a>
            <button onClick={logout} className="rounded-full border border-border px-3 py-1.5 text-sm text-text-muted">
              Wyloguj
            </button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto pb-1" aria-label="Sekcje panelu">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                tab === t.id ? "dream-save dream-save--calm" : "border border-border text-text-muted hover:text-text"
              }`}
            >
              {t.label}
              {t.count != null && t.count > 0 && (
                <span className={`rounded-full px-1.5 text-xs ${tab === t.id ? "bg-white/25" : "bg-bg-soft"}`}>{t.count}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* SNY: utwórz z tematu + utwórz z listy braków + edytuj */}
      {tab === "sny" && (
        <div className="flex flex-col gap-6">
          <section>
            <h2 className="mb-1 text-lg font-semibold text-text">Utwórz sen z tematu</h2>
            <p className="mb-3 text-xs text-text-muted">
              Wpisz dowolne hasło (np. „latający dywan”, „czarny kot”) — AI napisze pełną interpretację i doda ją do serwisu.
            </p>
            <div className="flex gap-2">
              <input
                value={newPhrase}
                onChange={(e) => setNewPhrase(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createDream(newPhrase)}
                placeholder="np. latający dywan"
                className="flex-1 rounded-xl border border-border bg-bg-elev px-4 py-2.5 text-text outline-none focus:border-accent"
              />
              <button
                onClick={() => createDream(newPhrase)}
                disabled={busy === newPhrase.trim() || !newPhrase.trim()}
                className="dream-save dream-save--calm inline-flex items-center px-5 py-2.5 font-semibold disabled:opacity-60"
              >
                {busy === newPhrase.trim() ? "Tworzę…" : "Utwórz"}
              </button>
            </div>
            {newRes && (
              <p className={`mt-2 text-sm ${newRes.ok ? "text-accent" : "text-negative"}`}>
                {newRes.text}
                {newRes.path && (
                  <a href={newRes.path} target="_blank" rel="noreferrer" className="ml-1 underline">zobacz</a>
                )}
              </p>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-text">Edytuj istniejący sen</h2>
            <div className="flex gap-2">
              <input
                value={editQ}
                onChange={(e) => setEditQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && goEdit()}
                placeholder="Wpisz hasło lub slug, np. czarny kot"
                className="flex-1 rounded-xl border border-border bg-bg-elev px-4 py-2.5 text-text outline-none focus:border-accent"
              />
              <button onClick={goEdit} className="rounded-full border border-border px-5 py-2.5 font-medium text-text">
                Edytuj
              </button>
            </div>
            <p className="mt-2 text-xs text-text-muted">Poprawisz tytuł, wszystkie teksty i FAQ. Zmiany widoczne od razu.</p>
          </section>
        </div>
      )}

      {/* BLOG */}
      {tab === "statystyka" && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-text">Statystyka (ostatnie 30 dni)</h2>
          <StatsCharts stats={stats} />
        </section>
      )}

      {tab === "blog" && (
        <section>
          <h2 className="mb-1 text-lg font-semibold text-text">Blog — częstotliwość, dobór tematów i wpisy</h2>
          <p className="mb-3 text-xs text-text-muted">
            Tematy dobierane automatycznie pod sezon i trendy (pod Google Discover), bez powtórek i bez sztywnej
            kolejki „na zapas". Publikacja o losowej porze (09–18). Opublikowano: {blog.publishedCount}.
          </p>

          {/* Ustawienie częstotliwości + szacunek kosztu przy tej zmianie */}
          <div className="mb-4 rounded-2xl border border-accent/30 bg-accent-soft/40 p-4">
            <h3 className="m-0 text-sm font-semibold text-text">Jak często publikować bloga?</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {FREQ_OPTIONS.map((o) => (
                <button
                  key={o.days}
                  onClick={() => setFreq(o.days)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    freq === o.days ? "bg-accent text-white" : "border border-border text-text-muted hover:text-text"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-bg-elev p-3">
                <p className="m-0 text-xs uppercase tracking-wide text-text-muted">Wpisów miesięcznie</p>
                <p className="m-0 mt-1 text-xl font-bold text-text">~{freqPostsPerMonth}</p>
              </div>
              <div className="rounded-xl border border-border bg-bg-elev p-3">
                <p className="m-0 text-xs uppercase tracking-wide text-text-muted">Szac. koszt / mies.</p>
                <p className="m-0 mt-1 text-xl font-bold text-text">{usd(freqPerMonthUsd)}</p>
                <p className="m-0 text-sm text-text-muted">≈ {pln(freqPerMonthPln)} · ~{usd(costs.perBlogUsd)}/wpis</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={saveFreq}
                disabled={freqBusy || freq === freqSaved}
                className="dream-save dream-save--calm inline-flex items-center px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                {freqBusy ? "Zapisuję…" : freq === freqSaved ? "Zapisane" : "Zapisz zmianę"}
              </button>
              {freqMsg && <span className="text-sm text-accent">{freqMsg}</span>}
            </div>
            <p className="mt-2 text-xs text-text-muted">
              Aktywne teraz: <strong>{freqLabel(freqSaved)}</strong>. Zmiana działa od najbliższego cyklu — bot sprawdza
              to ustawienie przy każdej próbie publikacji (bez czekania na deploy).
            </p>
          </div>

          {blog.recent.length === 0 ? (
            <p className="rounded-xl border border-border bg-bg-elev p-3 text-sm text-text-muted">Brak wpisów.</p>
          ) : (
            <ol className="flex flex-col gap-1">
              {blog.recent.map((p) => (
                <li key={p.slug} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-bg-elev px-3 py-2">
                  <span className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-xs font-medium text-accent">{fmtDay(p.date)}</span>
                    <span className="text-sm text-text">{p.title}</span>
                  </span>
                  <span className="rounded-full bg-bg-soft px-2 py-0.5 text-xs text-text-muted">{p.category}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {/* KOSZTY */}
      {tab === "koszty" && (
        <section>
          <h2 className="mb-1 text-lg font-semibold text-text">Szacunkowe koszty bloga</h2>
          <p className="mb-3 text-xs text-text-muted">
            Model {costs.assumptions.model} + web_search + obrazek FLUX. {costs.assumptions.price.promoNote}. Kurs ~{costs.assumptions.usdPln} zł/$.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-bg-elev p-4">
              <p className="m-0 text-xs uppercase tracking-wide text-text-muted">Średnio na 1 wpis</p>
              <p className="m-0 mt-1 text-2xl font-bold text-text">{usd(costs.perBlogUsd)}</p>
              <p className="m-0 text-sm text-text-muted">≈ {pln(costs.perBlogPln)}</p>
            </div>
            <div className="rounded-xl border border-border bg-bg-elev p-4">
              <p className="m-0 text-xs uppercase tracking-wide text-text-muted">Miesięcznie ({costs.assumptions.postsPerMonth} wpisów)</p>
              <p className="m-0 mt-1 text-2xl font-bold text-text">{usd(costs.perMonthUsd)}</p>
              <p className="m-0 text-sm text-text-muted">≈ {pln(costs.perMonthPln)}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-1">
            {costs.breakdown.map((line) => (
              <div key={line.label} className="flex items-center justify-between rounded-lg border border-border bg-bg-elev px-3 py-1.5 text-sm">
                <span className="text-text-muted">{line.label}</span>
                <span className="text-text">{usd(line.usd)}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-text-muted">
            Wartości orientacyjne — realny koszt zależy głównie od liczby wyszukiwań i długości researchu. Skoryguj w <code>src/lib/blogCosts.ts</code>.
          </p>

          {/* Ciekawostka: porównanie z własnym LLM */}
          <div className="mt-6 rounded-2xl border border-accent/30 bg-accent-soft/40 p-4">
            <h3 className="m-0 text-sm font-semibold text-text">Ciekawostka: a gdybyśmy mieli własny LLM?</h3>
            <p className="m-0 mt-1 text-xs text-text-muted">
              Zamiast płacić za tokeny — sprzęt (amortyzacja) + prąd. Marginalny koszt na wpis spada
              niemal do zera, ale dochodzi stały koszt maszyny co miesiąc. Przykład: stacja z GPU ~
              {usd(selfHosted.assumptions.hardwareUsd)} jednorazowo, amortyzacja {selfHosted.assumptions.amortMonths} mies.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-bg-elev p-4">
                <p className="m-0 text-xs uppercase tracking-wide text-text-muted">Teraz (API) — miesięcznie</p>
                <p className="m-0 mt-1 text-2xl font-bold text-text">{usd(costs.perMonthUsd)}</p>
                <p className="m-0 text-sm text-text-muted">~{usd(costs.perBlogUsd)}/wpis · rośnie z liczbą wpisów</p>
              </div>
              <div className="rounded-xl border border-border bg-bg-elev p-4">
                <p className="m-0 text-xs uppercase tracking-wide text-text-muted">Własny LLM — miesięcznie</p>
                <p className="m-0 mt-1 text-2xl font-bold text-text">{usd(selfHosted.perMonthUsd)}</p>
                <p className="m-0 text-sm text-text-muted">
                  ~{usd(selfHosted.monthlyAmortUsd)} sprzęt + ~{usd(selfHosted.perBlogUsd)}/wpis
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-text">
              Przy obecnym tempie ({costs.assumptions.postsPerMonth} wpisów/mies) <strong>API jest ~
              {Math.max(1, Math.round(selfHosted.perMonthUsd / costs.perMonthUsd))}× tańsze</strong>.
              {selfHosted.breakEvenBlogs != null && (
                <> Własny LLM zaczyna się opłacać dopiero od ~<strong>{selfHosted.breakEvenBlogs}</strong> wpisów miesięcznie.</>
              )}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Do tego dochodzi utrzymanie, awarie i słabsza jakość otwartych modeli vs Sonnet. Założenia (GPU,
              prąd ~0,90 zł/kWh, ~{selfHosted.assumptions.minutesPerBlog} min/wpis) skorygujesz w{" "}
              <code>src/lib/blogCosts.ts</code> (SELF_HOSTED).
            </p>
          </div>
        </section>
      )}

      {/* SZUKANE */}
      {tab === "szukane" && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-text">Szukane, ale niedostępne ({ms.length}) — czego ludzie szukają, a nie mamy</h2>
          {ms.length === 0 ? (
            <p className="text-sm text-text-muted">Brak danych.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {ms.map((m) => {
                const r = results[m.query];
                return (
                  <div key={m.query} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-bg-elev px-3 py-2">
                    <span className="text-text">{m.query}</span>
                    <span className="flex items-center gap-3 text-xs text-text-muted">
                      {r && (
                        <span className={r.ok ? "text-accent" : "text-negative"}>
                          {r.text}
                          {r.path && <a href={r.path} target="_blank" rel="noreferrer" className="ml-1 underline">zobacz</a>}
                        </span>
                      )}
                      <span className="rounded-full bg-bg-soft px-2 py-0.5">{m.hits}×</span>
                      {fmt(m.last_at)}
                      <button onClick={() => createDream(m.query)} disabled={busy === m.query} className="rounded-full border border-accent/50 bg-accent-soft px-2.5 py-0.5 font-medium text-accent hover:bg-accent hover:text-white disabled:opacity-60">
                        {busy === m.query ? "…" : "Utwórz sen"}
                      </button>
                      <button onClick={() => del("miss", m.query)} aria-label="Usuń" className="rounded-full border border-border px-2 py-0.5 hover:text-negative">✕</button>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ZDANIA */}
      {tab === "zdania" && (
        <section>
          <h2 className="mb-1 text-lg font-semibold text-text">Zdania z wyszukiwarki ({sents.length})</h2>
          <p className="mb-3 text-xs text-text-muted">
            Całe zdania/opisy wpisane w wyszukiwarkę — zbierane do analizy. Celowo bez „Utwórz sen": ze zdań nie robimy haseł. Poniżej hasła, które wyszukiwarka z nich wyłowiła.
          </p>
          {sents.length === 0 ? (
            <p className="text-sm text-text-muted">Brak danych.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {sents.map((s) => (
                <div key={s.query} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-bg-elev p-3">
                  <div>
                    <p className="m-0 text-text">{s.query}</p>
                    <p className="m-0 mt-1 flex flex-wrap items-center gap-1.5 text-xs text-text-muted">
                      <span className="rounded-full bg-bg-soft px-2 py-0.5">{s.hits}×</span>
                      <span>{fmt(s.last_at)}</span>
                      {(s.found ?? []).length > 0 ? (
                        (s.found ?? []).map((slug) => (
                          <a key={slug} href={`/hulm/${slug}/`} target="_blank" rel="noreferrer" className="rounded-full border border-accent/40 bg-accent-soft px-2 py-0.5 text-accent">{slug}</a>
                        ))
                      ) : (
                        <span>nic nie wyłowiono</span>
                      )}
                    </p>
                  </div>
                  <button onClick={() => del("sentence", s.query)} aria-label="Usuń" className="shrink-0 rounded-full border border-border px-2 py-1 text-xs text-text-muted hover:text-negative">✕</button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
