"use client";

import { useEffect, useMemo, useState } from "react";
import EntryThumb from "./EntryThumb";
import { T } from "@/locales/pl";

export interface Entry {
  id: string;
  dreamSlug: string | null;
  thumbUrl: string | null;
  title: string;
  dreamDate: string | null;
  savedAt: string;
  sourceUrl: string | null;
  userDescription: string | null;
  userNotes: string | null;
  mood: string | null;
  emotions: string[];
  people: string[];
  places: string[];
  colors: string[];
  tags: string[];
  isRecurring: boolean;
  memoryStrength: number | null;
  sleepQuality: number | null;
  status: string;
  premiumAnalysisStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface Draft {
  id?: string;
  title: string;
  dream_date: string;
  user_description: string;
  user_notes: string;
  mood: string;
  emotions: string;
  people: string;
  places: string;
  colors: string;
  is_recurring: boolean;
  memory_strength: string;
  sleep_quality: string;
  status: string;
}

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("ar", { day: "numeric", month: "short", year: "numeric" }) : "—";
const csv = (a: string[]) => a.join(", ");
// عنوان في الدفتر: "حلم ..." قصير بدل سؤال "ما تفسير حلم ...؟" (التفسير قرأه المستخدم
// بالفعل ويمكنه العودة إليه بزر). العناوين اليدوية تبقى كما هي.
function journalTitle(t: string): string {
  const m = t.match(/^ما تفسير حلم\s+(.+?)\s+في المنام\??$/);
  if (!m) return t;
  return `حلم ${m[1].trim()}`;
}
const splitCsv = (s: string) =>
  s.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 30);
const todayISO = () => new Date().toISOString().slice(0, 10);

const STATUS_LABEL: Record<string, string> = T.journal.statusLabels;

function emptyDraft(): Draft {
  return {
    title: "", dream_date: todayISO(), user_description: "", user_notes: "", mood: "",
    emotions: "", people: "", places: "", colors: "", is_recurring: false,
    memory_strength: "", sleep_quality: "", status: "saved",
  };
}
function toDraft(e: Entry): Draft {
  return {
    id: e.id, title: e.title, dream_date: e.dreamDate ?? "", user_description: e.userDescription ?? "",
    user_notes: e.userNotes ?? "", mood: e.mood ?? "", emotions: csv(e.emotions), people: csv(e.people),
    places: csv(e.places), colors: csv(e.colors), is_recurring: e.isRecurring,
    memory_strength: e.memoryStrength ? String(e.memoryStrength) : "",
    sleep_quality: e.sleepQuality ? String(e.sleepQuality) : "", status: e.status,
  };
}

export default function JournalDashboard({ initialEntries, userName }: { initialEntries: Entry[]; userName: string | null }) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Filtry.
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [recurring, setRecurring] = useState(false);
  const [incompleteOnly, setIncompleteOnly] = useState(false);
  const [sort, setSort] = useState<"savedAt" | "dreamDate">("savedAt");

  // Auto-otwórz edytor nowego snu przy ?new=1 (CTA ze strony głównej).
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("new") === "1") setEditing(emptyDraft());
  }, []);

  function showToast(m: string) {
    setToast(m);
    window.setTimeout(() => setToast(null), 3000);
  }

  const filtered = useMemo(() => {
    let list = entries.slice();
    const query = q.trim().toLowerCase();
    if (query) list = list.filter((e) => (e.title + " " + (e.userDescription ?? "")).toLowerCase().includes(query));
    if (status !== "all") list = list.filter((e) => e.status === status);
    if (recurring) list = list.filter((e) => e.isRecurring);
    if (incompleteOnly) list = list.filter((e) => e.status !== "completed");
    list.sort((a, b) => {
      const av = sort === "dreamDate" ? a.dreamDate ?? "" : a.savedAt;
      const bv = sort === "dreamDate" ? b.dreamDate ?? "" : b.savedAt;
      return av < bv ? 1 : -1;
    });
    return list;
  }, [entries, q, status, recurring, incompleteOnly, sort]);

  async function saveDraft() {
    if (!editing || busy) return;
    if (!editing.title.trim()) { setErr(T.journal.titleRequired); return; }
    setBusy(true);
    setErr(null);
    const body: Record<string, unknown> = {
      title: editing.title.trim(),
      dream_date: editing.dream_date || null,
      user_description: editing.user_description || null,
      user_notes: editing.user_notes || null,
      mood: editing.mood || null,
      emotions: splitCsv(editing.emotions),
      people: splitCsv(editing.people),
      places: splitCsv(editing.places),
      colors: splitCsv(editing.colors),
      is_recurring: editing.is_recurring,
      memory_strength: editing.memory_strength ? Number(editing.memory_strength) : null,
      sleep_quality: editing.sleep_quality ? Number(editing.sleep_quality) : null,
      status: editing.status,
    };
    try {
      const isEdit = !!editing.id;
      const res = await fetch(isEdit ? `/api/journal/${editing.id}/` : "/api/journal/", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => ({}));
      if (!d.ok) { setErr(d.message || T.journal.saveFailed); return; }
      setEntries((prev) => {
        const e = d.entry as Entry;
        const rest = prev.filter((x) => x.id !== e.id);
        return [e, ...rest];
      });
      setEditing(null);
      showToast(isEdit ? T.journal.changesSaved : T.journal.dreamAdded);
    } catch {
      setErr(T.journal.genericError);
    } finally {
      setBusy(false);
    }
  }

  async function del(id: string) {
    if (!window.confirm(T.journal.confirmDeleteEntry)) return;
    const res = await fetch(`/api/journal/${id}/`, { method: "DELETE" });
    if (res.ok) { setEntries((p) => p.filter((e) => e.id !== id)); showToast(T.journal.entryDeleted); }
  }

  async function deleteAccount() {
    if (!window.confirm(T.journal.confirmDeleteAccount)) return;
    const res = await fetch("/api/account/", { method: "DELETE" });
    if (res.ok) window.location.href = "/";
  }

  async function logout() {
    await fetch("/api/auth/logout/", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">{T.journal.title}</h1>
          <p className="m-0 text-sm text-text-muted">
            {userName ? `${T.journal.greetingHi} ${userName}. ` : ""}{T.journal.onlyYouSeeEntries}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setErr(null); setEditing(emptyDraft()); }}
            className="dream-save dream-save--calm inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold"
          >
            {T.journal.addDream}
          </button>
          <button onClick={logout} className="rounded-full border border-border px-3 py-2 text-sm text-text-muted">
            {T.nav.logout}
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-border bg-bg-elev p-8 text-center">
          <h2 className="m-0 text-lg font-semibold text-text">{T.journal.emptyTitle}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-muted">
            {T.journal.emptyLead}
          </p>
          <button
            onClick={() => { setErr(null); setEditing(emptyDraft()); }}
            className="dream-save mt-4 inline-flex items-center gap-2 px-5 py-2.5 font-semibold"
          >
            {T.journal.addFirstDream}
          </button>
        </div>
      ) : (
        <>
          {/* Filtry */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={T.journal.searchPlaceholder}
              className="min-w-[160px] flex-1 rounded-xl border border-border bg-bg-elev px-3 py-2 text-sm text-text outline-none focus:border-accent"
            />
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-border bg-bg-elev px-3 py-2 text-sm text-text">
              <option value="all">{T.journal.statusAll}</option>
              <option value="saved">{T.journal.statusSaved}</option>
              <option value="completed">{T.journal.statusCompleted}</option>
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value as "savedAt" | "dreamDate")} className="rounded-xl border border-border bg-bg-elev px-3 py-2 text-sm text-text">
              <option value="savedAt">{T.journal.sortBySavedAt}</option>
              <option value="dreamDate">{T.journal.sortByDreamDate}</option>
            </select>
            <label className="flex items-center gap-1.5 text-sm text-text-muted">
              <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} /> {T.journal.recurringFilter}
            </label>
            <label className="flex items-center gap-1.5 text-sm text-text-muted">
              <input type="checkbox" checked={incompleteOnly} onChange={(e) => setIncompleteOnly(e.target.checked)} /> {T.journal.incompleteFilter}
            </label>
          </div>

          {/* Lista */}
          <div className="flex flex-col gap-3">
            {filtered.map((e) => (
              <article key={e.id} className="group flex gap-4 rounded-2xl border border-border bg-bg-elev p-4">
                {/* Miniatura snu */}
                <div className="relative hidden h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-border/70 sm:block">
                  <EntryThumb src={e.thumbUrl} slug={e.dreamSlug} title={e.title} className="transition-transform duration-700 ease-out group-hover:scale-[1.05]" />
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" aria-hidden />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="m-0 text-base font-semibold text-text">{journalTitle(e.title)}</h3>
                      <p className="m-0 mt-0.5 text-xs text-text-muted">
                        {T.journal.dreamedOn} {fmt(e.dreamDate)} · {T.journal.savedOn} {fmt(e.savedAt)}
                        {e.isRecurring ? ` · ${T.journal.recurringBadge}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-bg-soft px-2 py-0.5 text-xs text-text-muted">
                      {STATUS_LABEL[e.status] ?? e.status}
                    </span>
                  </div>

                  {e.userDescription && <p className="m-0 mt-2 line-clamp-3 text-sm text-text">{e.userDescription}</p>}

                  {(e.emotions.length > 0 || e.tags.length > 0) && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {e.emotions.map((t) => (
                        <span key={"e" + t} className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">{t}</span>
                      ))}
                      {e.tags.map((t) => (
                        <span key={"t" + t} className="rounded-full bg-bg-soft px-2 py-0.5 text-xs text-text-muted">#{t}</span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button onClick={() => { setErr(null); setEditing(toDraft(e)); }} className="rounded-full border border-border px-3 py-1.5 text-sm text-text hover:border-accent hover:text-accent">
                      {T.journal.edit}
                    </button>
                    {e.dreamSlug && (
                      <a href={`/sen/${e.dreamSlug}/`} className="rounded-full border border-border px-3 py-1.5 text-sm text-text-muted no-underline hover:text-accent">
                        {T.journal.viewInterpretation}
                      </a>
                    )}
                    <button onClick={() => del(e.id)} className="ml-auto rounded-full border border-border px-3 py-1.5 text-sm text-text-muted hover:text-negative">
                      {T.journal.delete}
                    </button>
                  </div>
                </div>
              </article>
            ))}
            {filtered.length === 0 && (
              <p className="rounded-xl border border-border bg-bg-elev p-4 text-sm text-text-muted">
                {T.journal.noMatches}
              </p>
            )}
          </div>
        </>
      )}

      {/* Strefa RODO */}
      <div className="mt-4 rounded-xl border border-border bg-bg-soft/60 p-4">
        <h2 className="m-0 text-sm font-semibold text-text">{T.journal.yourData}</h2>
        <p className="m-0 mt-1 text-xs text-text-muted">
          {T.journal.dataDeleteNote}
        </p>
        <button onClick={deleteAccount} className="mt-2 rounded-full border border-negative/50 px-3 py-1.5 text-sm text-negative hover:bg-negative hover:text-white">
          {T.journal.deleteAccount}
        </button>
      </div>

      {/* Edytor (nowy / edycja) */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center" onClick={() => setEditing(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={editing.id ? T.journal.editDreamAria : T.journal.addDreamAria}
            onClick={(ev) => ev.stopPropagation()}
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-bg-elev p-5 shadow-xl"
          >
            <h2 className="m-0 text-lg font-bold text-text">{editing.id ? T.journal.editDreamTitle : T.journal.addDreamTitle}</h2>
            <div className="mt-3 flex flex-col gap-2.5">
              <Field label={T.journal.fieldTitle}>
                <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className={inputCls} placeholder={T.journal.titlePlaceholder} />
              </Field>
              <div className="grid grid-cols-2 gap-2.5">
                <Field label={T.journal.fieldDate}>
                  <input type="date" value={editing.dream_date} onChange={(e) => setEditing({ ...editing, dream_date: e.target.value })} className={inputCls} />
                </Field>
                <Field label={T.journal.fieldStatus}>
                  <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className={inputCls}>
                    <option value="saved">{T.journal.statusSaved}</option>
                    <option value="completed">{T.journal.statusCompleted}</option>
                  </select>
                </Field>
              </div>
              <Field label={T.journal.fieldDescription}>
                <textarea value={editing.user_description} onChange={(e) => setEditing({ ...editing, user_description: e.target.value })} rows={4} maxLength={5000} className={inputCls} placeholder={T.journal.descriptionPlaceholder} />
              </Field>
              <Field label={T.journal.fieldEmotions}>
                <input value={editing.emotions} onChange={(e) => setEditing({ ...editing, emotions: e.target.value })} className={inputCls} placeholder={T.journal.emotionsPlaceholder} />
              </Field>
              <div className="grid grid-cols-2 gap-2.5">
                <Field label={T.journal.fieldPeople}>
                  <input value={editing.people} onChange={(e) => setEditing({ ...editing, people: e.target.value })} className={inputCls} placeholder={T.journal.peoplePlaceholder} />
                </Field>
                <Field label={T.journal.fieldPlaces}>
                  <input value={editing.places} onChange={(e) => setEditing({ ...editing, places: e.target.value })} className={inputCls} placeholder={T.journal.placesPlaceholder} />
                </Field>
              </div>
              <Field label={T.journal.fieldColors}>
                <input value={editing.colors} onChange={(e) => setEditing({ ...editing, colors: e.target.value })} className={inputCls} placeholder={T.journal.colorsPlaceholder} />
              </Field>
              <div className="grid grid-cols-2 gap-2.5">
                <Field label={T.journal.fieldMemoryStrength}>
                  <input type="number" min={1} max={5} value={editing.memory_strength} onChange={(e) => setEditing({ ...editing, memory_strength: e.target.value })} className={inputCls} />
                </Field>
                <Field label={T.journal.fieldSleepQuality}>
                  <input type="number" min={1} max={5} value={editing.sleep_quality} onChange={(e) => setEditing({ ...editing, sleep_quality: e.target.value })} className={inputCls} />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm text-text">
                <input type="checkbox" checked={editing.is_recurring} onChange={(e) => setEditing({ ...editing, is_recurring: e.target.checked })} />
                {T.journal.recurringCheckbox}
              </label>
              <Field label={T.journal.fieldNotes}>
                <textarea value={editing.user_notes} onChange={(e) => setEditing({ ...editing, user_notes: e.target.value })} rows={2} maxLength={5000} className={inputCls} placeholder={T.journal.notesPlaceholder} />
              </Field>
              {err && <p className="m-0 text-sm text-negative">{err}</p>}
              <button onClick={saveDraft} disabled={busy} className="dream-save dream-save--calm mt-1 flex w-full items-center justify-center px-4 py-3 font-semibold disabled:opacity-80">
                {busy ? T.journal.saving : editing.id ? T.journal.saveChanges : T.journal.addDreamSubmit}
              </button>
              <button onClick={() => setEditing(null)} className="w-full rounded-full px-4 py-2 text-sm text-text-muted hover:text-text">
                {T.journal.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div role="status" aria-live="polite" className="dream-toast fixed inset-x-0 bottom-6 z-[60] mx-auto flex w-fit items-center gap-2 rounded-full border border-border bg-bg-elev px-4 py-2.5 text-sm text-text shadow-lg">
          <span className="text-accent">✓</span> {toast}
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-border bg-bg-elev px-3 py-2 text-text outline-none focus:border-accent";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-text-muted">{label}</span>
      {children}
    </label>
  );
}
