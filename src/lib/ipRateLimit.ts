// Lekki limiter w pamięci procesu (per klucz, np. IP) — do GORĄCYCH ścieżek jak
// wyszukiwarka, gdzie zapis do bazy na każde żądanie byłby sam w sobie kosztowny.
// W serverless pamięć nie jest współdzielona między instancjami, ale każda
// instancja i tak dławi pojedynczego napastnika (flood zwykle trafia w jedną
// ciepłą instancję), więc skutecznie ucina zalanie serwera zapytaniami.

type Bucket = { count: number; reset: number };

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

// Zwraca true, gdy limit PRZEKROCZONY (żądanie należy odrzucić),
// false, gdy mieści się w oknie.
export function overLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();

  // Okresowe sprzątanie wygasłych kubełków — chroni pamięć przy wielu różnych IP.
  if (now - lastSweep > 60_000) {
    for (const [k, b] of buckets) if (b.reset <= now) buckets.delete(k);
    lastSweep = now;
  }

  const b = buckets.get(key);
  if (!b || b.reset <= now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return false;
  }
  b.count++;
  return b.count > max;
}

// Wyciąga IP klienta z nagłówków proxy (Vercel ustawia x-forwarded-for).
export function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}
