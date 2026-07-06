"use client";

import { useEffect, useState } from "react";
import type { BlogOverview } from "@/lib/blogSchedule";
import type { CostEstimate, SelfHostedEstimate } from "@/lib/blogCosts";
import type { AdminUserRow } from "@/lib/adminUsers";
import type { StatsData } from "@/lib/stats";
import StatsCharts from "./StatsCharts";

interface Submission {
  id: number;
  body: string;
  email: string | null;
  status: string;
  created_at: string;
}
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
const DAY_MS = 86400000;
function rel(d: string | null): string {
  if (!d) return "—";
  const ms = Date.now() - new Date(d).getTime();
  if (ms < DAY_MS) return "dziś";
  const days = Math.floor(ms / DAY_MS);
  if (days < 30) return `${days} dni temu`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mies. temu`;
  return `${Math.floor(months / 12)} lat temu`;
}
function activeWithin30(u: { lastEntryAt: string | null; lastLoginAt: string | null }): boolean {
  const t = u.lastEntryAt || u.lastLoginAt;
  return t ? Date.now() - new Date(t).getTime() < 30 * DAY_MS : false;
}
const FREQ_OPTIONS: { days: number; label: string }[] = [
  { days: 1, label: "Codziennie" },
  { days: 2, label: "Co 2 dni" },
  { days: 3, label: "Co 3 dni" },
  { days: 7, label: "Raz w tygodniu" },
];
const freqLabel = (days: number) => FREQ_OPTIONS.find((o) => o.days === days)?.label ?? `co ${days} dni`;

type TabId = "sny" | "statystyka" | "blog" | "koszty" | "uzytkownicy" | "zgloszenia" | "szukane" | "zdania";

export default function PanelDashboard({
  submissions,
  misses,
  sentences,
  blog,
  costs,
  selfHosted,
  blogEveryDays,
  stats,
}: {
  submissions: Submission[];
  misses: Miss[];
  sentences: Sentence[];
  blog: BlogOverview;
  costs: CostEstimate;
  selfHosted: SelfHostedEstimate;
  blogEveryDays: number;
  stats: StatsData;
}) {
  const [subs, setSubs] = useState(submissions);
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

  // Użytkownicy — ładowane leniwie przy pierwszym wejściu w zakładkę.
  const [users, setUsers] = useState<AdminUserRow[] | null>(null);
  const [usersErr, setUsersErr] = useState<string | null>(null);
  const [userBusy, setUserBusy] = useState<string | null>(null);

  useEffect(() => {
    if (tab !== "uzytkownicy" || users !== null) return;
    let alive = true;
    fetch("/api/panel/users/")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (alive) setUsers(d.users ?? []); })
      .catch(() => { if (alive) setUsersErr("Nie udało się wczytać użytkowników (baza?)."); });
    return () => { alive = false; };
  }, [tab, users]);

  async function delUser(u: AdminUserRow) {
    if (!window.confirm(`Usunąć konto ${u.email} i WSZYSTKIE jego sny? Nieodwracalne.`)) return;
    setUserBusy(u.id);
    try {
      const res = await fetch(`/api/panel/users/?id=${encodeURIComponent(u.id)}`, { method: "DELETE" });
      if (res.ok) setUsers((list) => (list ? list.filter((x) => x.id !== u.id) : list));
    } finally {
      setUserBusy(null);
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

  async function del(type: "submission" | "miss" | "sentence", id: number | string) {
    await fetch("/api/panel/delete/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type, id }),
    });
    if (type === "submission") setSubs((s) => s.filter((x) => x.id !== id));
    else if (type === "miss") setMs((m) => m.filter((x) => x.query !== id));
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
    { id: "uzytkownicy", label: "Użytkownicy", count: users?.length },
    { id: "zgloszenia", label: "Zgłoszenia", count: subs.length },
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

      {/* UŻYTKOWNICY */}
      {tab === "uzytkownicy" && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="m-0 text-lg font-semibold text-text">
              Użytkownicy {users ? `(${users.length})` : ""}
            </h2>
            <button
              onClick={() => { setUsers(null); setUsersErr(null); }}
              className="rounded-full border border-border px-3 py-1.5 text-sm text-text-muted hover:text-text"
            >
              Odśwież
            </button>
          </div>

          {usersErr && <p className="m-0 text-sm text-negative">{usersErr}</p>}
          {!users && !usersErr && <p className="m-0 text-sm text-text-muted">Wczytuję…</p>}

          {users && users.length > 0 && (
            <>
              {/* Podsumowanie */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Konta", value: users.length },
                  { label: "Aktywni (30 dni)", value: users.filter(activeWithin30).length },
                  { label: "Zapisane sny", value: users.reduce((s, u) => s + u.entryCount, 0) },
                ].map((k) => (
                  <div key={k.label} className="rounded-xl border border-border bg-bg-elev p-3 text-center">
                    <div className="text-xl font-bold text-text">{k.value}</div>
                    <div className="text-xs text-text-muted">{k.label}</div>
                  </div>
                ))}
              </div>

              {/* Lista kont */}
              <div className="flex flex-col gap-2">
                {users.map((u) => {
                  const active = activeWithin30(u);
                  const initial = (u.name?.trim()?.[0] ?? u.email?.[0] ?? "?").toUpperCase();
                  return (
                    <div key={u.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-bg-elev p-3">
                      <div className="nav-avatar flex h-9 w-9 shrink-0 items-center justify-center text-sm" aria-hidden>
                        {u.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element -- awatar Google
                          <img src={u.avatarUrl} alt="" width={36} height={36} className="h-full w-full rounded-full object-cover" referrerPolicy="no-referrer" />
                        ) : initial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-text">{u.name || u.email}</span>
                          <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${active ? "bg-positive/15 text-positive" : "bg-bg-soft text-text-muted"}`}>
                            {active ? "aktywny" : "nieaktywny"}
                          </span>
                        </div>
                        <div className="truncate text-xs text-text-muted">{u.email}</div>
                        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-text-muted">
                          <span>🌙 {u.entryCount} {u.entryCount === 1 ? "sen" : "snów"}</span>
                          <span>przez {u.provider === "google" ? "Google" : "e-mail"}</span>
                          <span>dołączył {rel(u.createdAt)}</span>
                          <span>ostatni sen {rel(u.lastEntryAt)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => delUser(u)}
                        disabled={userBusy === u.id}
                        className="shrink-0 rounded-full border border-negative/50 px-3 py-1.5 text-sm text-negative hover:bg-negative hover:text-white disabled:opacity-60"
                      >
                        {userBusy === u.id ? "Usuwam…" : "Usuń"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {users && users.length === 0 && (
            <p className="m-0 rounded-xl border border-border bg-bg-elev p-4 text-sm text-text-muted">
              Nie ma jeszcze żadnych zarejestrowanych użytkowników.
            </p>
          )}
        </section>
      )}

      {/* ZGŁOSZENIA */}
      {tab === "zgloszenia" && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-text">Zgłoszenia „nie znalazłeś snu?" ({subs.length})</h2>
          {subs.length === 0 ? (
            <p className="text-sm text-text-muted">Brak zgłoszeń.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {subs.map((s) => (
                <div key={s.id} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-bg-elev p-3">
                  <div>
                    <p className="m-0 text-text">{s.body}</p>
                    <p className="m-0 mt-1 text-xs text-text-muted">{fmt(s.created_at)}{s.email ? ` · ${s.email}` : ""}</p>
                  </div>
                  <button onClick={() => del("submission", s.id)} aria-label="Usuń" className="shrink-0 rounded-full border border-border px-2 py-1 text-xs text-text-muted hover:text-negative">✕</button>
                </div>
              ))}
            </div>
          )}
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
                          <a key={slug} href={`/sen/${slug}/`} target="_blank" rel="noreferrer" className="rounded-full border border-accent/40 bg-accent-soft px-2 py-0.5 text-accent">{slug}</a>
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
