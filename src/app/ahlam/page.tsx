import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES, categoryPath, symbolsInCategory } from "@/lib/categories";
import { SITE } from "@/lib/site";
import { T } from "@/locales/pl";
import JsonLd from "@/components/JsonLd";

// محور «كل الفئات» تحت /ahlam/ — فهرس مركزي يربط المحاور الاثني عشر.
// يُصلح روابط داخلية كانت تشير إلى 404، ويقصّر عمق الزحف (الرئيسية → /ahlam/ → المحور → الرمز).
export const revalidate = 86400;

const url = `${SITE.url}/ahlam/`;
const title = "كل فئات الأحلام — دليل الرموز";
const description =
  "تصفّح كل فئات تفسير الأحلام على hulm.pro: الحيوانات، الناس والعلاقات، البيت، الطبيعة، الجسد، السفر، العمل والمال، المشاعر القوية وغيرها. اعثر على رمز حلمك بسرعة.";

export const metadata: Metadata = {
  title: { absolute: `${title} — ${SITE.name}` },
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url },
};

const faq = [
  {
    q: "كيف أجد تفسير رمزٍ رأيته في حلمي؟",
    a: "اختر الفئة الأقرب إلى حلمك من القائمة أدناه — الحيوانات، الناس، البيت، الطبيعة، الجسد وغيرها — ثم تصفّح رموزها. أو استخدم البحث في أعلى الموقع للوصول مباشرةً إلى الرمز الذي رأيته.",
  },
  {
    q: "هل كل حلمٍ يستحق التفسير؟",
    a: "لا. في التراث العربي والإسلامي تُقسم المنامات إلى رؤيا صادقة، وحلمٍ مزعج، وحديث نفسٍ يعكس ما يشغلنا في اليقظة. كثيرٌ مما نراه من النوع الأخير. لذلك نقرأ الرموز هنا بهدوء، كإلهامٍ للتأمل لا كحكمٍ قاطع على المستقبل.",
  },
  {
    q: "هل تختلف دلالة الرمز باختلاف السياق؟",
    a: "نعم، والسياق أساس كل تأويل. الثعبان أو الماء أو سقوط الأسنان قد يحمل معنى في حالٍ ومعنى آخر في حال، بحسب تفاصيل الحلم والشعور المصاحب له. لذلك نعرض لكل رمزٍ وجوهه المختلفة.",
  },
  {
    q: "من أين تُستمدّ هذه التفسيرات؟",
    a: "نستلهم القراءة من التراث العربي والإسلامي في تعبير الرؤيا — كمدرسة ابن سيرين والنابلسي — ومن التأمل الإنساني وعلم النفس الحديث، بأسلوبٍ مطمئن يوازن بين الموروث والمعنى النفسي، ولغرض الإلهام لا الجزم بالغيب.",
  },
];

export default function DreamsIndex() {
  // عدد الرموز المنشورة لكل فئة (يُظهر أن الفئة غير فارغة ويقوّي الربط الداخلي).
  const cats = CATEGORIES.map((c) => ({
    ...c,
    count: symbolsInCategory(c.name).length,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: title,
        description,
        url,
        inLanguage: "ar",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: T.dream.breadcrumbRoot, item: `${SITE.url}/` },
          { "@type": "ListItem", position: 2, name: "كل الفئات", item: url },
        ],
      },
      {
        "@type": "ItemList",
        itemListElement: cats.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.h1,
          url: `${SITE.url}${categoryPath(c.slug)}`,
        })),
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
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <JsonLd data={jsonLd} />

      <nav aria-label={T.dream.breadcrumbAria} className="text-sm text-text-muted">
        <Link href="/" className="link-soft">{T.dream.breadcrumbRoot}</Link>
        {" / "}
        <span className="text-text">كل الفئات</span>
      </nav>

      <header>
        <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">كل فئات الأحلام</h1>
        <p className="mt-4 max-w-2xl text-text-muted">
          رتّبنا آلاف رموز الأحلام في {CATEGORIES.length} فئات موضوعية. اختر الفئة الأقرب إلى حلمك،
          ثم تصفّح رموزها وتركيباتها بتفسير واضح ومطمئن.
        </p>
      </header>

      <section>
        <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2">
          {cats.map((c) => (
            <li key={c.slug}>
              <Link
                href={categoryPath(c.slug)}
                className="flex h-full flex-col gap-2 rounded-xl border border-border bg-bg-elev p-4 no-underline chip hover:border-accent"
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-lg font-semibold text-text">{c.h1}</span>
                  <span className="shrink-0 text-xs text-text-muted">{c.count}</span>
                </span>
                <span className="text-sm leading-relaxed text-text-muted line-clamp-3">{c.intro}</span>
              </Link>
            </li>
          ))}
        </ul>
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
    </div>
  );
}
