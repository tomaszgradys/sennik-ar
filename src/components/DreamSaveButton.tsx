"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { T } from "@/locales/pl";
import { track } from "@/lib/track";

// „Dodaj do dziennika": atrakcyjny przycisk przy nagłówku snu + latający widget w rogu
// na telefonie. Zalogowany zapisuje jednym kliknięciem; niezalogowany dostaje lekki
// modal (Google albo konto e-mail na sennik). Zero tarcia — szczegóły dopiero w panelu.

interface Props {
  slug: string;
  title: string;
  sourcePath: string; // np. /sen/waz/
}

type State = "idle" | "saving" | "saved" | "exists";

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M21 12.9A8.5 8.5 0 1 1 11.1 3a6.6 6.6 0 0 0 9.9 9.9z" />
    </svg>
  );
}

// Oficjalne, 4-kolorowe „G" Google — od razu rozpoznawalne jako logowanie Google.
function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}

export default function DreamSaveButton({ slug, title, sourcePath }: Props) {
  const [state, setState] = useState<State>("idle");
  const [modal, setModal] = useState(false);
  const [loginAvailable, setLoginAvailable] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const modalBtnRef = useRef<HTMLAnchorElement>(null);

  const [authMode, setAuthMode] = useState<"register" | "login">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Opcjonalny opis snu po zapisie (drugi krok, w całości do pominięcia).
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);
  const [descOpen, setDescOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [descBusy, setDescBusy] = useState(false);
  const [descError, setDescError] = useState<string | null>(null);

  // Rozsuwana sekcja „więcej szczegółów" — ukryta domyślnie, żeby nie przytłoczyć.
  const [moreOpen, setMoreOpen] = useState(false);
  const [emotions, setEmotions] = useState("");
  const [people, setPeople] = useState("");
  const [places, setPlaces] = useState("");
  const [mood, setMood] = useState("");

  useEffect(() => {
    track("dream_journal_cta_view", { dream_slug: slug, cta_location: "symbol_page" });
    const p = new URLSearchParams(window.location.search);
    const s = p.get("saved");
    if (s === "1") { setState("saved"); showToast(T.save.toastSaved); }
    else if (s === "exists") { setState("exists"); showToast(T.save.toastExists); }
    if (p.get("login") === "unavailable") showToast(T.save.toastLoginUnavailable);

    // Wracający zalogowany użytkownik, który już zapisał ten sen → pokaż „✓ Zapisano".
    // Odpytujemy TYLKO gdy jest jawna flaga zalogowania (zero zapytań dla niezalogowanych).
    const loggedIn = document.cookie.split("; ").some((c) => c.startsWith("sennik_auth="));
    if (loggedIn && s == null) {
      fetch(`/api/journal/?symbol=${encodeURIComponent(slug)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.ok && Array.isArray(d.entries) && d.entries.length > 0) {
            setState((cur) => (cur === "idle" ? "exists" : cur));
          }
        })
        .catch(() => {});
    }
  }, [slug]);

  useEffect(() => {
    if (!modal) return;
    modalBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setModal(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal]);

  useEffect(() => {
    if (!descOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDescOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [descOpen]);

  function showToast(m: string) {
    setToast(m);
    window.setTimeout(() => setToast(null), 3000);
  }

  // Otwórz drugi (opcjonalny) krok — czysty formularz szczegółów.
  function openDesc(entryId: string) {
    setSavedEntryId(entryId);
    setDesc(""); setEmotions(""); setPeople(""); setPlaces(""); setMood("");
    setMoreOpen(false); setDescError(null);
    setDescOpen(true);
  }

  async function save(again = false) {
    if (state === "saving") return;
    if (done && !again) return; // zwykłe kliknięcie po zapisie nic nie robi; powtórka = jawny link
    track(again ? "dream_journal_save_again" : "dream_journal_cta_click", { dream_slug: slug, cta_location: "symbol_page" });
    setState("saving");
    try {
      const res = await fetch("/api/journal/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ quick: true, again, title, slug, sourceUrl: sourcePath, sourceType: "symbol_page" }),
      });
      if (res.status === 401) {
        setState("idle");
        const me = await fetch("/api/auth/me/").then((r) => r.json()).catch(() => ({ loginAvailable: true }));
        setLoginAvailable(me.loginAvailable !== false);
        track("dream_journal_login_prompt_view", { dream_slug: slug });
        setModal(true);
        return;
      }
      if (res.status === 429) { setState("idle"); showToast(T.save.toastTooMany); return; }
      const d = await res.json().catch(() => ({}));
      if (d.ok) {
        track("dream_journal_save_success", { dream_slug: slug, logged_in: true, duplicate: !!d.duplicate });
        setState(d.duplicate ? "exists" : "saved");
        if (d.duplicate) {
          showToast(T.save.toastExists);
        } else if (d.entry?.id) {
          openDesc(d.entry.id); // drugi, opcjonalny krok: opis + szczegóły
        } else {
          showToast(T.save.toastSaved);
        }
      } else {
        track("dream_journal_save_failed", { dream_slug: slug });
        setState("idle"); showToast(T.save.toastSaveFailed);
      }
    } catch {
      track("dream_journal_save_failed", { dream_slug: slug });
      setState("idle"); showToast(T.save.toastSaveFailed);
    }
  }

  async function saveDesc() {
    if (!savedEntryId || descBusy) return;
    const splitCsv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 30);
    // Nic nie wpisano? Traktuj „Zapisz" jak „Gotowe" — po prostu zamknij.
    const hasAny = desc.trim() || emotions.trim() || people.trim() || places.trim() || mood.trim();
    if (!hasAny) { setDescOpen(false); return; }
    setDescBusy(true);
    setDescError(null);
    const body: Record<string, unknown> = { user_description: desc.trim() || null };
    if (moreOpen) {
      body.emotions = splitCsv(emotions);
      body.people = splitCsv(people);
      body.places = splitCsv(places);
      body.mood = mood.trim() || null;
    }
    try {
      const res = await fetch(`/api/journal/${savedEntryId}/`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => ({}));
      if (d.ok) { track("dream_journal_details_completed", { dream_slug: slug }); setDescOpen(false); showToast(T.save.toastDetailsSaved); }
      else setDescError(d.message || T.save.toastGenericError);
    } catch {
      setDescError(T.save.toastGenericError);
    } finally {
      setDescBusy(false);
    }
  }

  function authErrMsg(code: string, status: number): string {
    switch (code) {
      case "email_taken": return T.journal.errors.emailTaken;
      case "weak_password": return T.journal.errors.weakPassword;
      case "bad_email": return T.journal.errors.badEmail;
      case "bad_credentials": return T.journal.errors.badCredentials;
      case "rate_limited": return T.journal.errors.rateLimited;
      default: return status >= 500 ? T.journal.errors.serverError : T.journal.errors.generic;
    }
  }

  async function submitAuth(e: FormEvent) {
    e.preventDefault();
    if (authBusy) return;
    setAuthBusy(true);
    setAuthError(null);
    try {
      const url = authMode === "register" ? "/api/auth/register/" : "/api/auth/login/";
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name: authMode === "register" ? name : undefined,
          save: { slug, title, sourceUrl: sourcePath, sourceType: "symbol_page" },
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (d.ok) {
        track("dream_journal_save_success", { dream_slug: slug, logged_in: false, via: authMode });
        setModal(false);
        setState(d.saved === "exists" ? "exists" : "saved");
        if (d.saved === "exists") {
          showToast(T.save.toastExists);
        } else if (d.entryId) {
          openDesc(d.entryId);
        } else {
          showToast(T.save.toastSaved);
        }
        return;
      }
      setAuthError(authErrMsg(d.error, res.status));
    } catch {
      setAuthError(T.journal.errors.network);
    } finally {
      setAuthBusy(false);
    }
  }

  const loginHref =
    `/api/auth/google/start/?ret=${encodeURIComponent(sourcePath)}` +
    `&title=${encodeURIComponent(title)}&slug=${encodeURIComponent(slug)}` +
    `&sourceUrl=${encodeURIComponent(sourcePath)}&sourceType=symbol_page`;

  const done = state === "saved" || state === "exists";
  const label = state === "saving" ? T.save.saving : done ? T.save.saved : T.save.add;

  return (
    <>
      {/* Atrakcyjny przycisk przy nagłówku */}
      <div className="mt-5 flex flex-col items-start gap-1.5">
        <button
          type="button"
          onClick={() => save()}
          disabled={state === "saving"}
          aria-label={done ? T.save.savedAria : T.save.addAria}
          className={`dream-save ${done ? "dream-save--done" : ""} inline-flex items-center gap-2.5 px-6 py-3 text-base font-semibold disabled:opacity-80`}
        >
          <span className="dream-save__spark">{done ? "✓" : <MoonIcon />}</span>
          {label}
        </button>
        {done && (
          <button
            type="button"
            onClick={() => save(true)}
            className="pl-1 text-sm text-text-muted underline-offset-2 transition-colors hover:text-accent hover:underline"
          >
            {T.save.saveAgain}
          </button>
        )}
      </div>

      {/* Latający widget w rogu — tylko telefon */}
      <div className="fixed bottom-5 right-4 z-40 sm:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <button
          type="button"
          onClick={() => save(done)}
          disabled={state === "saving"}
          aria-label={done ? T.save.saveAgain : T.save.saveMobileAria}
          className={`dream-save ${done ? "dream-save--done" : ""} flex items-center gap-2 px-4 py-3 text-sm font-semibold disabled:opacity-80`}
        >
          <span className="dream-save__spark">{done ? "✓" : <MoonIcon />}</span>
          {state === "saving" ? T.save.saving : done ? T.save.saveAgainMobile : T.save.saveMobile}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="dream-toast fixed inset-x-0 bottom-6 z-[60] mx-auto flex w-fit max-w-[90vw] items-center gap-2 rounded-full border border-border bg-bg-elev px-4 py-2.5 text-sm text-text shadow-lg"
        >
          {/(حفظ|الدفتر)/.test(toast) && <span className="text-accent">✓</span>}
          {toast}
        </div>
      )}

      {/* Modal logowania / rejestracji */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={() => setModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={T.save.modalAria}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-border bg-bg-elev p-5 shadow-xl"
          >
            <div className="mb-4 text-center">
              <h2 className="m-0 text-base font-bold text-text">{T.save.modalTitle}</h2>
              <p className="mx-auto mt-1 max-w-[17rem] text-xs text-text-muted">
                {T.save.modalLead}
              </p>
            </div>

            {loginAvailable ? (
              <a
                ref={modalBtnRef}
                href={loginHref}
                rel="nofollow"
                onClick={() => track("dream_journal_google_login_start", { dream_slug: slug })}
                style={{ color: "#3c4043" }}
                className="flex w-full items-center justify-center gap-2.5 rounded-full border border-[#dadce0] bg-white px-4 py-2.5 text-sm font-medium no-underline shadow-sm transition-shadow hover:shadow-md"
              >
                <GoogleG />
                {T.journal.googleContinue}
              </a>
            ) : (
              <p className="rounded-xl border border-border bg-bg-soft p-3 text-xs text-text-muted">
                {T.journal.googleSoon}
              </p>
            )}

            <div className="my-3 flex items-center gap-2 text-xs text-text-muted">
              <span className="h-px flex-1 bg-border" />
              {T.save.orSiteAccount}
              <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={submitAuth} className="flex flex-col gap-2">
              {authMode === "register" && (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={T.journal.namePlaceholder}
                  autoComplete="name"
                  className="rounded-xl border border-border bg-bg-elev px-4 py-2.5 text-text outline-none focus:border-accent"
                />
              )}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={T.journal.emailPlaceholder}
                autoComplete="email"
                required
                className="rounded-xl border border-border bg-bg-elev px-4 py-2.5 text-text outline-none focus:border-accent"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={T.journal.passwordPlaceholder}
                autoComplete={authMode === "register" ? "new-password" : "current-password"}
                required
                minLength={8}
                className="rounded-xl border border-border bg-bg-elev px-4 py-2.5 text-text outline-none focus:border-accent"
              />
              {authError && <p className="m-0 text-sm text-negative">{authError}</p>}
              <button
                type="submit"
                disabled={authBusy}
                className="dream-save dream-save--calm mt-1 flex w-full items-center justify-center px-4 py-2.5 text-sm font-semibold disabled:opacity-80"
              >
                {authBusy ? T.journal.busy : authMode === "register" ? T.save.createAndSave : T.save.loginAndSave}
              </button>
            </form>

            <button
              type="button"
              onClick={() => { setAuthMode((m) => (m === "register" ? "login" : "register")); setAuthError(null); }}
              className="mt-2 w-full text-sm text-accent hover:underline"
            >
              {authMode === "register" ? T.journal.haveAccount : T.journal.noAccount}
            </button>

            <button
              type="button"
              onClick={() => setModal(false)}
              className="mt-1 w-full rounded-full px-4 py-2 text-sm text-text-muted hover:text-text"
            >
              {T.save.notNow}
            </button>
          </div>
        </div>
      )}

      {/* Opcjonalny opis snu — drugi krok, do pominięcia */}
      {descOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={() => setDescOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={T.save.detailsDialogAria}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-bg-elev p-6 shadow-xl"
          >
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-accent">
              <span>✓</span> {T.save.detailsSavedBadge}
            </div>
            <h2 className="m-0 text-lg font-bold text-text">{T.save.detailsPrompt}</h2>
            <p className="mt-1 text-sm text-text-muted">
              {T.save.detailsLead}
            </p>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={4}
              maxLength={5000}
              autoFocus
              placeholder={T.save.detailsPlaceholder}
              className="mt-3 w-full resize-y rounded-xl border border-border bg-bg-elev px-4 py-3 text-text outline-none focus:border-accent"
            />

            {/* Rozsuwana sekcja — ukryta domyślnie, żeby nie przytłoczyć polami. */}
            <button
              type="button"
              onClick={() => setMoreOpen((o) => !o)}
              aria-expanded={moreOpen}
              className="mt-2 flex w-full items-center justify-between rounded-xl px-1 py-1.5 text-sm text-accent hover:underline"
            >
              <span>{moreOpen ? T.save.hideDetails : T.save.moreDetails}</span>
              <span className={`transition-transform duration-300 ${moreOpen ? "rotate-180" : ""}`} aria-hidden>⌄</span>
            </button>

            {moreOpen && (
              <div className="mt-1 flex flex-col gap-2.5 border-t border-border pt-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-text-muted">{T.save.emotionsLabel}</span>
                  <input value={emotions} onChange={(e) => setEmotions(e.target.value)} placeholder={T.save.emotionsPlaceholder} className="rounded-xl border border-border bg-bg-elev px-3 py-2 text-text outline-none focus:border-accent" />
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-text-muted">{T.save.peopleLabel}</span>
                    <input value={people} onChange={(e) => setPeople(e.target.value)} placeholder={T.save.peoplePlaceholder} className="rounded-xl border border-border bg-bg-elev px-3 py-2 text-text outline-none focus:border-accent" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-text-muted">{T.save.placesLabel}</span>
                    <input value={places} onChange={(e) => setPlaces(e.target.value)} placeholder={T.save.placesPlaceholder} className="rounded-xl border border-border bg-bg-elev px-3 py-2 text-text outline-none focus:border-accent" />
                  </label>
                </div>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-text-muted">{T.save.moodLabel}</span>
                  <input value={mood} onChange={(e) => setMood(e.target.value)} placeholder={T.save.moodPlaceholder} className="rounded-xl border border-border bg-bg-elev px-3 py-2 text-text outline-none focus:border-accent" />
                </label>
                <p className="m-0 text-xs text-text-muted">{T.save.restNote}</p>
              </div>
            )}

            {descError && <p className="mt-2 text-sm text-negative">{descError}</p>}
            <button
              type="button"
              onClick={saveDesc}
              disabled={descBusy}
              className="dream-save dream-save--calm mt-3 flex w-full items-center justify-center px-4 py-3 font-semibold disabled:opacity-80"
            >
              {descBusy ? T.save.saving : T.save.saveDetails}
            </button>
            <button
              type="button"
              onClick={() => setDescOpen(false)}
              className="mt-1 w-full rounded-full px-4 py-2 text-sm text-text-muted hover:text-text"
            >
              {T.save.done}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
