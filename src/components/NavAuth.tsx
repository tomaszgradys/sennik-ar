"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { T } from "@/locales/pl";

interface Me {
  name?: string | null;
  email?: string;
  avatar?: string | null;
}

// Stan logowania w nawigacji: awatar + menu konta (zalogowany) albo
// „Zaloguj / Załóż konto" (niezalogowany). Nie blokuje renderu strony.
export default function NavAuth() {
  const [user, setUser] = useState<Me | null | undefined>(undefined); // undefined = ładowanie
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me/")
      .then((r) => r.json())
      .then((d) => setUser(d.user ?? null))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout/", { method: "POST" });
    window.location.href = "/";
  }

  // Placeholder o stałym rozmiarze — bez migotania układu w trakcie ładowania.
  if (user === undefined) return <div className="h-9 w-9" aria-hidden />;

  if (!user) {
    return (
      <Link
        href="/moj-dziennik/"
        className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-text no-underline transition-colors hover:border-accent hover:text-accent"
      >
        {T.nav.login}
      </Link>
    );
  }

  const initial = (user.name?.trim()?.[0] ?? user.email?.[0] ?? "?").toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={T.nav.accountMenu}
        aria-expanded={open}
        className="nav-avatar flex h-9 w-9 items-center justify-center text-sm"
      >
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- awatar Google, zewnętrzny URL
          <img src={user.avatar} alt="" width={32} height={32} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          initial
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-bg-elev shadow-lg">
          <div className="truncate border-b border-border px-4 py-2 text-xs text-text-muted">
            {user.name || user.email}
          </div>
          <Link href="/moj-dziennik/" className="block px-4 py-2.5 text-sm text-text no-underline hover:bg-bg-soft">
            {T.nav.myJournal}
          </Link>
          <button onClick={logout} className="block w-full px-4 py-2.5 text-left text-sm text-text-muted hover:bg-bg-soft">
            {T.nav.logout}
          </button>
        </div>
      )}
    </div>
  );
}
