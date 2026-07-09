import type { Metadata } from "next";
import Link from "next/link";
import { moonPhase, moonIllumination, dailyMoonTip } from "@/lib/moon";
import { SITE } from "@/lib/site";
import AdSlot from "@/components/AdSlot";
import JsonLd from "@/components/JsonLd";

export const revalidate = 3600;

const title = `طور القمر اليوم — كيف يؤثّر في يومك — ${SITE.name}`;
const description =
  "اعرف طور القمر اليوم وماذا يعني ليومك: هل هو وقت مناسب للأمور الجديدة أم للراحة أم للترتيب. بيانات فلكية حقيقية.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: `${SITE.url}/faza-ksiezyca/` },
  openGraph: { title, description, url: `${SITE.url}/faza-ksiezyca/` },
};

const faq = [
  {
    q: "كم عدد أطوار القمر؟",
    a: "يمرّ القمر في دورته الشهرية بثمانية أطوار رئيسية: المحاق، والهلال المتزايد، والتربيع الأول، والأحدب المتزايد، والبدر، ثم الأحدب المتناقص، والتربيع الأخير، والهلال المتناقص. تكتمل الدورة في نحو 29.5 يومًا.",
  },
  {
    q: "كيف تُحسب أطوار القمر هنا؟",
    a: "نعرض طور القمر بناءً على حسابٍ فلكيٍّ حقيقي لموضع القمر بالنسبة للشمس والأرض، لا على تقديرٍ عام. لذلك ترى نسبة إضاءة القرص والطور الدقيق لليوم، مع الأيام الأربعة عشر القادمة.",
  },
  {
    q: "هل للقمر تأثيرٌ فعليٌّ في المزاج والنوم؟",
    a: "يربط كثيرون بين ضوء البدر وتغيّر النوم أو المزاج، وثمة دراسات تناولت ذلك بنتائج متفاوتة. نقدّم أطوار القمر هنا كإيقاعٍ لطيف للتأمل وتنظيم اليوم، لا كقاعدةٍ قاطعة.",
  },
  {
    q: "ما علاقة أطوار القمر بالتقويم الهجري؟",
    a: "التقويم الهجري قمريٌّ في أصله؛ يبدأ كل شهرٍ برؤية الهلال بعد المحاق. فمعرفة طور القمر تساعد على تقدير بداية الشهر العربي واقترابه، وإن ظلّ إعلان بداية الشهر شرعًا مرتبطًا بالرؤية.",
  },
];

export default function MoonPage() {
  const now = new Date();
  const phase = moonPhase(now);
  const illum = moonIllumination(now);
  const dateLabel = now.toLocaleDateString("ar-EG", {
    timeZone: "Asia/Riyadh",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // الأيام الـ14 القادمة.
  const upcoming = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now.getTime() + (i + 1) * 86400000);
    return { date: d, phase: moonPhase(d) };
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: title,
        description,
        url: `${SITE.url}/faza-ksiezyca/`,
        inLanguage: "ar",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE.name, item: SITE.url },
          { "@type": "ListItem", position: 2, name: "طور القمر اليوم", item: `${SITE.url}/faza-ksiezyca/` },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <JsonLd data={jsonLd} />
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
          طور القمر اليوم
        </h1>
        <p className="mt-1 text-text-muted">{dateLabel}</p>
      </header>

      <section className="rounded-2xl border border-border bg-bg-elev p-6 text-center shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/moon/${phase.slug}.jpg`}
          alt={`طور القمر: ${phase.name}`}
          width={1024}
          height={1024}
          fetchPriority="high"
          className="mx-auto aspect-square w-48 rounded-2xl border border-border object-cover shadow-sm sm:w-56"
        />
        <h2 className="mt-4 text-2xl font-bold text-text">{phase.name}</h2>
        <p className="text-sm text-text-muted">
          إضاءة القرص: {illum}%
        </p>
        <p className="mx-auto mt-3 max-w-md text-text">{phase.starting}</p>
      </section>

      <aside className="rounded-xl border border-border bg-bg-soft p-4">
        <div className="mb-1 text-sm font-semibold text-text-muted">
          نصيحة اليوم
        </div>
        <p className="m-0 text-text">{dailyMoonTip(now)}</p>
      </aside>

      <AdSlot slot="inArticle" />

      <section>
        <h2 className="mb-3 text-lg font-semibold text-text">
          الأيام الـ14 القادمة
        </h2>
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {upcoming.map(({ date, phase: p }) => (
            <li
              key={date.toISOString()}
              className="flex items-center justify-between rounded-lg border border-border bg-bg-elev px-3 py-2"
            >
              <span className="text-sm text-text">
                {date.toLocaleDateString("ar-EG", {
                  timeZone: "Asia/Riyadh",
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </span>
              <span className="text-sm text-text-muted">
                {p.emoji} {p.name}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="prose text-text">
        <h2>القمر وإيقاع أيامنا</h2>
        <p>
          رافق القمرُ الإنسانَ منذ القدم بوصفه ساعةً في السماء: به تُعرف الشهور، وعليه
          بُني التقويم العربي والهجري. يتغيّر وجهه ليلةً بعد ليلة من محاقٍ خفيّ إلى
          بدرٍ مكتمل ثم يعود، في دورةٍ تُتمّ نحو تسعةٍ وعشرين يومًا ونصف اليوم.
        </p>
        <p>
          يجد كثيرون في متابعة أطوار القمر إيقاعًا لطيفًا لترتيب اليوم: وقتٌ للبدايات مع
          الهلال المتزايد، ووقتٌ للاكتمال والتأمل مع البدر، ووقتٌ للراحة والترتيب مع
          التناقص. نعرض هنا الطور بحسابٍ فلكيٍّ حقيقي — لا تقديرًا عامًّا — مع نسبة الإضاءة
          والأيام الأربعة عشر القادمة، لتقرأه كإلهامٍ هادئ لا كقاعدةٍ قاطعة.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-text">أسئلة شائعة عن أطوار القمر</h2>
        {faq.map((f) => (
          <details key={f.q} className="rounded-xl border border-border bg-bg-elev p-4">
            <summary className="cursor-pointer font-semibold text-text">{f.q}</summary>
            <p className="mt-2 text-text-muted">{f.a}</p>
          </details>
        ))}
      </section>

      {/* اكتشف أيضًا — روابط خارجة تمنع أن تكون هذه الصفحة (عالية الأولوية ومقصودة
          من كل مكان) طريقًا مسدودًا: تمرّر تدفّق الزحف وتقترح خطوة تالية للقارئ. */}
      <nav aria-label="اكتشف أيضًا" className="border-t border-border pt-6">
        <h2 className="mb-3 text-lg font-semibold text-text">اكتشف أيضًا</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/" className="rounded-full border border-border bg-bg-soft px-4 py-1.5 text-sm text-text no-underline chip">
            تفسير الأحلام
          </Link>
          <Link href="/tafsir-ibn-sirin/" className="rounded-full border border-border bg-bg-soft px-4 py-1.5 text-sm text-text no-underline chip">
            تفسير ابن سيرين
          </Link>
          <Link href="/kolory/" className="rounded-full border border-border bg-bg-soft px-4 py-1.5 text-sm text-text no-underline chip">
            معاني الألوان
          </Link>
          <Link href="/liczby/" className="rounded-full border border-border bg-bg-soft px-4 py-1.5 text-sm text-text no-underline chip">
            معاني الأرقام
          </Link>
          <Link href="/blog/" className="rounded-full border border-border bg-bg-soft px-4 py-1.5 text-sm text-text no-underline chip">
            المدونة
          </Link>
        </div>
      </nav>
    </div>
  );
}
