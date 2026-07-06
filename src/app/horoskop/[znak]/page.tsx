import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE } from "@/lib/site";
import { T } from "@/locales/pl";
import { SIGNS, SIGN_BY_SLUG, dailyHoroscope } from "@/lib/horoscope";
import AdSlot from "@/components/AdSlot";

export function generateStaticParams() {
  return SIGNS.map((s) => ({ znak: s.slug }));
}

export const dynamicParams = false;
export const revalidate = 3600; // horoskop odświeża się w ciągu dnia

export async function generateMetadata({
  params,
}: {
  params: Promise<{ znak: string }>;
}): Promise<Metadata> {
  const { znak } = await params;
  const sign = SIGN_BY_SLUG.get(znak);
  if (!sign) return { title: "Nie znaleziono znaku" };

  const title = `Horoskop ${sign.name} na dziś — ${SITE.name}`;
  const description = `Horoskop dzienny dla znaku ${sign.name} (${sign.dates}): miłość, finanse, energia i rada na dziś. Codziennie nowy horoskop.`;
  const url = `${SITE.url}/horoskop/${sign.slug}`;
  const ogImage = `${SITE.url}/zodiac/${sign.slug}.jpg`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      images: [{ url: ogImage, width: 1024, height: 1024 }],
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  };
}

export default async function SignPage({
  params,
}: {
  params: Promise<{ znak: string }>;
}) {
  const { znak } = await params;
  const sign = SIGN_BY_SLUG.get(znak);
  if (!sign) notFound();

  const now = new Date();
  const h = dailyHoroscope(sign.slug, now);
  const dateLabel = now.toLocaleDateString("pl-PL", {
    timeZone: "Europe/Warsaw",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-6">
      <nav aria-label={T.dream.breadcrumbAria} className="text-sm text-text-muted">
        <Link href="/horoskop" className="link-soft">
          {T.nav.horoscope}
        </Link>
        {" / "}
        <span className="text-text">{sign.name}</span>
      </nav>

      <header className="text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/zodiac/${sign.slug}.jpg`}
          alt={`Znak zodiaku ${sign.name}`}
          width={1024}
          height={1024}
          fetchPriority="high"
          className="mx-auto aspect-square w-56 rounded-2xl border border-border object-cover shadow-sm sm:w-72"
        />
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-text sm:text-4xl">
          Horoskop {sign.name} na dziś
        </h1>
        <p className="mt-1 text-text-muted">
          {dateLabel} · {sign.dates}
        </p>
      </header>

      <div className="flex flex-col gap-4">
        {[
          ["💗 Miłość i relacje", h.love],
          ["💼 Praca i finanse", h.money],
          ["🔋 Energia i zdrowie", h.energy],
          ["✨ Rada na dziś", h.advice],
        ].map(([label, text]) => (
          <div key={label} className="rounded-xl border border-border bg-bg-elev p-4">
            <div className="mb-1 text-sm font-semibold text-text-muted">{label}</div>
            <p className="m-0 text-text">{text}</p>
          </div>
        ))}
      </div>

      <AdSlot slot="inArticle" />

      <section>
        <h2 className="mb-3 text-lg font-semibold text-text">Inne znaki</h2>
        <div className="flex flex-wrap gap-2">
          {SIGNS.filter((s) => s.slug !== sign.slug).map((s) => (
            <Link
              key={s.slug}
              href={`/horoskop/${s.slug}`}
              className="flex items-center gap-2 rounded-full border border-border bg-bg-soft py-1 pl-1 pr-3 text-sm text-text no-underline chip"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/zodiac/${s.slug}.jpg`}
                alt=""
                width={48}
                height={48}
                loading="lazy"
                className="h-7 w-7 rounded-full object-cover"
              />
              {s.name}
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
