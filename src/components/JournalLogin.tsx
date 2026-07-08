"use client";

import { useState, type FormEvent } from "react";
import { T } from "@/locales/pl";

// Logowanie/rejestracja na wejściu do „Mój dziennik". Google (jeśli skonfigurowane)
// albo konto e-mail na sennik. Po sukcesie przeładowuje stronę (serwer pokaże panel).
export default function JournalLogin({ loginAvailable }: { loginAvailable: boolean }) {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function errMsg(code: string, status: number): string {
    switch (code) {
      case "email_taken": return T.journal.errors.emailTaken;
      case "weak_password": return T.journal.errors.weakPassword;
      case "bad_email": return T.journal.errors.badEmail;
      case "bad_credentials": return T.journal.errors.badCredentials;
      case "rate_limited": return T.journal.errors.rateLimited;
      default: return status >= 500 ? T.journal.errors.serverError : T.journal.errors.generic;
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const url = mode === "register" ? "/api/auth/register/" : "/api/auth/login/";
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, name: mode === "register" ? name : undefined }),
      });
      const d = await res.json().catch(() => ({}));
      if (d.ok) { window.location.reload(); return; }
      setError(errMsg(d.error, res.status));
    } catch {
      setError(T.journal.errors.network);
    } finally {
      setBusy(false);
    }
  }

  const googleHref = `/api/auth/google/start/?ret=${encodeURIComponent("/moj-dziennik/")}`;

  return (
    <div className="mx-auto max-w-sm py-6">
      <h1 className="text-2xl font-bold text-text">{T.journal.loginTitle}</h1>
      <p className="mt-2 text-sm text-text-muted">
        {T.journal.loginLead}
      </p>

      {loginAvailable ? (
        <a
          href={googleHref}
          className="dream-save dream-save--calm mt-5 flex w-full items-center justify-center gap-2 px-4 py-3 font-semibold no-underline"
        >
          {T.journal.googleContinue}
        </a>
      ) : (
        <p className="mt-5 rounded-xl border border-border bg-bg-soft p-3 text-xs text-text-muted">
          {T.journal.googleSoon}
        </p>
      )}

      <div className="my-3 flex items-center gap-2 text-xs text-text-muted">
        <span className="h-px flex-1 bg-border" />
        {T.journal.orSiteAccount}
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={submit} className="flex flex-col gap-2">
        {mode === "register" && (
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
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          required
          minLength={8}
          className="rounded-xl border border-border bg-bg-elev px-4 py-2.5 text-text outline-none focus:border-accent"
        />
        {error && <p className="m-0 text-sm text-negative">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="dream-save dream-save--calm mt-1 flex w-full items-center justify-center px-4 py-3 font-semibold disabled:opacity-80"
        >
          {busy ? T.journal.busy : mode === "register" ? T.journal.createAccount : T.journal.login}
        </button>
      </form>

      <button
        type="button"
        onClick={() => { setMode((m) => (m === "register" ? "login" : "register")); setError(null); }}
        className="mt-3 w-full text-sm text-accent hover:underline"
      >
        {mode === "register" ? T.journal.haveAccount : T.journal.noAccount}
      </button>
    </div>
  );
}
