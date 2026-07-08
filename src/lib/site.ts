// Centralna konfiguracja serwisu — per język/domena. Klon zagraniczny = kopia
// tego obiektu (i src/locales/<lang>.ts) z innym url/locale, reszta bez zmian.
// URL bierzemy ze zmiennej środowiskowej: po podpięciu sennik.tv w Vercel
// ustawić NEXT_PUBLIC_SITE_URL=https://sennik.tv (bez zmian w kodzie).
export const SITE = {
  name: "hulm.pro",
  domain: "hulm.pro",
  tagline: "قاموس أحلام هادئ وواضح",
  description:
    "تفسير الأحلام أونلاين على hulm.pro: اعرف معنى حلمك. آلاف الرموز والتركيبات، قراءة واضحة ومطمئنة بلا ترهيب، نهارًا وليلًا.",
  // الترتيب: متغير صريح -> رابط Vercel الإنتاجي (تلقائي) -> localhost.
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
  locale: "ar_AR",
  lang: "ar",
  dir: "rtl" as const,
};

// بيانات مشغّل الموقع القانونية. المشغّل الفعلي هو شركة Profivo (بولندا، الاتحاد الأوروبي).
// بما أن المشغّل مؤسّس في الاتحاد الأوروبي فإن اللائحة العامة لحماية البيانات (GDPR/RODO)
// تنطبق عليه كمتحكّم في البيانات. هذا المكان الوحيد لهذه البيانات.
export const LEGAL = {
  operator: "Profivo",
  operatorForm:
    "شركة مسجّلة في السجل التجاري البولندي (KRS) برقم 0001181942، REGON 542154491",
  address: "ul. Paprotna 8B/14, 51-117 Wrocław, بولندا (الاتحاد الأوروبي)",
  taxId: "NIP 9151835807",
  email: "kontakt@profivo.pl",
  // تاريخ آخر تحديث للوثائق القانونية:
  lastUpdated: "2026-07-07",
};
