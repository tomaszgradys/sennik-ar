"use client";

import { useEffect, useState } from "react";

// Tryb 3D (anaglif) — dla okularów czerwono-cyjanowych. Opcjonalny, zapamiętany w
// localStorage. Włącza klasę `.threed` na <html>, która uruchamia efekty głębi (globals.css).
const KEY = "sennik-3d";

export default function ThreeDToggle() {
  const [on, setOn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const v = localStorage.getItem(KEY) === "1";
    setOn(v);
    document.documentElement.classList.toggle("threed", v);
    setReady(true);
  }, []);

  function toggle() {
    const v = !on;
    setOn(v);
    try {
      localStorage.setItem(KEY, v ? "1" : "0");
    } catch {
      /* prywatny tryb przeglądarki */
    }
    document.documentElement.classList.toggle("threed", v);
  }

  if (!ready) return null;

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={on}
        title="Tryb 3D dla okularów czerwono-cyjanowych"
        className="link-soft inline-flex items-center gap-1 opacity-70 hover:opacity-100"
      >
        <span aria-hidden>👓</span> {on ? "Wyłącz 3D" : "Tryb 3D"}
      </button>

      {on && (
        <div className="threed-hint" role="status">
          <span aria-hidden>👓</span>
          Załóż okulary 3D (czerwono-cyjanowe)
          <button
            type="button"
            onClick={toggle}
            aria-label="Wyłącz tryb 3D"
            className="ml-1 rounded-full px-1.5 text-text-muted hover:text-text"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
