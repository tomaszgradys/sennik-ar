import type { NextConfig } from "next";

// Content-Security-Policy — warstwa obrony przed wstrzyknięciem obcego skryptu.
// Serwis ma DWA skrypty inline w <head> (motyw + Consent Mode v2) oraz — po
// włączeniu — GA/AdSense, dlatego script-src musi dopuszczać 'unsafe-inline' i
// domeny Google. Mimo 'unsafe-inline' polityka realnie ogranicza: object-src
// 'none' (brak wtyczek), base-uri/form-action 'self' (brak porwania <base>/POST),
// a script-src ogranicza ŹRÓDŁA skryptów do własnej domeny + infrastruktury
// reklamowo-analitycznej Google (blokuje ładowanie evil.com nawet przy udanym
// HTML injection). GA i AdSense są domyślnie WYŁĄCZONE, więc na produkcji nic z
// tej listy się teraz nie ładuje — whitelist jest gotowa na późniejsze włączenie.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.googleadservices.com https://*.google.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://pagead2.googlesyndication.com https://*.googlesyndication.com",
  "frame-src https://*.google.com https://googleads.g.doubleclick.net https://*.googlesyndication.com",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Izolacja kontekstu przeglądarki (ochrona przed nadużyciem window.opener /
  // cross-window). Brak OAuth/popupów logowania, więc nic to nie psuje.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  // URL z ukośnikiem na końcu (/sen/kot/) — zgodnie z master-CSV.
  trailingSlash: true,
  // Treść (pliki per rodzic) dołączana do funkcji trasy hasła — czytana fs-em.
  outputFileTracingIncludes: {
    "/hulm/[slug]": ["./src/data/content/**/*.json"],
    "/blog/[slug]": ["./src/data/blog/**/*.json"],
  },
  async headers() {
    // Statyczne obrazki/fonty są NIEZMIENNE (nazwy = slug symbolu, nie zmieniają
    // się między deployami). Domyślnie Next serwuje public/ z
    // „max-age=0, must-revalidate", przez co Googlebot rewaliduje ~12k plików przy
    // KAŻDEJ wizycie i przepala crawl budget na obrazki zamiast na treść (w GSC:
    // 97% „inny typ pliku", 98,5% „odświeżenie"). Długi immutable cache to zdejmuje.
    // Regeneracja obrazka idzie z nowym deployem → Vercel czyści swój CDN, więc
    // stały cache jest bezpieczny na krawędzi (ew. stary obraz tylko u wracających
    // przeglądarek do wygaśnięcia).
    const assetDirs = [
      "dreams",
      "hero",
      "thumbs",
      "og",
      "moon",
      "stars",
      "brand",
      "blog-img",
      "ui",
      "fonts",
    ];
    const immutable = {
      key: "Cache-Control",
      value: "public, max-age=31536000, immutable",
    };
    return [
      ...assetDirs.map((dir) => ({
        source: `/${dir}/:path*`,
        headers: [immutable],
      })),
      { source: "/:path*", headers: securityHeaders },
    ];
  },
  async redirects() {
    // UWAGA: kanonizacja hosta (www→apex), migracja prefiksów tras PL→AR
    // (/sen/, /sny/, /kolory/, /liczby/, /faza-ksiezyca/, /sennik/) oraz stare
    // pojedyncze strony (/o-nas, /horoskop, ...) są obsłużone w src/middleware.ts —
    // w JEDNYM skoku 308. redirects() z next.config wykonują się PRZED middleware,
    // więc trzymanie ich tutaj przechwytywało żądanie i wymuszało łańcuch 3–4 × 308.
    // Zostają tylko warianty z myślnikiem / :znak, których middleware nie pokrywa
    // (niski wolumen, i tak jeden skok dzięki końcowemu ukośnikowi w destination).
    return [
      { source: "/sen-:slug", destination: "/hulm/:slug/", permanent: true },
      // Horoskop usunięty (التنجيم nie pasuje kulturowo do wersji AR).
      { source: "/horoskop/:znak", destination: "/", permanent: true },
      { source: "/horoskop-:znak", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
