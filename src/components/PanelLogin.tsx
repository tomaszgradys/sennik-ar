"use client";

import { useEffect, useState } from "react";

export default function PanelLogin() {
  const [login, setLogin] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [caps, setCaps] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [lockLeft, setLockLeft] = useState(0); // sekundy do odblokowania

  // Odliczanie blokady.
  useEffect(() => {
    if (lockLeft <= 0) return;
    const t = setInterval(() => setLockLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [lockLeft]);

  const locked = lockLeft > 0;
  const mmss = `${String(Math.floor(lockLeft / 60)).padStart(2, "0")}:${String(lockLeft % 60).padStart(2, "0")}`;

  function onKey(e: React.KeyboardEvent) {
    if (typeof e.getModifierState === "function") setCaps(e.getModifierState("CapsLock"));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (locked) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/panel/login/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ login, password: pw }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        window.location.reload();
        return;
      }
      if (data.error === "locked") {
        setLockLeft(Number(data.retryAfter) || 900);
        setMsg("Za dużo nieudanych prób. Logowanie tymczasowo zablokowane.");
      } else {
        const r = typeof data.remaining === "number" ? data.remaining : null;
        setMsg(
          r != null && r > 0
            ? `Błędny login lub hasło. Pozostałe próby: ${r}.`
            : "Błędny login lub hasło."
        );
      }
    } catch {
      setMsg("Coś poszło nie tak. Spróbuj ponownie.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="text-2xl font-bold text-text">Panel</h1>
      <p className="mt-2 text-sm text-text-muted">Zaloguj się do panelu administratora.</p>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
        <input
          type="text"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          onKeyUp={onKey}
          placeholder="Login"
          autoComplete="username"
          autoFocus
          disabled={locked}
          className="rounded-xl border border-border bg-bg-elev px-4 py-3 text-text outline-none focus:border-accent disabled:opacity-60"
        />

        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyUp={onKey}
            onKeyDown={onKey}
            placeholder="Hasło"
            autoComplete="current-password"
            disabled={locked}
            className="w-full rounded-xl border border-border bg-bg-elev px-4 py-3 pr-16 text-text outline-none focus:border-accent disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            tabIndex={-1}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs text-text-muted hover:text-text"
          >
            {show ? "Ukryj" : "Pokaż"}
          </button>
        </div>

        {caps && !locked && (
          <p className="m-0 flex items-center gap-1.5 text-sm text-amber-600">
            <span aria-hidden>⇪</span> Uwaga: Caps Lock jest włączony.
          </p>
        )}

        {msg && <p className={`m-0 text-sm ${locked ? "text-amber-600" : "text-negative"}`}>{msg}</p>}

        {locked && (
          <p className="m-0 text-sm text-text-muted">
            Spróbuj ponownie za <span className="font-semibold tabular-nums">{mmss}</span>.
          </p>
        )}

        <button
          type="submit"
          disabled={busy || locked || !login || !pw}
          className="dream-save dream-save--calm mt-1 flex w-full items-center justify-center px-4 py-2.5 font-semibold disabled:opacity-60"
        >
          {locked ? "Zablokowano" : busy ? "Sprawdzam…" : "Zaloguj"}
        </button>
      </form>

      <p className="mt-4 text-xs text-text-muted">
        Po 5 nieudanych próbach logowanie jest blokowane na 15 minut.
      </p>
    </div>
  );
}
