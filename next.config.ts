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
    "/sen/[slug]": ["./src/data/content/**/*.json"],
    "/blog/[slug]": ["./src/data/blog/**/*.json"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      // Kanonizacja hosta: www -> apex (308 permanent, SEO-równoważny 301).
      // Wcześniej www.hulm.pro serwował 200 (duplikat rozwiązywany tylko canonicalem);
      // teraz twardy redirect na jedną wersję domeny.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.hulm.pro" }],
        destination: "https://hulm.pro/:path*",
        permanent: true,
      },
      // Stare schematy URL -> nowa struktura /sen/<slug>/ (301, SEO-safe).
      { source: "/sennik/:slug", destination: "/sen/:slug/", permanent: true },
      { source: "/sen-:slug", destination: "/sen/:slug/", permanent: true },
      // Horoskop usunięty (التنجيم nie pasuje kulturowo do wersji AR).
      // Stare, zaindeksowane URL-e -> strona główna (301), by nie generować 404.
      { source: "/horoskop", destination: "/", permanent: true },
      { source: "/horoskop/:znak", destination: "/", permanent: true },
      { source: "/horoskop-:znak", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
