// Lekki wrapper na zdarzenia analityki (GA4 przez gtag). No-op, gdy GA nie
// skonfigurowane (`NEXT_PUBLIC_GA_ID` puste) — bezpieczne do wywołania zawsze.
// Zasada prywatności: wysyłamy TYLKO bezpieczne parametry (slug, lokalizacja CTA,
// tryb) — NIGDY treści snu, e-maila ani opisu użytkownika.
export function track(event: string, params: Record<string, unknown> = {}): void {
  try {
    (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag?.("event", event, params);
  } catch {
    /* brak GA — ignorujemy */
  }
}
