"use client";

import { useEffect } from "react";

// „Fala zachęty" na stronie głównej: co jakiś czas przez jedną z grup kafelków
// (popularne sny, zajawki bloga, „اكتشف") przelatuje delikatna fala — kolejne
// kafelki unoszą się po kolei z magicznym blaskiem, potem falę bierze następna
// grupa. Subtelne, ale widoczne; działa w obu motywach (CSS: .card.wave-lift).
// Grupy oznaczone są atrybutem [data-wave]. Efekt czysto dekoracyjny — klasa
// znika sama, nic nie zostaje w DOM po odmontowaniu.
export default function CardWave() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const groups = Array.from(document.querySelectorAll<HTMLElement>("[data-wave]"));
    if (!groups.length) return;

    const STAGGER = 260; // odstęp startu między kolejnymi kafelkami (wolniejsza fala)
    const HOLD = 620; // jak długo kafelek pozostaje uniesiony
    const GAP = 3200; // przerwa między falami (częstszy rytm)

    let gi = 0;
    let timers: number[] = [];
    let loopTimer = 0;
    let cancelled = false;

    function pickGroup(): HTMLElement {
      // Preferuj grupę widoczną w viewporcie; jeśli żadnej — bierz następną z rzędu.
      for (let t = 0; t < groups.length; t++) {
        const g = groups[(gi + t) % groups.length];
        const r = g.getBoundingClientRect();
        const visible = r.top < window.innerHeight - 60 && r.bottom > 60;
        if (visible && g.querySelector(".card")) {
          gi = (gi + t + 1) % groups.length;
          return g;
        }
      }
      const g = groups[gi % groups.length];
      gi = (gi + 1) % groups.length;
      return g;
    }

    function runWave() {
      if (cancelled) return;
      timers = [];
      const cards = Array.from(pickGroup().querySelectorAll<HTMLElement>(".card"));

      let last = 0;
      cards.forEach((card, i) => {
        const start = i * STAGGER;
        timers.push(window.setTimeout(() => card.classList.add("wave-lift"), start));
        timers.push(window.setTimeout(() => card.classList.remove("wave-lift"), start + HOLD));
        last = start + HOLD;
      });

      loopTimer = window.setTimeout(runWave, last + GAP);
    }

    // Nie od razu przy wejściu — daj stronie odetchnąć, potem pierwsza fala.
    loopTimer = window.setTimeout(runWave, 2000);

    return () => {
      cancelled = true;
      clearTimeout(loopTimer);
      timers.forEach(clearTimeout);
      document
        .querySelectorAll(".wave-lift")
        .forEach((el) => el.classList.remove("wave-lift"));
    };
  }, []);

  return null;
}
