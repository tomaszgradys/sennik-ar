"use client";

import { useEffect } from "react";

// Parallax tła z gwiazdami: zapisuje pozycję scrolla do zmiennej CSS `--star-y`,
// której starfield (body::before) używa do przesuwania tła DUŻO wolniej niż treść.
// rAF-throttling dla płynności; wyłączone przy „reduced motion".
export default function StarParallax() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        document.documentElement.style.setProperty("--star-y", String(window.scrollY));
        raf = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
