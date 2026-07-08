import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CATEGORIES,
  CATEGORY_BY_SLUG,
  categoryPath,
  categorySlugs,
  symbolsInCategory,
} from "@/lib/categories";
import { dreamPath } from "@/lib/dream";
import { listCustomDreams } from "@/lib/custom";
import { capitalize, decodeSlug } from "@/lib/polish";
import { SITE } from "@/lib/site";
import { T } from "@/locales/pl";
import JsonLd from "@/components/JsonLd";

export const revalidate = 86400;
// true: Next 16 لا يطابق المسارات العربية المُرمَّزة (%) مع بارامترات ما قبل التوليد؛
// السماح بالتوليد الديناميكي يجعل صفحات الفئات العربية تعمل (12 فئة فقط).
export const dynamicParams = true;

export function generateStaticParams() {
  return categorySlugs().map((kategoria) => ({ kategoria }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ kategoria: string }>;
}): Promise<Metadata> {
  const { kategoria: rawKat } = await params;
  const kategoria = decodeSlug(rawKat);
  const cat = CATEGORY_BY_SLUG.get(kategoria);
  if (!cat) return { title: "لم يتم العثور على هذه الفئة" };
  const url = `${SITE.url}${categoryPath(cat.slug)}`;
  return {
    title: { absolute: `${cat.title} — ${SITE.name}` },
    description: cat.description,
    alternates: { canonical: url },
    openGraph: { title: cat.title, description: cat.description, url },
  };
}

export default async function CategoryHub({
  params,
}: {
  params: Promise<{ kategoria: string }>;
}) {
  const { kategoria: rawKat } = await params;
  const kategoria = decodeSlug(rawKat);
  const cat = CATEGORY_BY_SLUG.get(kategoria);
  if (!cat) notFound();

  const url = `${SITE.url}${categoryPath(cat.slug)}`;
  const others = CATEGORIES.filter((c) => c.slug !== cat.slug);

  // Symbole z katalogu + sny z panelu tej kategorii (żeby te drugie nie były osierocone).
  const catalogSymbols = symbolsInCategory(cat.name).map((s) => ({ slug: s.slug, phrase: s.phrase }));
  const custom = (await listCustomDreams())
    .filter((c) => c.category === cat.name)
    .map((c) => ({ slug: c.slug, phrase: c.phrase }));
  const seen = new Set(catalogSymbols.map((s) => s.slug));
  const symbols = [...catalogSymbols, ...custom.filter((c) => !seen.has(c.slug))];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: cat.title,
        description: cat.description,
        url,
        inLanguage: "pl-PL",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: T.dream.breadcrumbRoot, item: `${SITE.url}/` },
          { "@type": "ListItem", position: 2, name: cat.h1, item: url },
        ],
      },
      {
        "@type": "ItemList",
        itemListElement: symbols.slice(0, 50).map((s, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: capitalize(s.phrase),
          url: `${SITE.url}${dreamPath(s.slug)}`,
        })),
      },
    ],
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <JsonLd data={jsonLd} />

      <nav aria-label={T.dream.breadcrumbAria} className="text-sm text-text-muted">
        <Link href="/" className="link-soft">{T.dream.breadcrumbRoot}</Link>
        {" / "}
        <span className="text-text">{cat.h1}</span>
      </nav>

      <header>
        <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">{cat.h1}</h1>
        <p className="mt-4 max-w-2xl text-text-muted">{cat.intro}</p>
      </header>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-text">
          كل أحلام هذه الفئة ({symbols.length})
        </h2>
        {symbols.length === 0 ? (
          <p className="text-text-muted">هذه الفئة قيد الإعداد.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {symbols.map((s) => (
              <Link
                key={s.slug}
                href={dreamPath(s.slug)}
                className="rounded-full border border-border bg-bg-elev px-3 py-1.5 text-sm text-text no-underline chip"
              >
                {capitalize(s.phrase)}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-border pt-6">
        <h2 className="mb-3 text-lg font-semibold text-text">Inne kategorie snów</h2>
        <div className="flex flex-wrap gap-2">
          {others.map((c) => (
            <Link
              key={c.slug}
              href={categoryPath(c.slug)}
              className="rounded-full border border-border bg-bg-soft px-3 py-1.5 text-sm text-text-muted no-underline chip hover:text-accent"
            >
              {c.h1.replace(/^Sny o /, "")}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
