import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import JsonLd from "@/components/JsonLd";
import AdSlot from "@/components/AdSlot";

export const revalidate = 86400;

const title = "صلاة الاستخارة والرؤيا: هل يلزم أن أرى حلمًا بعدها؟";
const description =
  "دليل هادئ عن صلاة الاستخارة وعلاقتها بالرؤيا: كيف تُصلّى، وهل يلزم أن ترى منامًا، وكيف تعرف الخيرة. توضيح مطمئن بلا ترهيب ولا ادّعاء يقينٍ عن الغيب.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: `${SITE.url}/salat-al-istikhara/` },
  openGraph: { title, description, url: `${SITE.url}/salat-al-istikhara/`, type: "article" },
};

const faq = [
  {
    q: "هل يلزم أن أرى رؤيا بعد صلاة الاستخارة؟",
    a: "لا. الاستخارة ليست طلبًا لرؤيا في المنام، بل دعاءٌ أن يختار الله لك الخير وييسّره. كثيرون يستخيرون فلا يرون منامًا، وهذا طبيعي تمامًا. الخيرة تظهر غالبًا في تيسّر الأمر أو تعسّره وفي طمأنينة القلب، لا في حلمٍ بالضرورة.",
  },
  {
    q: "كيف تُصلّى صلاة الاستخارة؟",
    a: "ركعتان من غير الفريضة، ثم تدعو بدعاء الاستخارة الوارد، وتسمّي حاجتك موضع «هذا الأمر». تكون بنيّةٍ صادقة وتوكّلٍ على الله، ثم تمضي في أقرب الأمرين إلى قلبك مع أخذ الأسباب.",
  },
  {
    q: "رأيت حلمًا بعد الاستخارة، فهل هو الجواب؟",
    a: "قد يكون المنام بشرى تطمئن القلب، وقد يكون حديث نفسٍ عمّا شغلك. لا تبنِ قرارًا مصيريًا على منامٍ وحده؛ اجمع بين طمأنينة القلب وتيسّر الأسباب واستشارة أهل الخبرة.",
  },
  {
    q: "كم مرة أعيد الاستخارة؟",
    a: "لا حدّ لازمًا لعددها؛ يستحسن أن تكررها ما دام قلبك متردّدًا. والمقصد أن تسكن نفسك إلى وجهةٍ مع بذل الأسباب، لا انتظار علامةٍ قاطعة.",
  },
];

export default function IstikharaPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: title,
        description,
        inLanguage: "ar",
        mainEntityOfPage: `${SITE.url}/salat-al-istikhara`,
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
          { "@type": "ListItem", position: 3, name: "صلاة الاستخارة والرؤيا", item: `${SITE.url}/salat-al-istikhara/` },
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
        <span className="text-text">صلاة الاستخارة والرؤيا</span>
      </nav>

      <header>
        <h1 className="text-balance text-4xl text-text sm:text-5xl">
          صلاة الاستخارة والرؤيا
        </h1>
        <p className="mt-3 font-serif text-lg italic text-text-muted">
          هل يلزم أن ترى منامًا بعدها؟ توضيحٌ هادئ يريح القلب.
        </p>
      </header>

      <section className="prose text-text">
        <p>
          كثيرون يربطون بين الاستخارة والرؤيا، فينتظرون بعد صلاتهم حلمًا يدلّهم على
          القرار. وهذا الانتظار قد يُتعب القلب بلا داعٍ. لذلك نوضّح هنا، بهدوء،
          حقيقة العلاقة بين الاثنين — لأن فهمها الصحيح يريح أكثر مما نتصوّر.
        </p>

        <h2>الاستخارة دعاء تيسير، لا طلب منام</h2>
        <p>
          صلاة الاستخارة في جوهرها{" "}
          <strong>دعاءٌ أن يختار الله لك الخير وييسّره ويصرف عنك ما فيه ضرّك</strong>،
          ثم تمضي متوكّلًا. ليست طلبًا لرؤيا في المنام، ولا شرطًا أن ترى شيئًا بعدها.
          فمن استخار ولم يرَ حلمًا فاستخارته تامّة، والخيرة تجري في تيسير الأسباب
          وطمأنينة القلب.
        </p>

        <h2>كيف تُصلّى؟</h2>
        <p>
          ركعتان من غير الفريضة، ثم دعاء الاستخارة الوارد عن النبي ﷺ، تسمّي فيه حاجتك.
          تكون بنيّةٍ صادقة، ثم تمضي في أقرب الأمرين إلى قلبك مع بذل الأسباب واستشارة
          أهل الخبرة. والطمأنينة التي تعقب ذلك هي أقرب علامات الخيرة.
        </p>

        <AdSlot slot="inArticle" />

        <h2>وإن رأيت منامًا بعدها؟</h2>
        <p>
          قد يأتي المنام بشرى تُسكِّن القلب، وقد يكون{" "}
          <Link href="/anwaa-al-ahlam/">حديث نفسٍ</Link> عمّا شغلك قبل النوم. الحكمة
          ألا تبني قرارًا مصيريًا على حلمٍ وحده؛ بل اجمع بين طمأنينة القلب، وتيسّر
          الأسباب، ومشورة من تثق بعلمه. الرؤيا الطيبة دافعٌ لطيف، لا حكمٌ قاطع.
        </p>

        <blockquote>
          ملاحظة: هذه قراءةٌ مستوحاة من التراث الإسلامي لغرض الطمأنينة، وليست فتوى.
          لتفاصيل صفة الصلاة ودعائها يُرجع لأهل العلم والمصادر الموثوقة.
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
        <Link href="/anwaa-al-ahlam/" className="rounded-full border border-border bg-bg-soft px-4 py-1.5 text-text no-underline chip">
          أنواع الأحلام والرؤى
        </Link>
        <Link href="/adab-al-ruya/" className="rounded-full border border-border bg-bg-soft px-4 py-1.5 text-text no-underline chip">
          آداب الرؤيا
        </Link>
        <Link href="/ruya-al-nabi/" className="rounded-full border border-border bg-bg-soft px-4 py-1.5 text-text no-underline chip">
          رؤية النبي في المنام
        </Link>
      </nav>
    </article>
  );
}
