import { ADS } from "@/lib/monetization";

export const runtime = "nodejs";
export const dynamic = "force-static";

// ads.txt — autoryzacja sprzedawcy dla AdSense/Ad Manager. Google wymaga tego pliku,
// żeby uznać wyświetlenia za autoryzowane (bez niego część zapytań reklamowych jest
// filtrowana → utrata przychodu). Generujemy z `NEXT_PUBLIC_ADSENSE_CLIENT`
// (np. "ca-pub-123..." → wpis "pub-123..."). Gdy brak klienta — plik pusty
// (nie serwujemy błędnego wpisu przed założeniem konta).
export function GET() {
  const client = ADS.client.replace(/^ca-/, "").trim(); // "ca-pub-…" → "pub-…"
  const body =
    client && /^pub-\d+$/.test(client)
      ? `google.com, ${client}, DIRECT, f08c47fec0942fa0\n`
      : "";
  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      // Odświeżanie: raz na dobę wystarczy (rzadka zmiana).
      "cache-control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
