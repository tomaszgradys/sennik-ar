import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  isKnownNumber, numberContent, numberSlugs, numberPath, relatedNumbers,
} from "@/lib/numbers";
import { SITE } from "@/lib/site";
import JsonLd from "@/components/JsonLd";
import AdSlot from "@/components/AdSlot";

export const revalidate = 86400;
export function generateStaticParams() {
  return numberSlugs().map((n) => ({ n }));
}

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }): Promise<Metadata> {
  const { n } = await params;
  const content = numberContent(n);
  if (!content) return { title: "لم يُعثر على الرقم" };
  const title = `الرقم ${n} — المعنى والرمزية في الأحلام`;
  const url = `${SITE.url}${numberPath(n)}`;
  return {
    title: { absolute: `${title} — ${SITE.name}` },
    description: content.metaDescription,
    alternates: { canonical: url },
    openGraph: { title, description: content.metaDescription, url, type: "article" },
  };
}

export default async function NumberPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  if (!isKnownNumber(n)) notFound();
  const content = numberContent(n)!;
  const url = `${SITE.url}${numberPath(n)}`;
  const related = relatedNumbers(Number(n));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: `الرقم ${n} — المعنى والرمزية في الأحلام`,
        about: `الرقم ${n}`,
        description: content.quickAnswer,
        inLanguage: "ar",
        mainEntityOfPage: url,
        publisher: { "@type": "Organization", name: SITE.name },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE.name, item: SITE.url },
          { "@type": "ListItem", position: 2, name: "معاني الأرقام", item: `${SITE.url}/liczby/` },
          { "@type": "ListItem", position: 3, name: `الرقم ${n}`, item: url },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: content.faq.map((f) => ({
          "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <article className="stack">
      <JsonLd data={jsonLd} />
      <nav aria-label="المسار" className="text-sm text-text-muted">
        <Link href="/" className="link-soft">الرئيسية</Link>{" / "}
        <Link href="/liczby/" className="link-soft">الأرقام</Link>{" / "}
        <span className="text-text">{n}</span>
      </nav>

      <header className="grid gap-5 sm:grid-cols-[200px_1fr] sm:items-center">
        <div className="flex h-40 items-center justify-center rounded-2xl border border-border bg-bg-elev shadow-sm sm:h-full">
          <span className="font-display text-7xl font-semibold text-accent">{n}</span>
        </div>
        <div>
          <h1 className="text-balance text-4xl text-text sm:text-5xl">الرقم {n}</h1>
          <p className="mt-3 font-serif text-lg italic text-text-muted">
            الرمزية والدلالات وما قد يعنيه الرقم {n} في الأحلام.
          </p>
        </div>
      </header>

      <aside className="rounded-2xl border border-accent/40 bg-accent-soft p-5">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent">باختصار</div>
        <p className="m-0 font-serif text-lg leading-relaxed text-text">{content.quickAnswer}</p>
      </aside>

      <section className="prose mx-auto text-text">
        {content.symbolism.map((p, i) => <p key={i}>{p}</p>)}
      </section>

      <div aria-hidden className="ornament">☾ ✦ ☽</div>
      <AdSlot slot="inArticle" />

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { t: "في الأحلام", v: content.inDreams },
          { t: "في التواريخ", v: content.inDates },
          { t: "كموتيف لليوم", v: content.asDayMotif },
        ].map((b) => (
          <div key={b.t} className="rounded-2xl border border-border bg-bg-elev p-5">
            <div className="mb-1 text-sm font-semibold text-text-muted">{b.t}</div>
            <p className="m-0 text-text">{b.v}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border p-5" style={{ borderColor: "color-mix(in srgb, var(--positive) 32%, var(--border))", background: "color-mix(in srgb, var(--positive) 7%, var(--bg-elev))" }}>
          <div className="mb-2 font-semibold" style={{ color: "var(--positive)" }}>✦ إشارات طيبة</div>
          <p className="m-0 text-text">{content.positive}</p>
        </div>
        <div className="rounded-2xl border p-5" style={{ borderColor: "color-mix(in srgb, var(--negative) 32%, var(--border))", background: "color-mix(in srgb, var(--negative) 7%, var(--bg-elev))" }}>
          <div className="mb-2 font-semibold" style={{ color: "var(--negative)" }}>! ما ينبغي الانتباه له</div>
          <p className="m-0 text-text">{content.warn}</p>
        </div>
      </section>

      <aside className="rounded-xl border border-border bg-bg-soft p-4 text-text">
        <div className="mb-1 text-sm font-semibold text-text-muted">نصيحة</div>
        <p className="m-0">{content.advice}</p>
      </aside>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-text">أرقام مشابهة</h2>
        <div className="flex flex-wrap gap-2">
          {related.map((r) => (
            <Link key={r} href={numberPath(r)} className="rounded-full border border-border bg-bg-elev px-4 py-1.5 text-sm font-semibold text-text no-underline chip">
              {r}
            </Link>
          ))}
        </div>
      </section>

      <AdSlot slot="belowInterpretation" />

      {content.faq.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-text">أسئلة شائعة</h2>
          <div className="flex flex-col gap-3">
            {content.faq.map((f, i) => (
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
    </article>
  );
}
