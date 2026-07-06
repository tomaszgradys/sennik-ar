import Script from "next/script";

// Google Analytics 4 — ładuje się TYLKO gdy ustawiona zmienna NEXT_PUBLIC_GA_ID.
// Zgodą steruje Consent Mode v2 (domyślnie denied), więc GA respektuje wybór z
// banera cookies. Do włączenia: dodać NEXT_PUBLIC_GA_ID=G-XXXX w Vercel.
export default function Analytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID;
  if (!id) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`gtag('js', new Date()); gtag('config', '${id}');`}
      </Script>
    </>
  );
}
