import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, postSlugs, blogPath, heroSrcBlog, otherPosts } from "@/lib/blog";
import { SITE } from "@/lib/site";
import { decodeSlug } from "@/lib/polish";
import JsonLd from "@/components/JsonLd";
import AdSlot from "@/components/AdSlot";
import ShareButtons from "@/components/ShareButtons";
import TrackView from "@/components/TrackView";

export const revalidate = 3600;
export const dynamicParams = true;
export function generateStaticParams() {
  return postSlugs().map((slug) => ({ slug }));
}

function formatDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug: raw } = await params;
  const slug = decodeSlug(raw);
  const post = getPost(slug);
  if (!post) return { title: "لم يُعثر على المقال" };
  const url = `${SITE.url}${blogPath(slug)}`;
  const img = post.hero ? `${SITE.url}/blog-img/${slug}.jpg` : undefined;
  return {
    title: { absolute: `${post.title} — ${SITE.name}` },
    description: post.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: post.title, description: post.metaDescription, url, type: "article",
      publishedTime: post.date, images: img ? [{ url: img, width: 1200, height: 630 }] : undefined,
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.metaDescription, images: img ? [img] : undefined },
  };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: raw } = await params;
  const slug = decodeSlug(raw);
  const post = getPost(slug);
  if (!post) notFound();

  const url = `${SITE.url}${blogPath(slug)}`;
  const img = heroSrcBlog(slug, post.hero);
  const others = otherPosts(slug, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: post.title,
        description: post.metaDescription,
        datePublished: post.date,
        dateModified: post.date,
        inLanguage: "ar",
        mainEntityOfPage: url,
        image: post.hero ? `${SITE.url}/blog-img/${slug}.jpg` : undefined,
        author: { "@type": "Organization", name: SITE.name, url: SITE.url },
        publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE.name, item: SITE.url },
          { "@type": "ListItem", position: 2, name: "المدونة", item: `${SITE.url}/blog` },
          { "@type": "ListItem", position: 3, name: post.title, item: url },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: post.faq.map((f) => ({
          "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-6">
      <JsonLd data={jsonLd} />
      <TrackView slug={slug} />
      <nav aria-label="المسار" className="text-sm text-text-muted">
        <Link href="/" className="link-soft">الرئيسية</Link>{" / "}
        <Link href="/blog" className="link-soft">المدونة</Link>{" / "}
        <span className="text-text">{post.title}</span>
      </nav>

      <header>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">{post.category}</div>
        <h1 className="text-balance text-4xl text-text sm:text-5xl">{post.h1}</h1>
        <div className="mt-3 text-sm text-text-muted">{formatDate(post.date)} · {post.readMinutes} دقيقة قراءة</div>
      </header>

      {img && (
        // eslint-disable-next-line @next/next/no-img-element -- responsywne: mobile bierze lekkie 400w
        <img
          src={img}
          srcSet={`/blog-img/${slug}-400.webp 400w, /blog-img/${slug}.webp 800w`}
          sizes="(max-width: 672px) 100vw, 672px"
          alt={post.title}
          width={800}
          height={455}
          fetchPriority="high"
          decoding="async"
          className="w-full rounded-2xl border border-border object-cover shadow-sm"
        />
      )}

      <p className="font-serif text-lg leading-relaxed text-text">{post.intro}</p>

      {post.sections.map((s, i) => (
        <section key={i} className="flex flex-col gap-3">
          <h2 className="mt-6 text-2xl font-bold text-text sm:text-[1.7rem]">{s.h2}</h2>
          {s.paragraphs.map((p, j) => <p key={j} className="leading-relaxed text-text">{p}</p>)}
          {i === 1 && <AdSlot slot="inArticle" />}
        </section>
      ))}

      {post.takeaways.length > 0 && (
        <aside className="rounded-2xl border border-accent/40 bg-accent-soft p-5">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">باختصار</div>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {post.takeaways.map((t, i) => (
              <li key={i} className="flex gap-2 text-text"><span aria-hidden className="text-accent">✦</span>{t}</li>
            ))}
          </ul>
        </aside>
      )}

      <ShareButtons url={url} title={post.title} />

      {post.related.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-text">اطّلع أيضًا</h2>
          <div className="flex flex-wrap gap-2">
            {post.related.map((r) => (
              <Link key={r.href} href={r.href} className="rounded-full border border-border bg-bg-soft px-3 py-1.5 text-sm text-text no-underline chip">
                {r.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      {post.faq.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-text">أسئلة شائعة</h2>
          <div className="flex flex-col gap-3">
            {post.faq.map((f, i) => (
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

      {post.sources.length > 0 && (
        <section className="rounded-xl border border-border bg-bg-soft p-4">
          <div className="mb-2 text-sm font-semibold text-text-muted">المصادر</div>
          <ul className="m-0 flex list-none flex-col gap-1 p-0 text-sm">
            {post.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="nofollow noopener noreferrer" className="link-soft">{s.title}</a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <AdSlot slot="belowInterpretation" />

      {others.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-text">اقرأ أيضًا</h2>
          <div className="flex flex-col gap-2">
            {others.map((o) => (
              <Link key={o.slug} href={blogPath(o.slug)} className="rounded-xl border border-border bg-bg-elev p-3 no-underline chip">
                <span className="font-semibold text-text">{o.title}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
