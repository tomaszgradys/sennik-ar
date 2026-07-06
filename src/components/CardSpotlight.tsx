"use client";

import { useEffect } from "react";

// Efekt „spotlight na ramce": obwódka karty (.card) rozświetla się przy kursorze.
// Globalny listener (delegacja) ustawia --mx/--my na najeżdżanej karcie; CSS w
// globals.css robić resztę (maskowany pierścień gradientu). rAF dla płynności.
export default function CardSpotlight() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover)").matches) return; // tylko z kursorem
    let raf = 0;
    let card: HTMLElement | null = null;
    let x = 0;
    let y = 0;

    function onMove(e: PointerEvent) {
      const el = (e.target as Element | null)?.closest?.(".card") as HTMLElement | null;
      if (!el) return;
      card = el;
      x = e.clientX;
      y = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        if (card) {
          const r = card.getBoundingClientRect();
          card.style.setProperty("--mx", `${x - r.left}px`);
          card.style.setProperty("--my", `${y - r.top}px`);
        }
        raf = 0;
      });
    }

    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
