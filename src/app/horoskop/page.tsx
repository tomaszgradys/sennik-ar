import type { Metadata } from "next";
import Link from "next/link";
import { SIGNS } from "@/lib/horoscope";
import { SITE } from "@/lib/site";
import AdSlot from "@/components/AdSlot";

export const revalidate = 86400;

const title = `حظك اليوم — كل أبراج الزودياك — ${SITE.name}`;
const description =
  "حظ اليوم لكل برج: الحب والمال والطاقة ونصيحة اليوم. اختر برجك واعرف ماذا يحمله اليوم.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: `${SITE.url}/horoskop` },
  openGraph: { title, description, url: `${SITE.url}/horoskop` },
};

export default function HoroscopePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
          حظك اليوم
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-text-muted">
          حظ يومي لكل برج، باختصار ووضوح: الحب والمال والطاقة ونصيحة واحدة لهذا
          اليوم. اختر برجك.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {SIGNS.map((s) => (
          <Link
            key={s.slug}
            href={`/horoskop/${s.slug}`}
            className="group overflow-hidden rounded-2xl border border-border bg-bg-elev text-center no-underline shadow-sm card"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/zodiac/${s.img}.jpg`}
              alt={`برج ${s.name}`}
              width={400}
              height={400}
              loading="lazy"
              className="aspect-square w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
            <div className="p-3">
              <div className="font-semibold text-text">{s.name}</div>
              <div className="text-xs text-text-muted">{s.dates}</div>
            </div>
          </Link>
        ))}
      </div>

      <AdSlot slot="inArticle" />

      <p className="text-center text-sm text-text-muted">
        اقرأ الحظ بهدوء، كإلهام لهذا اليوم.
      </p>

      <p className="mx-auto max-w-xl text-center text-xs leading-relaxed text-text-muted/80">
        ملاحظة: الأبراج هنا للتسلية والإلهام فقط، ولا تُغني عن قرارك ولا تدّعي
        معرفة الغيب. خذ منها ما يبعث على التفاؤل، ودع القرار لك.
      </p>
    </div>
  );
}
