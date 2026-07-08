import type { Metadata } from "next";
import Link from "next/link";
import { listPosts, blogPath, heroSrcBlog } from "@/lib/blog";
import { SITE } from "@/lib/site";
import JsonLd from "@/components/JsonLd";

export const revalidate = 3600;

const title = `المدونة — الأحلام والقمر والمعاني — ${SITE.name}`;
const description =
  "مقالات هادئة وطرائف عن الأحلام والرموز والقمر. مقالات جديدة بانتظام، مكتوبة بأسلوب إنساني ومفيد.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: `${SITE.url}/blog/` },
  openGraph: { title, description, url: `${SITE.url}/blog/` },
};

function formatDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" });
}

export default function BlogHub() {
  const posts = listPosts();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Blog", name: title, description, url: `${SITE.url}/blog/`, inLanguage: "ar" },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE.name, item: SITE.url },
          { "@type": "ListItem", position: 2, name: "المدونة", item: `${SITE.url}/blog` },
        ],
      },
    ],
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <JsonLd data={jsonLd} />
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">المدونة</h1>
        <p className="mx-auto mt-3 max-w-xl text-text-muted">
          مقالات هادئة وطرائف عن الأحلام والرموز والقمر. باختصار، بأسلوب إنساني
          ومفيد.
        </p>
      </header>

      <div className="flex flex-col gap-5">
        {posts.map((p) => {
          const img = heroSrcBlog(p.slug, p.hero);
          return (
            <Link
              key={p.slug}
              href={blogPath(p.slug)}
              className="group grid gap-4 overflow-hidden rounded-2xl border border-border bg-bg-elev no-underline shadow-sm card sm:grid-cols-[240px_1fr]"
            >
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt={p.title} width={480} height={360} loading="lazy" decoding="async"
                  className="h-44 w-full object-cover transition-transform duration-700 group-hover:scale-[1.03] sm:h-full" />
              ) : (
                <span aria-hidden className="h-44 w-full bg-bg-soft sm:h-full" />
              )}
              <div className="flex flex-col p-4 sm:py-5">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent">{p.category}</div>
                <h2 className="text-xl font-semibold text-text">{p.title}</h2>
                <p className="mt-2 text-sm text-text-muted">{p.excerpt}</p>
                <div className="mt-auto pt-3 text-xs text-text-muted">
                  {formatDate(p.date)} · {p.readMinutes} دقيقة قراءة
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
