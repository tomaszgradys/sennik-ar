"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ThemeControls from "@/components/ThemeControls";

// Mobilna nawigacja (hamburger po lewej od loga, tylko < lg).
// Rozwija panel pod nagłówkiem; zamyka się po kliknięciu linku,
// klawiszem Escape i po kliknięciu poza panelem. Zawiera też przełącznik motywu
// (na telefonie nie mieści się w pasku).
const LINKS = [
  { href: "/", label: "تفسير الأحلام" },
  { href: "/tafsir-ibn-sirin/", label: "تفسير ابن سيرين" },
  { href: "/tafsir-al-nabulsi/", label: "تفسير النابلسي" },
  { href: "/anwaa-al-ahlam/", label: "أنواع الأحلام" },
  { href: "/ruya-al-nabi/", label: "رؤية النبي في المنام" },
  { href: "/ruya-fi-alquran/", label: "الرؤيا في القرآن" },
  { href: "/blog/", label: "المدونة" },
  { href: "/alwan/", label: "الألوان" },
  { href: "/arqam/", label: "الأرقام" },
  { href: "/atwar-al-qamar/", label: "طور القمر" },
];

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    // pointerdown (nie click): nie łapie kliknięcia, które właśnie otworzyło menu.
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="lg:hidden">
      <button
        type="button"
        aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-lg border border-border bg-bg-soft"
      >
        <span
          aria-hidden
          className={`h-[2px] rounded-full bg-text transition-transform ${open ? "translate-y-[7px] rotate-45" : ""}`}
          style={{ width: 18 }}
        />
        <span
          aria-hidden
          className={`h-[2px] rounded-full bg-text transition-opacity ${open ? "opacity-0" : ""}`}
          style={{ width: 18 }}
        />
        <span
          aria-hidden
          className={`h-[2px] rounded-full bg-text transition-transform ${open ? "-translate-y-[7px] -rotate-45" : ""}`}
          style={{ width: 18 }}
        />
      </button>

      {open && (
        <nav
          id="mobile-nav"
          className="absolute inset-x-0 top-full border-b border-border bg-bg/95 shadow-lg backdrop-blur"
        >
          <div className="mx-auto flex max-w-5xl flex-col px-4 py-2">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-b border-border/60 py-3 text-base text-text no-underline hover:text-accent"
              >
                {l.label}
              </Link>
            ))}
            <div className="flex items-center justify-between gap-3 py-3">
              <span className="text-sm text-text-muted">المظهر</span>
              <ThemeControls />
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
