"use client";

import { useEffect, useState } from "react";
import { THEME_KEY, resolveTheme, blfStrength, type ThemeMode } from "@/lib/theme";

const MODES: { value: ThemeMode; label: string; icon: string; title: string }[] = [
  { value: "light", label: "Dzień", icon: "☀", title: "Tryb jasny" },
  { value: "dark", label: "Noc", icon: "☾", title: "Tryb ciemny" },
];

function apply(mode: ThemeMode) {
  const root = document.documentElement;
  root.dataset.theme = mode;
  root.style.setProperty("--blf", String(blfStrength()));
}

// Zmiana motywu z "sennym" przejściem (rozmycie + rozpłynięcie) tam, gdzie
// przeglądarka wspiera View Transitions; gdzie nie — zwykła, natychmiastowa.
function applyWithTransition(mode: ThemeMode) {
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => void;
  };
  if (doc.startViewTransition) doc.startViewTransition(() => apply(mode));
  else apply(mode);
}

export default function ThemeControls() {
  const [mode, setMode] = useState<ThemeMode>("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Normalizujemy też starą, wycofaną wartość 'auto' → noc.
    setMode(resolveTheme(localStorage.getItem(THEME_KEY)));
    setReady(true);
  }, []);

  function changeMode(m: ThemeMode) {
    setMode(m);
    localStorage.setItem(THEME_KEY, m);
    applyWithTransition(m);
  }

  // Nie renderujemy stanu zależnego od klienta przed hydratacją (unikamy mismatch).
  if (!ready) return <div style={{ width: 150, height: 34 }} aria-hidden />;

  return (
    <div
      role="radiogroup"
      aria-label="Motyw"
      className="flex rounded-full border border-border bg-bg-soft p-0.5"
    >
      {MODES.map((m) => (
        <button
          key={m.value}
          role="radio"
          aria-checked={mode === m.value}
          title={m.title}
          onClick={() => changeMode(m.value)}
          className={`rounded-full px-2 py-1 text-sm transition-colors sm:px-2.5 ${
            mode === m.value
              ? "dream-save dream-save--calm"
              : "text-text-muted hover:text-text"
          }`}
        >
          <span aria-hidden className="sm:mr-1">{m.icon}</span>
          <span className="hidden sm:inline">{m.label}</span>
        </button>
      ))}
    </div>
  );
}
