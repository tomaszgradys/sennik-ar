import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import JsonLd from "@/components/JsonLd";
import AdSlot from "@/components/AdSlot";

export const revalidate = 86400;

const title = "الكوابيس: لماذا نراها وكيف نتعامل معها بهدوء";
const description =
  "لماذا نرى الكوابيس والأحلام المزعجة؟ وماذا نفعل بعدها؟ دليل هادئ يجمع بين علم النوم وآداب السنّة، بلا ترهيب — خطوات عملية تريح القلب وتحسّن النوم.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: `${SITE.url}/al-kawabis/` },
  openGraph: { title, description, url: `${SITE.url}/al-kawabis/`, type: "article" },
};

const faq = [
  {
    q: "لماذا نرى الكوابيس؟",
    a: "غالبًا ما ترتبط الكوابيس بالتوتر والقلق أو التعب أو أحداثٍ مؤثرة مررنا بها، وأحيانًا بقلة النوم أو اضطراب مواعيده. هي في معظمها تصريفٌ ليليٌّ للمشاعر، لا رسالةٌ عن المستقبل، ولا تستحق التأويل.",
  },
  {
    q: "ماذا أفعل بعد كابوس مباشرةً؟",
    a: "جاء في السنّة أدبٌ لطيف: استعذ بالله من الشيطان، وانفث عن يسارك ثلاثًا، وتحوّل عن جنبك، ولا تحكِ الحلم لأحد. ومن الناحية العملية: اجلس قليلًا، تنفّس بعمق، واشرب ماءً حتى تهدأ قبل أن تعود للنوم.",
  },
  {
    q: "هل الكابوس المتكرر يعني شيئًا سيئًا؟",
    a: "تكرار الكابوس غالبًا إشارة إلى قلقٍ أو ضغطٍ لم نعالجه في يقظتنا، لا نذير سوء. الاعتناء بالنوم وتخفيف التوتر يقلّلانه عادةً. وإن تكرر بشدّة وأثّر في يومك، فلا حرج في استشارة مختص.",
  },
  {
    q: "كيف أقلّل الكوابيس؟",
    a: "نَم في مواعيد منتظمة، وابتعد عن الشاشات والأخبار المقلقة والمنبّهات قبل النوم، وخفّف التوتر بذكرٍ أو تنفّسٍ هادئ، واجعل غرفتك مظلمة وهادئة. هذه العادات البسيطة تحسّن جودة النوم وتقلّل الأحلام المزعجة.",
  },
];

export default function KawabisPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: title,
        description,
        inLanguage: "ar",
        mainEntityOfPage: `${SITE.url}/al-kawabis`,
        author: { "@type": "Organization", name: SITE.name },
        publisher: { "@type": "Organization", name: SITE.name },
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE.name, item: SITE.url },
          { "@type": "ListItem", position: 2, name: "أنواع الأحلام", item: `${SITE.url}/anwaa-al-ahlam/` },
          { "@type": "ListItem", position: 3, name: "الكوابيس", item: `${SITE.url}/al-kawabis/` },
        ],
      },
    ],
  };

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-6">
      <JsonLd data={jsonLd} />

      <nav aria-label="مسار التنقل" className="text-sm text-text-muted">
        <Link href="/" className="link-soft">{SITE.name}</Link>
        {" / "}
        <Link href="/anwaa-al-ahlam/" className="link-soft">أنواع الأحلام</Link>
        {" / "}
        <span className="text-text">الكوابيس</span>
      </nav>

      <header>
        <h1 className="text-balance text-4xl text-text sm:text-5xl">
          الكوابيس: لماذا نراها وكيف نتعامل معها
        </h1>
        <p className="mt-3 font-serif text-lg italic text-text-muted">
          بين علم النوم وآداب السنّة — خطواتٌ لطيفة تُذهب القلق وتحسّن النوم.
        </p>
      </header>

      <section className="prose text-text">
        <p>
          يستيقظ الواحد منّا أحيانًا من حلمٍ مزعج بقلبٍ خافق، فيظنّ أنه نذير شؤم.
          والحقيقة أهدأ من ذلك بكثير. في هذه الصفحة نجمع بين ما يقوله علم النوم وما
          ورثناه من أدبٍ لطيف في السنّة، لنتعامل مع الكابوس بلا خوف.
        </p>

        <h2>لماذا نراها؟</h2>
        <p>
          الكوابيس في معظمها{" "}
          <strong>تصريفٌ ليليٌّ للتوتر والمشاعر</strong>: قلقٌ يشغلنا، تعبٌ متراكم،
          حدثٌ مؤثّر، أو حتى قلة نومٍ واضطراب مواعيده. إنها أقرب إلى{" "}
          <Link href="/anwaa-al-ahlam/">حديث النفس</Link> منها إلى رسالةٍ عن المستقبل،
          ولذلك لا تستحق أن نُثقلها بالتأويل أو أن نمنحها سلطانًا على يومنا.
        </p>

        <h2>الأدب النبوي بعد الحلم المزعج</h2>
        <p>
          جاء في السنّة أدبٌ يريح النفس ويُذهب أثر الكابوس بإذن الله:
        </p>
        <ul>
          <li><strong>استعذ بالله</strong> من الشيطان ومن شرّ ما رأيت.</li>
          <li><strong>انفث عن يسارك ثلاثًا</strong>.</li>
          <li><strong>تحوّل عن جنبك</strong> الذي كنت عليه.</li>
          <li><strong>لا تحكِه لأحد</strong> ولا تلتفت إليه.</li>
        </ul>
        <p>
          وتفصيل هذا الأدب في صفحة{" "}
          <Link href="/adab-al-ruya/">آداب الرؤيا في الإسلام</Link>.
        </p>

        <AdSlot slot="inArticle" />

        <h2>خطوات عملية تقلّل الكوابيس</h2>
        <ul>
          <li>نَم واستيقظ في مواعيد منتظمة قدر الإمكان.</li>
          <li>ابتعد عن الشاشات والأخبار المقلقة والمنبّهات قبل النوم بساعة.</li>
          <li>خفّف التوتر بذكرٍ هادئ أو تنفّسٍ عميق أو قراءةٍ لطيفة.</li>
          <li>اجعل غرفتك مظلمة، هادئة، ومعتدلة الحرارة.</li>
          <li>إن استيقظت مذعورًا، اجلس وتنفّس واشرب ماءً حتى تهدأ قبل العودة للنوم.</li>
        </ul>
        <p>
          وإن تكررت الكوابيس بشدّة وأثّرت في يومك ونومك، فلا حرج في استشارة مختص؛ فذلك
          من الأخذ بالأسباب لا من ضعف اليقين.
        </p>

        <blockquote>
          ملاحظة: هذه قراءةٌ للطمأنينة تجمع بين التراث وعلم النوم، ولا تُغني عن استشارة
          طبيبٍ أو مختصٍّ عند الحاجة.
        </blockquote>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-text">أسئلة شائعة</h2>
        {faq.map((f) => (
          <details key={f.q} className="rounded-xl border border-border bg-bg-elev p-4">
            <summary className="cursor-pointer font-semibold text-text">{f.q}</summary>
            <p className="mt-2 text-text-muted">{f.a}</p>
          </details>
        ))}
      </section>

      <nav className="flex flex-wrap gap-3 text-sm">
        <Link href="/adab-al-ruya/" className="rounded-full border border-border bg-bg-soft px-4 py-1.5 text-text no-underline chip">
          آداب الرؤيا
        </Link>
        <Link href="/anwaa-al-ahlam/" className="rounded-full border border-border bg-bg-soft px-4 py-1.5 text-text no-underline chip">
          أنواع الأحلام والرؤى
        </Link>
        <Link href="/atwar-al-qamar/" className="rounded-full border border-border bg-bg-soft px-4 py-1.5 text-text no-underline chip">
          {"طور القمر"}
        </Link>
      </nav>
    </article>
  );
}
