import indexData from "@/data/blog/_index.json";

// Przegląd bloga dla panelu. Tematy NIE są planowane z góry — auto-blog dobiera je
// dynamicznie pod sezon i trendy przy każdej publikacji (patrz scripts/blog.mjs).
// Dlatego pokazujemy stan faktyczny (opublikowane), a nie projekcję kolejki.

interface PublishedMeta {
  slug: string;
  title: string;
  category: string;
  date: string;
}

export interface BlogOverview {
  publishedCount: number;
  recent: PublishedMeta[];
}

export function blogOverview(): BlogOverview {
  const idx = (indexData as PublishedMeta[]).slice().sort((a, b) => (a.date < b.date ? 1 : -1));
  return { publishedCount: idx.length, recent: idx.slice(0, 8) };
}
