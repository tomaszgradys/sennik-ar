"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Result {
  slug: string;
  phrase: string;
  symbol: string;
  kind: "symbol" | "combo";
}

// Podpowiedzi „wpisywane" po kolei w pustym polu — pokazują, że można napisać
// całe zdanie, i zachęcają do opowieści, nie tylko wpisania jednego słowa.
const PROMPTS = [
  "احكِ لي ماذا رأيت في منامك…",
  "حلمت أن كلبًا أسود يطاردني…",
  "كنت في الماء ومرّ بجانبي ثعبان…",
  "يمكنك كتابة جملة كاملة، سأفهمها.",
  "لا حاجة لكلمة واحدة، صف المشهد.",
  "مثال: كلب أسود، ثعبان في الماء…",
];
const PH_STATIC = "صف حلمك، يمكنك بجملة كاملة…";
const PH_FOCUS = "أنا أسمعك… احكِ ماذا رأيت في منامك";

export default function SearchBox({ autoFocus = false }: { autoFocus?: boolean }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [exact, setExact] = useState(true);
  const [mode, setMode] = useState<"exact" | "phrases" | "fuzzy">("exact");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [focused, setFocused] = useState(false);
  const [ph, setPh] = useState(PH_STATIC);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Animowany placeholder: gdy pole jest puste i nieaktywne, tekst „wpisuje się"
  // sam (i kasuje), przechodząc przez kolejne podpowiedzi — jak ktoś, kto siedzi
  // obok i podpowiada, od czego zacząć. Przy focusie zamiera na ciepłym „Słucham…".
  // Klatki wpisujemy WPROST do DOM (przez ref), żeby nie re-renderować co ~50 ms.
  const empty = q.trim() === "";
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setPh(focused ? PH_FOCUS : PH_STATIC);
      return;
    }
    if (focused) {
      setPh(PH_FOCUS);
      return;
    }
    if (!empty) return; // treść zasłania placeholder — nie ma czego animować

    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    let pi = 0; // indeks podpowiedzi
    let ci = 0; // ile znaków pokazanych
    let deleting = false;
    const caret = "▏";
    const write = (v: string) => {
      if (inputRef.current) inputRef.current.placeholder = v;
    };

    function tick() {
      if (!alive) return;
      const full = PROMPTS[pi];
      if (!deleting) {
        ci++;
        write(full.slice(0, ci) + (ci < full.length ? caret : ""));
        if (ci >= full.length) {
          deleting = true;
          timer = setTimeout(tick, 1900); // pauza na przeczytanie
          return;
        }
        timer = setTimeout(tick, 52 + Math.random() * 46);
      } else {
        ci--;
        write(full.slice(0, ci) + caret);
        if (ci <= 0) {
          deleting = false;
          pi = (pi + 1) % PROMPTS.length;
          timer = setTimeout(tick, 420);
          return;
        }
        timer = setTimeout(tick, 26);
      }
    }
    timer = setTimeout(tick, 700);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [focused, empty]);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        });
        const data = await res.json();
        setResults(data.results ?? []);
        setExact(data.exact !== false);
        setMode(data.mode === "phrases" ? "phrases" : data.exact !== false ? "exact" : "fuzzy");
        setActive(0);
        setOpen(true);
      } catch {
        /* przerwane zapytanie — ignorujemy */
      }
    }, 160);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(slug: string) {
    setOpen(false);
    router.push(`/sen/${slug}/`);
  }

  function onKey(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active].slug);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className="relative w-full">
      <input
        ref={inputRef}
        type="search"
        value={q}
        maxLength={200}
        autoFocus={autoFocus}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => {
          setFocused(true);
          if (results.length) setOpen(true);
        }}
        onBlur={() => setFocused(false)}
        onKeyDown={onKey}
        placeholder={ph}
        aria-label="ابحث عن حلم"
        className={`search-invite w-full rounded-xl border border-border bg-bg-elev px-4 py-2.5 text-[0.95rem] text-text outline-none placeholder:text-text-muted sm:py-3 sm:text-base ${
          q ? "is-filled" : ""
        }`}
      />
      {open && results.length > 0 && (
        <ul className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-border bg-bg-elev shadow-lg">
          {mode === "phrases" ? (
            <li className="border-b border-border bg-bg-soft px-4 py-2 text-xs text-text-muted">
              تعرّفنا في حلمك على هذه المصطلحات، اختر لتعرف المعنى:
            </li>
          ) : (
            !exact && (
              <li className="border-b border-border bg-bg-soft px-4 py-2 text-xs text-text-muted">
                لا نملك «{q.trim()}» تحديدًا. ربما تقصد هذا أو جرّب شيئًا مثيرًا:
              </li>
            )
          )}
          {results.map((r, i) => (
            <li key={r.slug}>
              <button
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r.slug)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left ${
                  i === active ? "bg-accent-soft" : ""
                }`}
              >
                <span className="text-text">{r.phrase}</span>
                <span className="text-xs text-text-muted">
                  {r.kind === "symbol" ? "رمز" : r.symbol}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
