import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  isKnownName, nameMeta, nameContent, nameSlugs, namePath, relatedNames,
} from "@/lib/names";
import { SITE } from "@/lib/site";
import { decodeSlug } from "@/lib/polish";
import JsonLd from "@/components/JsonLd";
import AdSlot from "@/components/AdSlot";

export const revalidate = 86400;
export function generateStaticParams() {
  return nameSlugs().map((name) => ({ name }));
}

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const { name: raw } = await params;
  const slug = decodeSlug(raw);
  const meta = nameMeta(slug);
  const content = nameContent(slug);
  if (!meta || !content) return { title: "لم يُعثر على الاسم" };
  const title = `تفسير رؤية اسم ${meta.name} في المنام — المعنى والدلالة`;
  const url = `${SITE.url}${namePath(slug)}`;
  const ogImage = `${SITE.url}/og/name-${slug}.jpg`;
  return {
    title: { absolute: `${title} — ${SITE.name}` },
    description: content.metaDescription,
    alternates: { canonical: url },
    openGraph: { title, description: content.metaDescription, url, type: "article", images: [{ url: ogImage, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description: content.metaDescription, images: [ogImage] },
  };
}

export default async function NamePage({ params }: { params: Promise<{ name: string }> }) {
  const { name: raw } = await params;
  const slug = decodeSlug(raw);
  if (!isKnownName(slug)) notFound();
  const meta = nameMeta(slug)!;
  const c = nameContent(slug)!;
  const url = `${SITE.url}${namePath(slug)}`;
  const related = relatedNames(slug);
  const genderLabel = meta.gender === "m" ? "اسم علم مذكر" : "اسم علم مؤنث";
  const heroSrc = `/hero/name-${slug}.webp`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: `تفسير رؤية اسم ${meta.name} في المنام`,
        about: `اسم ${meta.name}`,
        description: c.quickAnswer,
        inLanguage: "ar",
        mainEntityOfPage: url,
        image: `${SITE.url}/og/name-${slug}.jpg`,
        author: { "@type": "Organization", name: SITE.name },
        publisher: { "@type": "Organization", name: SITE.name },
      },
      {
        "@type": "DefinedTerm",
        name: meta.name,
        description: meta.meaning,
        inDefinedTermSet: `${SITE.url}/asma/`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE.name, item: SITE.url },
          { "@type": "ListItem", position: 2, name: "الأسماء في المنام", item: `${SITE.url}/asma/` },
          { "@type": "ListItem", position: 3, name: meta.name, item: url },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: c.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };

  return (
    <article className="stack">
      <JsonLd data={jsonLd} />
      <nav aria-label="المسار" className="text-sm text-text-muted">
        <Link href="/" className="link-soft">الرئيسية</Link>{" / "}
        <Link href="/asma/" className="link-soft">الأسماء في المنام</Link>{" / "}
        <span className="text-text">{meta.name}</span>
      </nav>

      <header className="grid gap-5 sm:grid-cols-[220px_1fr] sm:items-center">
        <div className="overflow-hidden rounded-2xl border border-border bg-bg-elev shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroSrc}
            alt={`اسم ${meta.name} بخطٍّ عربي`}
            width={800}
            height={600}
            fetchPriority="high"
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
        <div>
          <h1 className="text-balance text-4xl text-text sm:text-5xl">
            تفسير اسم {meta.name} في المنام
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            {genderLabel} • {meta.origin} • {meta.translit}
          </p>
          <p className="mt-3 font-serif text-lg italic text-text-muted">{meta.meaning}</p>
        </div>
      </header>

      <aside className="rounded-2xl border border-accent/40 bg-accent-soft p-5">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent">باختصار</div>
        <p className="m-0 font-serif text-lg leading-relaxed text-text">{c.quickAnswer}</p>
      </aside>

      <section className="prose mx-auto text-text">
        <h2>معنى اسم {meta.name}</h2>
        <p>{c.meaningLong}</p>
        <h2>تفسير رؤية اسم {meta.name} في المنام</h2>
        {c.inDream.map((p, i) => <p key={i}>{p}</p>)}
      </section>

      <div aria-hidden className="ornament">☾ ✦ ☽</div>
      <AdSlot slot="inArticle" />

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-bg-elev p-5">
          <div className="mb-1 text-sm font-semibold text-text-muted">
            دلالته {meta.gender === "m" ? "للرجل والرائي" : "للمرأة والعزباء والحامل"}
          </div>
          <p className="m-0 text-text">{c.forHer}</p>
        </div>
        <div className="rounded-2xl border p-5" style={{ borderColor: "color-mix(in srgb, var(--positive) 32%, var(--border))", background: "color-mix(in srgb, var(--positive) 7%, var(--bg-elev))" }}>
          <div className="mb-2 font-semibold" style={{ color: "var(--positive)" }}>✦ إشارات طيبة</div>
          <p className="m-0 text-text">{c.positive}</p>
        </div>
      </section>

      <aside className="rounded-xl border border-border bg-bg-soft p-4 text-text">
        <div className="mb-1 text-sm font-semibold text-text-muted">نصيحة</div>
        <p className="m-0">{c.advice}</p>
      </aside>

      {related.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-text">أسماء مشابهة</h2>
          <div className="flex flex-wrap gap-2">
            {related.map((r) => (
              <Link key={r.slug} href={namePath(r.slug)} className="rounded-full border border-border bg-bg-elev px-4 py-1.5 text-sm font-semibold text-text no-underline chip">
                {r.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <AdSlot slot="belowInterpretation" />

      {c.faq.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-text">أسئلة شائعة</h2>
          <div className="flex flex-col gap-3">
            {c.faq.map((f, i) => (
              <details key={i} className="group rounded-xl border border-border bg-bg-elev p-4">
                <summary className="cursor-pointer list-none font-semibold text-text marker:content-none">
                  <span className="ml-2 inline-block text-accent transition-transform group-open:rotate-90">›</span>
                  {f.q}
                </summary>
                <p className="mt-2 mb-0 pr-5 font-serif text-text">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <nav className="flex flex-wrap gap-3 text-sm">
        <Link href="/asma/" className="rounded-full border border-border bg-bg-soft px-4 py-1.5 text-text no-underline chip">
          كل الأسماء في المنام
        </Link>
        <Link href="/tafsir-ibn-sirin/" className="rounded-full border border-border bg-bg-soft px-4 py-1.5 text-text no-underline chip">
          تفسير ابن سيرين
        </Link>
      </nav>
    </article>
  );
}
