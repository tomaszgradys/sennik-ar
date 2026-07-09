import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import JsonLd from "@/components/JsonLd";
import AdSlot from "@/components/AdSlot";

export const revalidate = 86400;

const title = "آداب الرؤيا في الإسلام: ماذا تفعل بعد الحلم الطيب والمزعج";
const description =
  "دليل هادئ لآداب الرؤيا كما وردت في السنّة: كيف تتعامل مع الرؤيا الطيبة والحلم المزعج، ولماذا لا يُحكى الكابوس. خطوات مطمئنة بلا ترهيب.";

export const metadata: Metadata = {
  title: { absolute: `${title} — ${SITE.name}` },
  description,
  alternates: { canonical: `${SITE.url}/adab-al-ruya/` },
  openGraph: { title, description, url: `${SITE.url}/adab-al-ruya/`, type: "article" },
};

const faq = [
  {
    q: "ماذا أفعل إذا رأيت رؤيا طيبة؟",
    a: "الأدب المتوارث أن تحمد الله عليها، وتستبشر بها بخير، وتحكيها لمن تحب ممن ينصحك ولا يحسدك. الرؤيا الطيبة بشرى، فقابلها بالشكر والتفاؤل الهادئ.",
  },
  {
    q: "ماذا أفعل إذا رأيت حلمًا مزعجًا أو كابوسًا؟",
    a: "جاء في السنّة أدبٌ لطيف يريح القلب: استعذ بالله من الشيطان، وانفث عن يسارك ثلاثًا، وتحوّل عن جنبك الذي كنت عليه، ولا تحكِ الحلم لأحد. فما يُهمَل من هذا النوع لا يضرّ بإذن الله.",
  },
  {
    q: "لماذا لا يُحكى الحلم المزعج؟",
    a: "لأن الالتفات إليه وحكايته يُكبّر أثره في النفس ويزيد القلق، بلا فائدة. والحكمة المتوارثة أن الحلم المزعج لا يُلتفت إليه ولا يُعبَّر، فيذهب أثره.",
  },
  {
    q: "هل أطلب تفسير كل حلم؟",
    a: "لا. كثير مما نراه حديث نفس أو أضغاث أحلام لا يستحق التأويل. خذ ما يبعث على الخير والتأمل، ودع ما يقلق دون أن تُثقله بالمعاني.",
  },
];

export default function AdabRuyaPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: title,
        description,
        inLanguage: "ar",
        mainEntityOfPage: `${SITE.url}/adab-al-ruya`,
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
          { "@type": "ListItem", position: 3, name: "آداب الرؤيا", item: `${SITE.url}/adab-al-ruya/` },
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
        <span className="text-text">آداب الرؤيا</span>
      </nav>

      <header>
        <h1 className="text-balance text-4xl text-text sm:text-5xl">
          آداب الرؤيا في الإسلام
        </h1>
        <p className="mt-3 font-serif text-lg italic text-text-muted">
          ماذا تفعل بعد الحلم الطيب، وماذا تفعل بعد المزعج — بخطواتٍ لطيفة تريح القلب.
        </p>
      </header>

      <section className="prose text-text">
        <p>
          قبل أن تبحث عن معنى رمزٍ رأيته، ثمّة أدبٌ لطيف علّمته السنّة في التعامل مع
          المنامات نفسها. هذا الأدب — قبل التأويل — هو ما يحفظ راحة القلب: يجعلك
          تستبشر بالطيب، وتمرّ على المزعج بلا قلق. وهو بسيطٌ وسهل، نجمعه لك هنا بهدوء.
        </p>

        <h2>إذا كانت الرؤيا طيبة</h2>
        <p>
          إن رأيت ما يسرّك ويطمئن قلبك، فالأدب المتوارث ثلاثة أشياء لطيفة:
        </p>
        <ul>
          <li><strong>احمد الله</strong> عليها، فالرؤيا الصالحة من الخير.</li>
          <li><strong>استبشر بها</strong> بخير، واجعلها دافعًا للطاعة والتفاؤل.</li>
          <li>
            <strong>احكِها لمن تحب</strong> ممن ينصحك ولا يحسدك؛ ولا تُكثر بها المباهاة.
          </li>
        </ul>

        <h2>إذا كان الحلم مزعجًا</h2>
        <p>
          أما الحلم الذي يبعث على الخوف أو التشويش، فجاء في السنّة أدبٌ يريح النفس
          ويُذهب أثره بإذن الله:
        </p>
        <ul>
          <li><strong>استعذ بالله</strong> من الشيطان ومن شرّ ما رأيت.</li>
          <li><strong>انفث عن يسارك ثلاثًا</strong> (نفخٌ خفيف بلا ريق).</li>
          <li><strong>تحوّل عن جنبك</strong> الذي كنت نائمًا عليه.</li>
          <li>
            <strong>لا تحكِه لأحد</strong> ولا تلتفت إليه؛ فما يُهمَل منها لا يضرّ.
          </li>
        </ul>

        <AdSlot slot="inArticle" />

        <h2>لماذا هذا الأدب مريح؟</h2>
        <p>
          هنا يلتقي التراث مع فهمنا اليوم للنفس: الالتفات إلى الكابوس وإعادة حكايته
          يُكبّران أثره ويطيلان القلق بلا فائدة، بينما الإعراض عنه يُذهبه. فالأدب
          النبوي في جوهره دعوةٌ إلى ألا نمنح المنام المزعج سلطانًا على يومنا. تعرّف
          أكثر على{" "}
          <Link href="/al-kawabis/">الكوابيس ولماذا نراها</Link>، وعلى{" "}
          <Link href="/anwaa-al-ahlam/">أنواع الأحلام والرؤى</Link>.
        </p>

        <blockquote>
          ملاحظة: هذه قراءةٌ مستوحاة من التراث الإسلامي لغرض الطمأنينة، وليست فتوى.
          للمسائل الشرعية الدقيقة يُرجع لأهل العلم.
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
        <Link href="/al-kawabis/" className="rounded-full border border-border bg-bg-soft px-4 py-1.5 text-text no-underline chip">
          الكوابيس
        </Link>
        <Link href="/salat-al-istikhara/" className="rounded-full border border-border bg-bg-soft px-4 py-1.5 text-text no-underline chip">
          صلاة الاستخارة والرؤيا
        </Link>
      </nav>
    </article>
  );
}
