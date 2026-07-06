"use client";

import { useEffect } from "react";

// Po pełnoekranowym hero użytkownik może nie wiedzieć, że jest więcej treści.
// Ten komponent (tylko strona główna) sprowadza resztę strony „do niego":
//  - przy PIERWSZYM geście przewijania (kółko / swipe / klawisze w dół) → od razu,
//  - albo SAM po chwili bezczynności (nawet jeśli user nic nie zrobi),
// płynnie przewijając do sekcji z treścią (co uruchamia animacje wyłaniania).
// Nie przeszkadza w pisaniu (czeka, gdy fokus jest w polu). Uruchamia się raz.
export default function AutoReveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.scrollY > 40) return; // użytkownik już przewinął — nic nie robimy

    let done = false;
    let idleTimer = 0;

    function bringContent() {
      if (done || window.scrollY > 40) {
        cleanup();
        return;
      }
      if (document.hidden) return; // karta w tle — nie przewijamy „na ślepo"
      done = true;
      cleanup();
      const target = document.getElementById("odkryj");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Bezczynność: sprowadź treść sama — ale jeśli ktoś pisze w polu, poczekaj.
    function scheduleIdle(ms: number) {
      idleTimer = window.setTimeout(() => {
        if (document.hidden) {
          scheduleIdle(2000); // karta w tle — poczekaj na powrót użytkownika
          return;
        }
        const ae = document.activeElement as HTMLElement | null;
        if (ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA")) {
          scheduleIdle(3500); // pisze — nie przerywamy, sprawdzimy później
          return;
        }
        bringContent();
      }, ms);
    }

    function onKey(e: KeyboardEvent) {
      if (["ArrowDown", "PageDown", "End", " ", "Spacebar"].includes(e.key)) bringContent();
    }

    function cleanup() {
      window.clearTimeout(idleTimer);
      window.removeEventListener("wheel", bringContent);
      window.removeEventListener("touchmove", bringContent);
      window.removeEventListener("keydown", onKey);
    }

    window.addEventListener("wheel", bringContent, { passive: true });
    window.addEventListener("touchmove", bringContent, { passive: true });
    window.addEventListener("keydown", onKey);
    scheduleIdle(4500);

    return cleanup;
  }, []);

  return null;
}
