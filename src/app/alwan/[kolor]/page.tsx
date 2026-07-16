import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  COLORS, colorMeta, colorContent, colorSlugs, colorPath, dreamsWithColor,
} from "@/lib/colors";
import { dreamPath } from "@/lib/dream";
import { capitalize, decodeSlug } from "@/lib/polish";
import { SITE } from "@/lib/site";
import JsonLd from "@/components/JsonLd";
import AdSlot from "@/components/AdSlot";

export const revalidate = 86400;
export function generateStaticParams() {
  return colorSlugs().map((kolor) => ({ kolor }));
}

export async function generateMetadata({ params }: { params: Promise<{ kolor: string }> }): Promise<Metadata> {
  const { kolor: raw } = await params;
  const kolor = decodeSlug(raw);
  const c = colorMeta(kolor);
  const content = colorContent(kolor);
  if (!c || !content) return { title: "لم يُعثر على اللون" };
  const title = `لون ${c.name}: ماذا يقول عنك؟ — المعنى والرمزية`;
  const url = `${SITE.url}${colorPath(kolor)}`;
  const ogImage = `${SITE.url}/og/color-${kolor}.jpg`;
  return {
    title: { absolute: title },
    description: content.metaDescription,
    alternates: { canonical: url },
    openGraph: { title, description: content.metaDescription, url, type: "article", images: [{ url: ogImage, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description: content.metaDescription, images: [ogImage] },
  };
}

export default async function ColorPage({ params }: { params: Promise<{ kolor: string }> }) {
  const { kolor: raw } = await params;
  const kolor = decodeSlug(raw);
  const c = colorMeta(kolor);
  const content = colorContent(kolor);
  if (!c || !content) notFound();

  const name = capitalize(c.name);
  const url = `${SITE.url}${colorPath(kolor)}`;
  const dreams = dreamsWithColor(kolor, 10);
  const otherColors = COLORS.filter((x) => x.slug !== kolor && colorContent(x.slug)).slice(0, 6);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: `لون ${c.name} — المعنى والرمزية في الأحلام`,
        about: `لون ${c.name}`,
        description: content.quickAnswer,
        inLanguage: "ar",
        mainEntityOfPage: url,
        publisher: { "@type": "Organization", name: SITE.name },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE.name, item: SITE.url },
          { "@type": "ListItem", position: 2, name: "معاني الألوان", item: `${SITE.url}/alwan/` },
          { "@type": "ListItem", position: 3, name: `لون ${c.name}`, item: url },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: content.faq.map((f) => ({
          "@type": "Question", name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <article className="stack">
      <JsonLd data={jsonLd} />
      <nav aria-label="المسار" className="text-sm text-text-muted">
        <Link href="/" className="link-soft">الرئيسية</Link>{" / "}
        <Link href="/alwan/" className="link-soft">الألوان</Link>{" / "}
        <span className="text-text">{name}</span>
      </nav>

      <header className="grid gap-5 sm:grid-cols-[200px_1fr] sm:items-center">
        <div
          aria-hidden
          className="h-40 w-full rounded-2xl border border-border shadow-sm sm:h-full"
          style={{ background: `radial-gradient(circle at 35% 28%, ${c.hex}, color-mix(in srgb, ${c.hex} 70%, #1a1420) 130%)` }}
        />
        <div>
          <h1 className="text-balance text-4xl text-text sm:text-5xl">لون {c.name}</h1>
          <p className="mt-3 font-serif text-lg italic text-text-muted">
            المعنى والرمزية وما يقوله لون {c.name} في الأحلام.
          </p>
        </div>
      </header>

      <aside className="rounded-2xl border border-accent/40 bg-accent-soft p-5">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent">باختصار</div>
        <p className="m-0 font-serif text-lg leading-relaxed text-text">{content.quickAnswer}</p>
      </aside>

      <section className="prose mx-auto text-text">
        {content.meaning.map((p, i) => <p key={i}>{p}</p>)}
      </section>

      <div aria-hidden className="ornament">☾ ✦ ☽</div>
      <AdSlot slot="inArticle" />

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { t: "في الأحلام", v: content.inDreams },
          { t: "في المشاعر", v: content.inEmotions },
          { t: "في العلاقات", v: content.inRelations },
        ].map((b) => (
          <div key={b.t} className="rounded-2xl border border-border bg-bg-elev p-5">
            <div className="mb-1 text-sm font-semibold text-text-muted">{b.t}</div>
            <p className="m-0 text-text">{b.v}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border p-5" style={{ borderColor: "color-mix(in srgb, var(--positive) 32%, var(--border))", background: "color-mix(in srgb, var(--positive) 7%, var(--bg-elev))" }}>
          <div className="mb-2 font-semibold" style={{ color: "var(--positive)" }}>✦ دلالات طيبة</div>
          <p className="m-0 text-text">{content.positive}</p>
        </div>
        <div className="rounded-2xl border p-5" style={{ borderColor: "color-mix(in srgb, var(--negative) 32%, var(--border))", background: "color-mix(in srgb, var(--negative) 7%, var(--bg-elev))" }}>
          <div className="mb-2 font-semibold" style={{ color: "var(--negative)" }}>! ما ينبغي الانتباه له</div>
          <p className="m-0 text-text">{content.warn}</p>
        </div>
      </section>

      {dreams.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-text">أحلام بلون {c.name}</h2>
          <div className="flex flex-wrap gap-2">
            {dreams.map((d) => (
              <Link key={d.slug} href={dreamPath(d.slug)} className="rounded-full border border-border bg-bg-soft px-3 py-1.5 text-sm text-text no-underline chip">
                {d.phrase}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-text">ألوان أخرى</h2>
        <div className="flex flex-wrap gap-2">
          {otherColors.map((o) => (
            <Link key={o.slug} href={colorPath(o.slug)} className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-elev px-3 py-1.5 text-sm text-text no-underline chip">
              <span aria-hidden className="h-3.5 w-3.5 rounded-full border border-border/60" style={{ background: o.hex }} />
              {capitalize(o.name)}
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
