// Wstawia dane strukturalne schema.org (JSON-LD). Pomaga Google zrozumieć stronę
// i zwiększa szansę na rich results / miniaturkę.
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
