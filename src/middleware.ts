import { NextRequest, NextResponse } from "next/server";

// Kanonizacja URL w JEDNYM skoku (308) — zamiast łańcucha przekierowań.
//
// Kontekst: wersja AR wystartowała ze starymi, polskimi segmentami URL (/sen/,
// /liczby/, ...) oraz duplikatem hosta www. Redirecty w next.config.ts działają,
// ale każde z osobna: stary link www.hulm.pro/sen/x/ przechodził aż przez cztery
// 308 (www→apex, +/, sen→hulm, +/) zanim trafiał na 200. Łańcuchy rozmywają
// PageRank, marnują budżet indeksowania i część botów rezygnuje po kilku skokach —
// a właśnie te stare URL-e są teraz masowo re-crawlowane przez Google (913×/sen/,
// 37×/liczby/ w indeksie). Middleware liczy końcowy URL kanoniczny od razu i robi
// pojedynczy 308 → konsolidacja indeksu przyspiesza.
//
// Zakres: tylko realne strony HTML (matcher wyklucza _next, api, pliki z kropką).
// Pliki (sitemap.xml, robots.txt, ads.txt) i host dla nich obsługuje nadal
// next.config.ts — bez konfliktu, bo middleware ich nie dotyka.

const CANONICAL_HOST = "hulm.pro";
const WWW_HOST = "www.hulm.pro";

// Stare prefiksy kategorii (polskie/przejściowe) -> zlokalizowane arabskie.
// Kolejność bez znaczenia (prefiksy rozłączne). Zachowujemy resztę ścieżki 1:1,
// w tym końcowy ukośnik, więc /sen/x/ -> /hulm/x/ jednym podstawieniem.
const PREFIX_MAP: Array<[string, string]> = [
  ["/sen/", "/hulm/"],
  ["/sennik/", "/hulm/"],
  ["/sny/", "/ahlam/"],
  ["/kolory/", "/alwan/"],
  ["/liczby/", "/arqam/"],
  ["/faza-ksiezyca/", "/atwar-al-qamar/"],
];

// Pojedyncze stare strony (bez końcowego ukośnika jako klucz).
const PAGE_MAP: Record<string, string> = {
  "/o-nas": "/man-nahnu/",
  "/kontakt": "/ittisal/",
  "/regulamin": "/shurut-al-istikhdam/",
  "/polityka-prywatnosci": "/siyasat-al-khususiya/",
  "/szukaj": "/bahth/",
  "/horoskop": "/", // sekcja usunięta kulturowo — stare URL-e na stronę główną.
};

function canonicalPath(pathname: string): string {
  // 1) Remap prefiksu kategorii.
  for (const [from, to] of PREFIX_MAP) {
    if (pathname.startsWith(from)) {
      pathname = to + pathname.slice(from.length);
      break;
    }
  }

  // 2) Remap pojedynczej strony (po zdjęciu końcowego ukośnika).
  const bare = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  if (PAGE_MAP[bare]) {
    return PAGE_MAP[bare];
  }

  // 3) Wymuś końcowy ukośnik (spójne z trailingSlash: true w next.config.ts).
  if (pathname !== "/" && !pathname.endsWith("/")) {
    pathname += "/";
  }
  return pathname;
}

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const isWww = host === WWW_HOST;
  const currentPath = req.nextUrl.pathname;
  const newPath = canonicalPath(currentPath);

  // Nic do zmiany (host już apex, ścieżka już kanoniczna) — przepuść.
  if (!isWww && newPath === currentPath) {
    return NextResponse.next();
  }

  const target = new URL(req.nextUrl.toString());
  target.pathname = newPath;
  if (isWww) target.host = CANONICAL_HOST;

  return NextResponse.redirect(target, 308);
}

export const config = {
  // Wyklucz zasoby wewnętrzne, API i pliki (ścieżki z kropką: .xml/.txt/.png/...).
  matcher: ["/((?!_next/|api/|.*\\.).*)"],
};
