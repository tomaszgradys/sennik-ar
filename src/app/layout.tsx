import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";

// Self-host głównego fontu arabskiego przez next/font (pobierany przy buildzie,
// serwowany z własnej domeny) — usuwa render-blocking request do fonts.googleapis
// i preconnecty (A01 audytu, LCP). IBM Plex/Tajawal były tylko fallbackami w stacku,
// nigdzie osobno używane — zostają jako opcjonalne nazwy fallback w globals.css.
const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-noto-arabic",
  display: "swap",
});
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { SITE } from "@/lib/site";
import { T } from "@/locales/pl";
import { CATEGORIES, categoryPath } from "@/lib/categories";
import { ADS } from "@/lib/monetization";
import ThemeControls from "@/components/ThemeControls";
import NavAuth from "@/components/NavAuth";
import Twinkles from "@/components/Twinkles";
import StarParallax from "@/components/StarParallax";
import ThreeDToggle from "@/components/ThreeDToggle";
import CardSpotlight from "@/components/CardSpotlight";
import ScrollReveal from "@/components/ScrollReveal";
import AppPromoBanner from "@/components/AppPromoBanner";
import Logo from "@/components/Logo";
import MobileMenu from "@/components/MobileMenu";
import CookieConsent from "@/components/CookieConsent";
import CookieSettingsButton from "@/components/CookieSettingsButton";
import Analytics from "@/components/Analytics";
import { CONSENT_INIT_SCRIPT } from "@/lib/consent";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    // Fraza na pierwszym miejscu (jak w szablonie podstron „%s — hulm.pro"):
    // arabski użytkownik skanuje SERP pod „تفسير الأحلام", nie pod nową marką łacińską.
    default: `تفسير الأحلام أونلاين — ${SITE.name}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: SITE.locale,
    siteName: SITE.name,
    images: [{ url: "/og/default.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og/default.jpg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9dfc2" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1326" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={SITE.lang} dir={SITE.dir} data-theme="dark" className={notoArabic.variable} suppressHydrationWarning>
      <head>
        {/* خط hulm.pro: Noto Sans Arabic — self-host عبر next/font (بلا طلب خارجي). */}
        {/* Ustawia motyw i filtr światła przed pierwszym malowaniem (bez migotania). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {/* Zgoda cookies (Consent Mode v2) — PRZED skryptami Google, domyślnie denied. */}
        <script dangerouslySetInnerHTML={{ __html: CONSENT_INIT_SCRIPT }} />
        <Analytics />
        {/* AdSense (Auto Ads: vignette + kotwica) — aktywne dopiero po włączeniu flagi. */}
        {ADS.enabled && ADS.client && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS.client}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body>
        <a
          href="#content"
          className="sr-only rounded-lg bg-bg-elev px-4 py-2 text-text shadow-lg focus:not-sr-only focus:absolute focus:right-4 focus:top-4 focus:z-[100]"
        >
          انتقل إلى المحتوى
        </a>
        <div id="blue-light-filter" aria-hidden />
        <StarParallax />
        <CardSpotlight />
        <ScrollReveal />
        <Twinkles />

        <header className="sticky top-0 z-50 border-b border-border bg-bg/85 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <MobileMenu />
              <Logo />
            </div>
            <nav className="hidden items-center gap-4 text-sm lg:flex">
              <Link href="/" className="text-center text-text-muted no-underline hover:text-text">
                {T.nav.home}
              </Link>
              <Link href="/tafsir-ibn-sirin/" className="text-center text-text-muted no-underline hover:text-text">
                تفسير ابن سيرين
              </Link>
              <Link href="/blog/" className="text-center text-text-muted no-underline hover:text-text">
                المدونة
              </Link>
              <Link href="/kolory/" className="text-center text-text-muted no-underline hover:text-text">
                الألوان
              </Link>
              <Link href="/liczby/" className="text-center text-text-muted no-underline hover:text-text">
                الأرقام
              </Link>
              <Link href="/faza-ksiezyca/" className="text-center text-text-muted no-underline hover:text-text">
                {T.nav.moon}
              </Link>
            </nav>
            <div className="flex items-center gap-2 sm:gap-3">
              <NavAuth />
              {/* Przełącznik motywu w pasku tylko gdy jest miejsce (lg+); na telefonie
                  ląduje w menu hamburgerowym, żeby nie zapychać/nachodzić na logo. */}
              <div className="hidden lg:block">
                <ThemeControls />
              </div>
            </div>
          </div>
        </header>

        <main id="content" className="mx-auto max-w-5xl px-4 py-8">{children}</main>

        <footer className="mt-20">
          <div className="mx-auto max-w-5xl px-4">
            <div aria-hidden className="ornament mb-10">☾ ✦ ☽</div>

            <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
              <div className="sm:col-span-2 md:col-span-1">
                <Logo />
                <p className="mt-3 max-w-xs text-sm text-text-muted">
                  قاموس أحلام هادئ أونلاين. نبني أفضل قاعدة للأحلام، تفسيرات واضحة دافئة، بلا ترهيب.
                </p>
              </div>

              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">اكتشف</h3>
                <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm">
                  <li><Link href="/tafsir-ibn-sirin/" className="link-soft text-text-muted">تفسير الأحلام لابن سيرين</Link></li>
                  <li><Link href="/tafsir-al-nabulsi/" className="link-soft text-text-muted">تفسير الأحلام للنابلسي</Link></li>
                  <li><Link href="/anwaa-al-ahlam/" className="link-soft text-text-muted">أنواع الأحلام والرؤى</Link></li>
                  <li><Link href="/ruya-al-nabi/" className="link-soft text-text-muted">رؤية النبي في المنام</Link></li>
                  <li><Link href="/adab-al-ruya/" className="link-soft text-text-muted">آداب الرؤيا</Link></li>
                  <li><Link href="/al-kawabis/" className="link-soft text-text-muted">الكوابيس</Link></li>
                  <li><Link href="/salat-al-istikhara/" className="link-soft text-text-muted">صلاة الاستخارة والرؤيا</Link></li>
                  <li><Link href="/blog/" className="link-soft text-text-muted">المدونة</Link></li>
                  <li><Link href="/kolory/" className="link-soft text-text-muted">معاني الألوان</Link></li>
                  <li><Link href="/liczby/" className="link-soft text-text-muted">معاني الأرقام</Link></li>
                  <li><Link href="/faza-ksiezyca/" className="link-soft text-text-muted">{T.nav.moon}</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">دفتر أحلامك</h3>
                <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm">
                  <li><Link href="/moj-dziennik/" className="link-soft text-text-muted">دفتر أحلامي</Link></li>
                  <li><Link href="/moj-dziennik/?new=1" rel="nofollow" className="link-soft text-text-muted">أضف حلمك الخاص</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">الخدمة</h3>
                <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm">
                  <li><Link href="/o-nas/" className="link-soft text-text-muted">من نحن</Link></li>
                  <li><Link href="/regulamin/" className="link-soft text-text-muted">شروط الاستخدام</Link></li>
                  <li><Link href="/polityka-prywatnosci/" className="link-soft text-text-muted">سياسة الخصوصية</Link></li>
                  <li><Link href="/kontakt/" className="link-soft text-text-muted">اتصل بنا</Link></li>
                </ul>
              </div>
            </div>

            {/* أحلام حسب الفئة — محاور موضوعية متاحة من كل صفحة (عمق الزحف + موضوعية). */}
            <div className="mt-10 border-t border-border pt-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
                <Link href="/sny/" className="link-soft text-text-muted">أحلام حسب الفئة</Link>
              </h3>
              <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 text-sm">
                {CATEGORIES.map((c) => (
                  <li key={c.slug}>
                    <Link href={categoryPath(c.slug)} className="link-soft text-text-muted">{c.h1}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10 flex flex-col gap-3 border-t border-border py-6 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between">
              <p className="m-0">
                © {new Date().getFullYear()} {SITE.name} — {SITE.tagline}. {T.footer.disclaimer}
              </p>
              <div className="flex items-center gap-4">
                <ThreeDToggle />
                <CookieSettingsButton />
              </div>
            </div>
          </div>
        </footer>

        <AppPromoBanner />
        <CookieConsent />
      </body>
    </html>
  );
}
