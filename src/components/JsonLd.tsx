// Wstawia dane strukturalne schema.org (JSON-LD). Pomaga Google zrozumieć stronę
// i zwiększa szansę na rich results / miniaturkę.
//
// Bezpieczeństwo: JSON.stringify NIE escapuje „<", więc wartość zawierająca
// „</script>" mogłaby zamknąć tag i wyjść z kontekstu skryptu (XSS). Escapujemy
// „<", „>", „&" oraz separatory linii U+2028/U+2029 na sekwencje \uXXXX — treść
// pozostaje poprawnym JSON-em, ale nie może już złamać parsera HTML.
const UNSAFE = /[<>&\u2028\u2029]/g;

function escapeChar(ch: string): string {
  return "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0");
}

function safeJsonLd(data: object): string {
  return JSON.stringify(data).replace(UNSAFE, escapeChar);
}

export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}
