"use client";

import { useEffect } from "react";

// Wyłanianie sekcji przy przewijaniu (klasy .reveal → .reveal-in). Kuloodporne:
// na każdej klatce scrolla odsłaniamy KAŻDĄ sekcję, której górna krawędź weszła
// (lub minęła) dół ekranu — więc nie może powstać „martwa strefa" pustego ekranu.
// `html.js` dodajemy tu, żeby bez JS / dla botów bez renderu treść była widoczna (SEO).
// Bezpiecznik: po chwili odsłaniamy wszystko (zero ukrytej treści).
export default function ScrollReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    if (els.length === 0) return;

    document.documentElement.classList.add("js");
    let raf = 0;

    const revealAll = () => els.forEach((el) => el.classList.add("reveal-in"));
    const revealInView = () => {
      raf = 0;
      const vh = window.innerHeight;
      for (const el of els) {
        if (el.classList.contains("reveal-in")) continue;
        // top < vh → sekcja zaczęła wchodzić w kadr (lub już jest wyżej). Odsłaniamy.
        if (el.getBoundingClientRect().top < vh) el.classList.add("reveal-in");
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(revealInView);
    };

    // POWRÓT NA STRONĘ po uśpieniu karty (przełączenie karty, minimalizacja,
    // bfcache/„wstecz", odzysk fokusu): rAF i timery bywają zamrożone, a zdarzenie
    // scroll już nie strzeli — to właśnie wtedy trafiała się PUSTKA. Dlatego przy
    // każdym powrocie odsłaniamy WSZYSTKO od razu (efekt wjazdu i tak był na wejściu).
    const onVisible = () => {
      if (!document.hidden) revealAll();
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) revealAll(); // przywrócone z bfcache
    };

    revealInView(); // odsłoń to, co już widoczne na starcie
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onPageShow);

    // Bezpiecznik: nic nie może zostać trwale ukryte (np. paused rAF / bot bez scrolla).
    const fallback = window.setTimeout(revealAll, 2500);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onPageShow);
      window.clearTimeout(fallback);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
