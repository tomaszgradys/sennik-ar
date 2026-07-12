import { NextRequest, NextResponse } from "next/server";

// Kanonizacja URL w JEDNYM skoku (308) — zamiast łańcucha przekierowań.
//
// Kontekst: wersja AR wystartowała ze starymi, polskimi segmentami URL (/sen/,
// /liczby/, ...) oraz duplikatem hosta www. Wcześniej robiły to redirecty w
// next.config.ts, ale KAŻDY z osobna i redirects() w Next wykonują się PRZED
// middleware — stary link www.hulm.pro/sen/x/ przechodził przez cztery 308
// (www→apex, +/, sen→hulm, +/) zanim trafiał na 200. Łańcuchy rozmywają
// PageRank, marnują budżet indeksowania i część botów rezygnuje po kilku skokach —
// a właśnie te stare URL-e są teraz masowo re-crawlowane przez Google (913×/sen/,
// 37×/liczby/ w indeksie).
//
// Dlatego CAŁĄ kanonizację (host + prefiks + trailing slash) robimy tu, w jednym
// przebiegu i jednym 308. Odpowiadające redirecty usunięto z next.config.ts, żeby
// nie przechwytywały żądania przed middleware.

const CANONICAL_HOST = "hulm.pro";
const WWW_HOST = "www.hulm.pro";

// Stare prefiksy kategorii (polskie/przejściowe) -> zlokalizowane arabskie.
// Zachowujemy resztę ścieżki 1:1 (w tym końcowy ukośnik): /sen/x/ -> /hulm/x/.
const PREFIX_MAP: Array<[string, string]> = [
  ["/sen/", "/hulm/"],
  ["/sennik/", "/hulm/"],
  ["/sny/", "/ahlam/"],
  ["/kolory/", "/alwan/"],
  ["/liczby/", "/arqam/"],
  ["/faza-ksiezyca/", "/atwar-al-qamar/"],
];

// Pojedyncze stare strony (klucz bez końcowego ukośnika).
const PAGE_MAP: Record<string, string> = {
  "/o-nas": "/man-nahnu/",
  "/kontakt": "/ittisal/",
  "/regulamin": "/shurut-al-istikhdam/",
  "/polityka-prywatnosci": "/siyasat-al-khususiya/",
  "/szukaj": "/bahth/",
  "/horoskop": "/", // sekcja usunięta kulturowo — stare URL-e na stronę główną.
};

// Czy ostatni segment wygląda na plik (np. sitemap.xml, og.png) — wtedy nie
// dokładamy końcowego ukośnika, ale host i tak kanonizujemy.
function isFile(pathname: string): boolean {
  const last = pathname.split("/").pop() ?? "";
  return last.includes(".");
}

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

  // 3) Wymuś końcowy ukośnik (spójne z trailingSlash: true), pomijając pliki.
  if (pathname !== "/" && !pathname.endsWith("/") && !isFile(pathname)) {
    pathname += "/";
  }
  return pathname;
}

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const isWww = host === WWW_HOST;
  const currentPath = req.nextUrl.pathname;
  const newPath = canonicalPath(currentPath);

  // Nic do zmiany — przepuść bez redirectu.
  if (!isWww && newPath === currentPath) {
    return NextResponse.next();
  }

  const target = new URL(req.nextUrl.toString());
  target.pathname = newPath;
  if (isWww) target.host = CANONICAL_HOST;

  return NextResponse.redirect(target, 308);
}

export const config = {
  // Pomijamy tylko zasoby wewnętrzne i API — resztę (w tym pliki jak sitemap.xml)
  // przepuszczamy przez middleware, by kanonizować host jednym skokiem.
  matcher: ["/((?!_next/|api/).*)"],
};
