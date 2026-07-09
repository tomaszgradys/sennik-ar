import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { catalogEntry, isPublished } from "@/lib/catalog";
import { dreamPath } from "@/lib/dream";
import JsonLd from "@/components/JsonLd";
import AdSlot from "@/components/AdSlot";

export const revalidate = 86400;

const title = "تفسير الأحلام للنابلسي: قراءة روحانية هادئة لأشهر الرموز";
const description =
  "تفسير الأحلام على طريقة الإمام عبد الغني النابلسي صاحب «تعطير الأنام»، بقراءة هادئة تجمع بين رمز الرؤيا وروح التراث وعلم النفس. معاني الماء والذهب والقرآن والزواج والميت وأشهر الرموز.";

export const metadata: Metadata = {
  title: { absolute: `${title} — ${SITE.name}` },
  description,
  alternates: { canonical: `${SITE.url}/tafsir-al-nabulsi/` },
  openGraph: { title, description, url: `${SITE.url}/tafsir-al-nabulsi/`, type: "article" },
};

// رموز مختارة تميّزت بها مدرسة النابلسي «تعطير الأنام»: الروحانيات والعناصر والعلاقات.
// نعرض المنشور منها فقط (بلا روابط مكسورة) — مكمِّلة لمحور ابن سيرين لا مكرِّرة له.
const CANDIDATES = [
  "الماء", "بحر", "نهر", "بحيره", "مطر", "حريق", "الذهب", "الفضه", "لبن", "عسل",
  "القران", "قراءه-القران", "الصلاه", "مسجد", "الكعبه", "العمره", "الدعاء", "سجاده-الصلاه",
  "الميت", "الموت", "قبر", "جنازه", "البكاء", "الدموع",
  "الزواج", "عرس", "خاتم-الزواج", "طفل", "حمل",
  "الثعبان", "افعي", "الاسنان", "سقوط-الاسنان", "الخوف", "كابوس",
];

const faq = [
  {
    q: "من هو النابلسي؟",
    a: "عبد الغني بن إسماعيل النابلسي (ت 1143هـ/1731م) عالمٌ وصوفيٌّ دمشقي، من أشهر من كتب في تأويل الرؤى بكتابه «تعطير الأنام في تفسير المنام»، الذي رتّب فيه الرموز على حروف المعجم فصار مرجعًا يسهل الرجوع إليه إلى اليوم.",
  },
  {
    q: "ما الفرق بين مدرسة النابلسي وابن سيرين؟",
    a: "كلاهما من أعمدة التأويل في التراث العربي والإسلامي. اشتهر ابن سيرين بالتأويل المبكّر المعتمد على اللغة والسياق، بينما جمع النابلسي وهذّب ما سبقه وأضاف لمسةً روحانية وترتيبًا معجميًا واسعًا. نحن نستلهم روح المدرستين معًا بلغة هادئة معاصرة.",
  },
  {
    q: "هل تفسيراتكم منقولة حرفيًا عن «تعطير الأنام»؟",
    a: "لا ننقل حرفيًا، بل نستلهم روح التراث — بما فيه مدرستا النابلسي وابن سيرين — ونقدّمه بلغة مطمئنة تجمع بين الرمز وعلم النفس، ونذكر السياق الثقافي حين يفيد، دون ادّعاء يقينٍ عن الغيب.",
  },
  {
    q: "هل كل رمز له معنى ثابت؟",
    a: "لا. المعنى يتغيّر بحسب الشعور المصاحب للرؤيا وحال الرائي وسياق حياته. الرمز الواحد قد يكون بشرى مرة وتنبيهًا مرة، لذلك نقرؤه كإلهام للتأمل لا كحكم قاطع على المستقبل.",
  },
];

export default function NabulsiPage() {
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
        mainEntityOfPage: `${SITE.url}/tafsir-al-nabulsi`,
        author: { "@type": "Organization", name: SITE.name },
        publisher: { "@type": "Organization", name: SITE.name },
        about: {
          "@type": "Person",
          name: "عبد الغني النابلسي",
          alternateName: "Abd al-Ghani al-Nabulsi",
        },
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
          { "@type": "ListItem", position: 2, name: "تفسير النابلسي", item: `${SITE.url}/tafsir-al-nabulsi/` },
        ],
      },
    ],
  };

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-6">
      <JsonLd data={jsonLd} />
      <header>
        <h1 className="text-balance text-4xl text-text sm:text-5xl">
          تفسير الأحلام للنابلسي
        </h1>
        <p className="mt-3 font-serif text-lg italic text-text-muted">
          قراءة روحانية هادئة لأشهر الرموز، بروح «تعطير الأنام» وعلم النفس معًا.
        </p>
      </header>

      <section className="prose text-text">
        <p>
          إلى جانب ابن سيرين، يقف اسم الإمام عبد الغني النابلسي علامةً بارزة في تأويل
          الرؤى عند العرب والمسلمين. جمع في كتابه «تعطير الأنام في تفسير المنام» تراث
          من سبقه، ورتّب آلاف الرموز على حروف المعجم بلمسةٍ روحانية هادئة. هنا نستلهم
          روح هذه المدرسة، لكن بلغةٍ دافئة معاصرة، ونمزجها بما يضيفه علم النفس الحديث من
          فهمٍ للمشاعر والحياة اليومية.
        </p>
        <p>
          قبل أن تقرأ معنى أي رمز، تذكّر القاعدة اللطيفة: ليست كل المنامات على درجةٍ
          واحدة. منها الرؤيا الطيبة، ومنها ما هو حديث نفسٍ أو أضغاث أحلام لا يستحق القلق.
          تعرّف على{" "}
          <Link href="/anwaa-al-ahlam/">أنواع الأحلام والرؤى</Link> أولًا، ثم عُد لتقرأ
          الرمز الذي يشغلك. ويمكنك أيضًا مقارنة القراءة مع{" "}
          <Link href="/tafsir-ibn-sirin/">تفسير ابن سيرين</Link>.
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold text-text">أشهر رموز الأحلام عند النابلسي</h2>
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
          <Link href="/ahlam/" className="underline">تصفّح كل الرموز</Link> أو ابحث في
          الصفحة الرئيسية.
        </p>
      </section>

      <AdSlot slot="inArticle" />

      <section className="prose text-text">
        <blockquote>
          نقرأ الرموز هنا كإشاراتٍ لطيفة للتأمل، لا كأحكامٍ قاطعة على المستقبل. المعنى
          يتوقف على سياقك ومشاعرك، والقرار يبقى لك.
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
        <Link href="/tafsir-ibn-sirin/" className="rounded-full border border-border bg-bg-soft px-4 py-1.5 text-text no-underline chip">
          تفسير ابن سيرين
        </Link>
        <Link href="/anwaa-al-ahlam/" className="rounded-full border border-border bg-bg-soft px-4 py-1.5 text-text no-underline chip">
          أنواع الأحلام والرؤى
        </Link>
        <Link href="/alwan/" className="rounded-full border border-border bg-bg-soft px-4 py-1.5 text-text no-underline chip">
          معاني الألوان
        </Link>
        <Link href="/arqam/" className="rounded-full border border-border bg-bg-soft px-4 py-1.5 text-text no-underline chip">
          معاني الأرقام
        </Link>
      </nav>
    </article>
  );
}
