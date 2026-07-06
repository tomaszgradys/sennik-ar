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
        title="وضع ثلاثي الأبعاد لنظارات أحمر-سماوي"
        className="link-soft inline-flex items-center gap-1 opacity-70 hover:opacity-100"
      >
        <span aria-hidden>👓</span> {on ? "إيقاف 3D" : "وضع 3D"}
      </button>

      {on && (
        <div className="threed-hint" role="status">
          <span aria-hidden>👓</span>
          ارتدِ نظارة ثلاثية الأبعاد (أحمر-سماوي)
          <button
            type="button"
            onClick={toggle}
            aria-label="إيقاف الوضع ثلاثي الأبعاد"
            className="ml-1 rounded-full px-1.5 text-text-muted hover:text-text"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
