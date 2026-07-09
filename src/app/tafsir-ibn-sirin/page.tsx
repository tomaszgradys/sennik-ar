import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { catalogEntry, isPublished } from "@/lib/catalog";
import { dreamPath } from "@/lib/dream";
import JsonLd from "@/components/JsonLd";
import AdSlot from "@/components/AdSlot";

export const revalidate = 86400;

const title = "تفسير الأحلام لابن سيرين: دليل هادئ لأشهر الرموز";
const description =
  "تفسير الأحلام على طريقة ابن سيرين والتراث العربي، بقراءة هادئة تجمع بين الرمز وعلم النفس. تعرّف على معاني أشهر رموز الأحلام: الثعبان، والأسنان، والماء، والزواج والمزيد.";

export const metadata: Metadata = {
  title: { absolute: `${title} — ${SITE.name}` },
  description,
  alternates: { canonical: `${SITE.url}/tafsir-ibn-sirin/` },
  openGraph: { title, description, url: `${SITE.url}/tafsir-ibn-sirin/`, type: "article" },
};

// رموز مختارة من الأكثر بحثًا في الثقافة العربية. نعرض المنشور منها فقط (بلا روابط مكسورة).
const CANDIDATES = [
  "افعي", "حيه", "ثعبان-اسود", "سن", "سقوط-الاسنان", "كلب", "قطه-سوداء", "بومه",
  "اسد", "حصان", "جمل", "ذئب", "نمر", "فيل", "ثعلب", "ارنب", "بقره", "عنكبوت",
  "سمك", "حوت", "نهر", "بحيره", "مطر", "حريق",
  "طفل", "حمل", "عرس", "خاتم-الزواج", "خاتم", "مجوهرات",
  "قبر", "جنازه", "البكاء", "الدموع", "نزيف",
];

const faq = [
  {
    q: "من هو ابن سيرين؟",
    a: "محمد بن سيرين تابعيٌّ عاش في البصرة، واشتهر في التراث الإسلامي بالورع وبالعناية بتأويل الرؤى، حتى صار اسمه مقترنًا بتفسير الأحلام. تُنسب إليه مدرسة في التأويل تعتمد اللغة والرمز والسياق.",
  },
  {
    q: "هل تفسيراتكم منقولة حرفيًا عن ابن سيرين؟",
    a: "نستلهم روح التراث العربي والإسلامي في التأويل — بما فيه مدرسة ابن سيرين والنابلسي — ونقدّمه بلغة هادئة معاصرة تجمع بين الرمز وعلم النفس. نذكر السياق الثقافي حين يفيد، دون ادّعاء يقينٍ عن الغيب.",
  },
  {
    q: "هل كل رمز له معنى ثابت؟",
    a: "لا. المعنى يتغيّر بحسب الشعور المصاحب للحلم وسياق حياتك. الرمز نفسه قد يكون بشرى مرة وتنبيهًا مرة، لذلك نقرؤه كإلهام للتأمل لا كحكم قاطع.",
  },
];

export default function IbnSirinPage() {
  const symbols = CANDIDATES.map((slug) => {
    if (!isPublished(slug)) return null;
    const e = catalogEntry(slug);
    return e ? { slug, phrase: e.phrase } : null;
  }).filter((x): x is { slug: string; phrase: string } => x !== null);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: title,
        description,
        inLanguage: "ar",
        mainEntityOfPage: `${SITE.url}/tafsir-ibn-sirin`,
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
          { "@type": "ListItem", position: 2, name: "تفسير ابن سيرين", item: `${SITE.url}/tafsir-ibn-sirin/` },
        ],
      },
    ],
  };

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-6">
      <JsonLd data={jsonLd} />
      <header>
        <h1 className="text-balance text-4xl text-text sm:text-5xl">
          تفسير الأحلام لابن سيرين
        </h1>
        <p className="mt-3 font-serif text-lg italic text-text-muted">
          قراءة هادئة لأشهر الرموز، بروح التراث العربي وعلم النفس معًا.
        </p>
      </header>

      <section className="prose text-text">
        <p>
          حين يبحث الناس في عالمنا العربي عن معنى حلمٍ رأوه، كثيرًا ما يسألون:
          «ماذا قال ابن سيرين؟». فقد ارتبط اسمه — رحمه الله — بتأويل الرؤى حتى صار
          علامةً على هذا الباب. هنا نستلهم روح هذا التراث، لكن بلغةٍ دافئة ومطمئنة،
          ونمزجها بما يضيفه علم النفس الحديث من فهمٍ للمشاعر والحياة اليومية.
        </p>
        <p>
          قبل أن تقرأ معنى أي رمز، تذكّر القاعدة اللطيفة: ليست كل المنامات على
          درجةٍ واحدة. منها الرؤيا الطيبة، ومنها ما هو حديث نفسٍ أو أضغاث أحلام لا
          يستحق القلق. تعرّف على{" "}
          <Link href="/anwaa-al-ahlam/">أنواع الأحلام والرؤى</Link> أولًا، ثم عُد
          لتقرأ الرمز الذي يشغلك.
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold text-text">أشهر رموز الأحلام</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {symbols.map((s) => (
            <Link
              key={s.slug}
              href={dreamPath(s.slug)}
              className="rounded-xl border border-border bg-bg-elev px-4 py-3 text-center text-text no-underline card"
            >
              {s.phrase}
            </Link>
          ))}
        </div>
        <p className="mt-4 text-center text-sm text-text-muted">
          لم تجد رمزك؟{" "}
          <Link href="/sny/" className="underline">تصفّح كل الرموز</Link> أو ابحث في
          الصفحة الرئيسية.
        </p>
      </section>

      <AdSlot slot="inArticle" />

      <section className="prose text-text">
        <blockquote>
          نقرأ الرموز هنا كإشاراتٍ لطيفة للتأمل، لا كأحكامٍ قاطعة على المستقبل.
          المعنى يتوقف على سياقك ومشاعرك، والقرار يبقى لك.
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
        <Link href="/tafsir-al-nabulsi/" className="rounded-full border border-border bg-bg-soft px-4 py-1.5 text-text no-underline chip">
          تفسير النابلسي
        </Link>
        <Link href="/anwaa-al-ahlam/" className="rounded-full border border-border bg-bg-soft px-4 py-1.5 text-text no-underline chip">
          أنواع الأحلام والرؤى
        </Link>
        <Link href="/kolory/" className="rounded-full border border-border bg-bg-soft px-4 py-1.5 text-text no-underline chip">
          معاني الألوان
        </Link>
        <Link href="/liczby/" className="rounded-full border border-border bg-bg-soft px-4 py-1.5 text-text no-underline chip">
          معاني الأرقام
        </Link>
      </nav>
    </article>
  );
}
