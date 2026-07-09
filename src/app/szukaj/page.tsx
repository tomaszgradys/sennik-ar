import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import SearchBox from "@/components/SearchBox";
import SearchResultsInline from "@/components/SearchResultsInline";

// Dedykowana strona wyszukiwania — cel dla SearchAction/Sitelinks Searchbox (A01).
// Wyniki nie są indeksowane (noindex), ale strona jest dostępna dla użytkowników i Google.
export const metadata: Metadata = {
  title: { absolute: `البحث في تفسير الأحلام — ${SITE.name}` },
  description: "ابحث عن تفسير حلمك في hulm.pro: اكتب رمزًا أو صف حلمك بجملة كاملة.",
  robots: { index: false, follow: true },
  alternates: { canonical: `${SITE.url}/szukaj/` },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-text sm:text-3xl">البحث في تفسير الأحلام</h1>
        <p className="mt-2 text-text-muted">اكتب رمزًا أو صف حلمك بجملة كاملة، وسنعرض أقرب التفسيرات.</p>
      </header>

      <SearchBox autoFocus />

      {query && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-text-muted">نتائج «{query}»</h2>
          <SearchResultsInline query={query} />
        </section>
      )}
    </div>
  );
}
