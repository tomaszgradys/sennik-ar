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
  locale: "ar",
  lang: "ar",
  dir: "rtl" as const,
};

// بيانات مشغّل الموقع القانونية. مؤقتًا محايدة (بلا كيان قانوني بعدُ لـ hulm.pro).
// عند تسجيل الكيان: املأ operator/operatorForm/address/taxId ببياناته الحقيقية.
// هذا المكان الوحيد لهذه البيانات. ملاحظة: لا تُستخدم بيانات شركة أجنبية (بولندية) هنا.
export const LEGAL = {
  operator: "hulm.pro",
  operatorForm: "", // مثال: «شركة مسجّلة برقم …» — يُملأ عند وجود كيان قانوني
  address: "", // العنوان الرسمي — يُملأ لاحقًا
  taxId: "", // الرقم الضريبي — يُملأ لاحقًا
  email: "contact@hulm.pro",
  // تاريخ آخر تحديث للوثائق القانونية:
  lastUpdated: "2026-07-07",
};
