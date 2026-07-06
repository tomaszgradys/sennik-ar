// Centralna konfiguracja serwisu — per język/domena. Klon zagraniczny = kopia
// tego obiektu (i src/locales/<lang>.ts) z innym url/locale, reszta bez zmian.
// URL bierzemy ze zmiennej środowiskowej: po podpięciu sennik.tv w Vercel
// ustawić NEXT_PUBLIC_SITE_URL=https://sennik.tv (bez zmian w kodzie).
export const SITE = {
  name: "معنى الحلم",
  domain: "",
  tagline: "تفسير الأحلام أونلاين",
  description:
    "تفسير الأحلام أونلاين: اعرف معنى حلمك. آلاف الرموز والتركيبات، تفسير واحد واضح، قراءة مريحة نهارًا وليلًا.",
  // الترتيب: متغير صريح -> رابط Vercel الإنتاجي (تلقائي) -> localhost.
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
  locale: "ar",
  lang: "ar",
  dir: "rtl" as const,
};

// Dane prawne operatora. TYMCZASOWO dane Profivo (z profivo.pl) — do zmiany na
// osobny podmiot sennik.tv, gdy powstanie. To jedyne miejsce z tymi danymi.
export const LEGAL = {
  operator: "Profivo",
  operatorForm:
    "spółka wpisana do rejestru przedsiębiorców KRS pod nr 0001181942, REGON 542154491",
  address: "ul. Paprotna 8B/14, 51-117 Wrocław",
  nip: "9151835807",
  email: "kontakt@profivo.pl",
  // Data ostatniej aktualizacji dokumentów prawnych:
  lastUpdated: "2026-07-03",
};
