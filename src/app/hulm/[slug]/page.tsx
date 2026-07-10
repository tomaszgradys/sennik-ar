import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { REMOVED_REDIRECTS } from "@/lib/removedRedirects";
import {
  staticSlugs,
  publishedChildren,
  relatedSymbols,
  dreamPath,
  heroSrc,
  imageKey,
  ogImagePath,
  parentPhrase,
  entryH1,
  metaTitle,
  ogTitle,
  ogDescription,
  capitalize,
} from "@/lib/dream";
import type { DreamEntry } from "@/lib/types";
import { SITE } from "@/lib/site";
import { T } from "@/locales/pl";
import DreamImage from "@/components/DreamImage";
import VariantChips from "@/components/VariantChips";
import JsonLd from "@/components/JsonLd";
import { categoryForName, categoryPath } from "@/lib/categories";
import { canonicalSlug } from "@/lib/catalog";
import AdSlot from "@/components/AdSlot";
import ShareButtons from "@/components/ShareButtons";
import DiscoverCards from "@/components/DiscoverCards";
import MissingWord from "@/components/MissingWord";
import { isKnownWord, wordLabel } from "@/lib/words";
import { COLORS, colorContent, colorPath } from "@/lib/colors";
import { numberContent, numberPath } from "@/lib/numbers";
import { resolveDream } from "@/lib/resolve";
import { decodeSlug } from "@/lib/polish";

// Pre-render tylko priorytetu 1 (opublikowane). Długi ogon renderuje się na
// żądanie (ISR) — nie budujemy 15k naraz.
export function generateStaticParams() {
  return staticSlugs().map((slug) => ({ slug }));
}

export const dynamicParams = true;
export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeSlug(rawSlug);
  const entry = await resolveDream(slug); // pliki + sny z panelu + nakładka edycji
  if (!entry) {
    if (isKnownWord(slug)) {
      const w = wordLabel(slug) ?? slug;
      return {
        title: { absolute: `تفسير حلم ${w} — ${SITE.name}` },
        robots: { index: false, follow: true },
      };
    }
    return { title: "لم يتم العثور على الحلم" };
  }

  const url = `${SITE.url}${dreamPath(entry.slug)}`;
  // Duplikat wtórny (ta sama fraza co inny wpis): canonical → wpis główny, żeby Google
  // skonsolidował, a nie indeksował identycznych stron „أرنب بري / أرنب بري-2".
  const canonical = `${SITE.url}${dreamPath(canonicalSlug(entry.slug))}`;
  const ogImage = `${SITE.url}${ogImagePath(imageKey(entry.slug, entry.parent))}`;
  // Bramkowanie jakości: najsłabsze kombinacje (priorytet 3) trzymamy poza indeksem
  // (crawl budget + jakość domeny), ale zostawiamy „follow" — linki działają.
  const weak = entry.kind === "combo" && entry.priority >= 3;
  return {
    title: { absolute: metaTitle(entry) },
    description: entry.content.metaDescription,
    alternates: { canonical },
    robots: weak ? { index: false, follow: true } : undefined,
    openGraph: {
      title: ogTitle(entry),
      description: ogDescription(entry),
      url,
      type: "article",
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle(entry),
      description: ogDescription(entry),
      images: [ogImage],
    },
  };
}

export default async function DreamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = decodeSlug(rawSlug);
  const removedTarget = REMOVED_REDIRECTS.get(slug);
  if (removedTarget) permanentRedirect(removedTarget);
  const entry = await resolveDream(slug); // pliki + sny z panelu + nakładka edycji
  if (!entry) {
    if (isKnownWord(slug)) return <MissingWord slug={slug} />;
    notFound();
  }

  const c = entry.content;
  const isSymbol = entry.kind === "symbol";
  const imageSrc = heroSrc(imageKey(entry.slug, entry.parent));
  const parentName = parentPhrase(entry.parent);
  const catInfo = categoryForName(entry.category); // hub kategorii (breadcrumb + linkowanie)
  const catLabel = catInfo ? catInfo.h1.replace(/^Sny o /, "") : null;

  // Warianty: dla symbolu jego podfrazy, dla podfrazy inne warianty tego rodzica.
  const variants = (
    isSymbol ? publishedChildren(entry.slug) : publishedChildren(entry.parent)
  )
    .filter((v) => v.slug !== entry.slug)
    .slice(0, 40);
  const related = relatedSymbols(entry);
  const url = `${SITE.url}${dreamPath(entry.slug)}`;
  const h1 = entryH1(entry);

  // Cross-linki do modułów znaczeń: kolor / liczba obecne w haśle (np. „czarny-kot" -> /alwan/czarny).
  const parts = entry.slug.split("-");
  const crossColors = COLORS.filter((cl) => parts.includes(cl.slug) && colorContent(cl.slug));
  const crossNumbers = [...new Set(parts.filter((p) => /^\d{1,4}$/.test(p)))].filter((p) => numberContent(p));

  // Hierarchia: Znaczenie snu → [Hub kategorii] → [Symbol-rodzic dla kombinacji] → hasło.
  const crumbs = [
    { name: T.dream.breadcrumbRoot, item: `${SITE.url}/` },
    ...(catInfo ? [{ name: catInfo.h1, item: `${SITE.url}${categoryPath(catInfo.slug)}` }] : []),
    ...(isSymbol ? [] : [{ name: capitalize(parentName), item: `${SITE.url}${dreamPath(entry.parent)}` }]),
    { name: capitalize(entry.phrase), item: url },
  ];

  // Warstwa modyfikatorów statusu (A05): interpretacje wg حال الرائي. Nagłówki i
  // pytania FAQ w dokładnym wzorcu zapytań „تفسير حلم X للعزباء/للمتزوجة/…".
  const statusVariants = c.byStatus
    ? ([
        { key: "single", label: "للعزباء", text: c.byStatus.single },
        { key: "married", label: "للمتزوجة", text: c.byStatus.married },
        { key: "pregnant", label: "للحامل", text: c.byStatus.pregnant },
        { key: "divorced", label: "للمطلقة", text: c.byStatus.divorced },
        { key: "man", label: "للرجل", text: c.byStatus.man },
      ] as const).filter((s) => typeof s.text === "string" && s.text.length > 0)
    : [];
  const statusFaq = statusVariants.map((s) => ({
    q: `ما تفسير حلم ${entry.phrase} ${s.label}؟`,
    a: s.text,
  }));
  const allFaq = [...(c.faq ?? []), ...statusFaq];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: h1,
        about: entry.phrase,
        description: c.quickAnswer,
        inLanguage: "ar",
        mainEntityOfPage: url,
        image: [`${SITE.url}${ogImagePath(imageKey(entry.slug, entry.parent))}`],
        datePublished: SITE.contentPublished,
        dateModified: SITE.contentUpdated,
        // إسناد تحريري صادق (يطابق تذييل الصفحة «تحرير: فريق hulm.pro») — إشارة E-E-A-T.
        author: { "@type": "Organization", name: `${T.dream.editorialTeam} ${SITE.name}`, url: SITE.url },
        publisher: {
          "@type": "Organization",
          name: SITE.name,
          logo: { "@type": "ImageObject", url: `${SITE.url}/brand/hulm-icon-512.png` },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: crumbs.map((cr, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: cr.name,
          item: cr.item,
        })),
      },
      ...(allFaq.length > 0
        ? [
            {
              "@type": "FAQPage",
              mainEntity: allFaq.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <article className="stack">
      <JsonLd data={jsonLd} />

      <nav aria-label={T.dream.breadcrumbAria} className="text-sm text-text-muted">
        <Link href="/" className="link-soft">
          {T.dream.breadcrumbRoot}
        </Link>
        {" / "}
        {catInfo && (
          <>
            <Link href={categoryPath(catInfo.slug)} className="link-soft">
              {catLabel}
            </Link>
            {" / "}
          </>
        )}
        {isSymbol ? (
          <span className="text-text">{capitalize(entry.phrase)}</span>
        ) : (
          <>
            <Link href={dreamPath(entry.parent)} className="link-soft">
              {capitalize(parentName)}
            </Link>
            {" / "}
            <span className="text-text">{capitalize(entry.phrase)}</span>
          </>
        )}
      </nav>

      <header className="grid gap-5 sm:grid-cols-[220px_1fr] sm:items-center">
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element -- lokalny, zoptymalizowany przy generacji
          <img
            src={imageSrc}
            alt={`${T.dream.imageAlt} ${entry.phrase}`}
            width={800}
            height={600}
            fetchPriority="high"
            decoding="async"
            sizes="(max-width: 640px) 100vw, 220px"
            className="h-40 w-full rounded-2xl border border-border object-cover shadow-sm sm:h-full"
          />
        ) : (
          <DreamImage
            seed={entry.parent}
            label={entry.phrase}
            priority
            className="h-40 w-full rounded-2xl border border-border shadow-sm sm:h-full"
          />
        )}
        <div>
          <h1 className="text-balance text-4xl text-text sm:text-5xl">{h1}</h1>
          <p className="mt-3 font-serif text-lg italic text-text-muted">{c.intro}</p>
        </div>
      </header>

      {variants.length > 0 && (
        <VariantChips
          title={`${T.dream.variantsPrefix} „${isSymbol ? entry.phrase : parentName}” ${T.dream.variantsSuffix}`}
          items={variants.map((v) => ({ href: dreamPath(v.slug), phrase: v.phrase }))}
        />
      )}

      {c.quickAnswer && (
        <aside className="rounded-2xl border border-accent/40 bg-accent-soft p-5">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent">
            {T.dream.quickAnswer}
          </div>
          <p className="m-0 font-serif text-lg leading-relaxed text-text">{c.quickAnswer}</p>
        </aside>
      )}

      <section className="prose mx-auto text-text">
        {c.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </section>

      <div aria-hidden className="ornament">☾ ✦ ☽</div>

      <AdSlot slot="inArticle" />

      <section className="grid gap-4 sm:grid-cols-2">
        <div
          className="rounded-2xl border p-5"
          style={{
            borderColor: "color-mix(in srgb, var(--positive) 32%, var(--border))",
            background: "color-mix(in srgb, var(--positive) 7%, var(--bg-elev))",
          }}
        >
          <div className="mb-2 flex items-center gap-2.5">
            <span
              aria-hidden
              className="flex h-8 w-8 items-center justify-center rounded-full text-white"
              style={{ background: "var(--positive)" }}
            >
              ✦
            </span>
            <span className="font-semibold" style={{ color: "var(--positive)" }}>
              {T.dream.good}
            </span>
          </div>
          <p className="m-0 text-text">{c.positive}</p>
        </div>
        <div
          className="rounded-2xl border p-5"
          style={{
            borderColor: "color-mix(in srgb, var(--negative) 32%, var(--border))",
            background: "color-mix(in srgb, var(--negative) 7%, var(--bg-elev))",
          }}
        >
          <div className="mb-2 flex items-center gap-2.5">
            <span
              aria-hidden
              className="flex h-8 w-8 items-center justify-center rounded-full text-white"
              style={{ background: "var(--negative)" }}
            >
              !
            </span>
            <span className="font-semibold" style={{ color: "var(--negative)" }}>
              {T.dream.warn}
            </span>
          </div>
          <p className="m-0 text-text">{c.negative}</p>
        </div>
      </section>

      <aside className="rounded-xl border border-border bg-bg-soft p-4 text-text">
        <div className="mb-1 text-sm font-semibold text-text-muted">{T.dream.tip}</div>
        <p className="m-0">{c.advice}</p>
      </aside>

      {statusVariants.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-text">
            تفسير حلم {entry.phrase} حسب حال الرائي
          </h2>
          <div className="flex flex-col gap-3">
            {statusVariants.map((s) => (
              <div key={s.key} className="rounded-xl border border-border bg-bg-elev p-4">
                <h3 className="mb-1.5 text-base font-semibold text-text">
                  تفسير حلم {entry.phrase} {s.label}
                </h3>
                <p className="m-0 font-serif text-text">{s.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {(crossColors.length > 0 || crossNumbers.length > 0) && (
        <section className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-text-muted">{T.dream.seeAlsoMeaning}</span>
          {crossColors.map((cl) => (
            <Link key={cl.slug} href={colorPath(cl.slug)} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-soft px-3 py-1.5 text-sm text-text no-underline chip">
              <span aria-hidden className="h-3 w-3 rounded-full border border-border/60" style={{ background: cl.hex }} />
              {T.dream.colorPrefix} {cl.name}
            </Link>
          ))}
          {crossNumbers.map((n) => (
            <Link key={n} href={numberPath(n)} className="rounded-full border border-border bg-bg-soft px-3 py-1.5 text-sm text-text no-underline chip">
              {T.dream.numberPrefix} {n}
            </Link>
          ))}
        </section>
      )}

      {catInfo && (
        <p className="m-0 text-sm text-text-muted">
          {T.dream.moreSimilar}{" "}
          <Link href={categoryPath(catInfo.slug)} className="link-soft text-accent">
            {T.dream.allDreamsOfCategory} {catLabel} ←
          </Link>
        </p>
      )}

      <ShareButtons url={url} title={h1} />

      <AdSlot slot="belowInterpretation" />

      <DiscoverCards />

      {c.faq && c.faq.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-text">{T.dream.faqTitle}</h2>
          <div className="flex flex-col gap-3">
            {c.faq.map((f, i) => (
              <details key={i} className="group rounded-xl border border-border bg-bg-elev p-4">
                <summary className="cursor-pointer list-none font-semibold text-text marker:content-none">
                  <span className="ml-2 inline-block text-accent transition-transform group-open:rotate-90">
                    ›
                  </span>
                  {f.q}
                </summary>
                <p className="mt-2 mb-0 pr-5 font-serif text-text">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-text">{T.dream.related}</h2>
          <div className="flex flex-wrap gap-2">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={dreamPath(r.slug)}
                className="rounded-full border border-border bg-bg-soft px-3 py-1.5 text-sm text-text no-underline chip"
              >
                {r.phrase}
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer className="mt-2 flex flex-col gap-2 border-t border-border pt-4 text-xs text-text-muted">
        <p className="m-0">
          {T.dream.editorialPrefix} <Link href="/man-nahnu/" className="link-soft">{T.dream.editorialTeam} {SITE.name}</Link>. {T.dream.editorialNote}
        </p>
        <p className="m-0">
          {T.dream.disclaimerBottom}
        </p>
      </footer>
    </article>
  );
}
