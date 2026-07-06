"use client";

import { useState, type FormEvent } from "react";

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
      case "email_taken": return "Konto z tym e-mailem już istnieje. Zaloguj się.";
      case "weak_password": return "Hasło musi mieć min. 8 znaków.";
      case "bad_email": return "Podaj poprawny adres e-mail.";
      case "bad_credentials": return "Błędny e-mail lub hasło.";
      case "rate_limited": return "Za dużo prób. Spróbuj za chwilę.";
      default: return status >= 500 ? "Chwilowy błąd serwera. Spróbuj ponownie." : "Nie udało się. Spróbuj ponownie.";
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
      setError("Coś poszło nie tak. Spróbuj ponownie.");
    } finally {
      setBusy(false);
    }
  }

  const googleHref = `/api/auth/google/start/?ret=${encodeURIComponent("/moj-dziennik/")}`;

  return (
    <div className="mx-auto max-w-sm py-6">
      <h1 className="text-2xl font-bold text-text">Twój prywatny dziennik snów</h1>
      <p className="mt-2 text-sm text-text-muted">
        Załóż konto na sennik albo zaloguj się, żeby zobaczyć zapisane sny. Tylko Ty widzisz swoje wpisy.
      </p>

      {loginAvailable ? (
        <a
          href={googleHref}
          className="dream-save dream-save--calm mt-5 flex w-full items-center justify-center gap-2 px-4 py-3 font-semibold no-underline"
        >
          Kontynuuj z Google
        </a>
      ) : (
        <p className="mt-5 rounded-xl border border-border bg-bg-soft p-3 text-xs text-text-muted">
          Logowanie Google będzie wkrótce — na razie załóż konto e-mailem poniżej.
        </p>
      )}

      <div className="my-3 flex items-center gap-2 text-xs text-text-muted">
        <span className="h-px flex-1 bg-border" />
        albo kontem na sennik
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={submit} className="flex flex-col gap-2">
        {mode === "register" && (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Imię (opcjonalnie)"
            autoComplete="name"
            className="rounded-xl border border-border bg-bg-elev px-4 py-2.5 text-text outline-none focus:border-accent"
          />
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail"
          autoComplete="email"
          required
          className="rounded-xl border border-border bg-bg-elev px-4 py-2.5 text-text outline-none focus:border-accent"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Hasło (min. 8 znaków)"
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
          {busy ? "Chwila…" : mode === "register" ? "Załóż konto" : "Zaloguj się"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => { setMode((m) => (m === "register" ? "login" : "register")); setError(null); }}
        className="mt-3 w-full text-sm text-accent hover:underline"
      >
        {mode === "register" ? "Masz już konto? Zaloguj się" : "Nie masz konta? Załóż konto"}
      </button>
    </div>
  );
}
