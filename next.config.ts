import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
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
