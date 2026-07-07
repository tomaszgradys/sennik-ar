import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import JsonLd from "@/components/JsonLd";
import AdSlot from "@/components/AdSlot";

export const revalidate = 86400;

const title = "أنواع الأحلام والرؤى: الفرق بين الرؤيا والحلم وحديث النفس";
const description =
  "دليل هادئ وواضح لأنواع الأحلام في الثقافة العربية والإسلامية: الرؤيا الصادقة، والحلم، وحديث النفس، وأضغاث الأحلام. متى نأخذ الحلم على محمل الجد وآداب التعامل معه.";

export const metadata: Metadata = {
  title: { absolute: `${title} — ${SITE.name}` },
  description,
  alternates: { canonical: `${SITE.url}/anwaa-al-ahlam` },
  openGraph: { title, description, url: `${SITE.url}/anwaa-al-ahlam`, type: "article" },
};

const faq = [
  {
    q: "ما الفرق بين الرؤيا والحلم؟",
    a: "في التقليد الإسلامي تُقسم المنامات عادةً إلى ثلاثة: الرؤيا الصادقة وهي البشرى الطيبة، والحلم وهو ما يبعث على القلق أو الخوف، وحديث النفس وهو انعكاس لما يشغل الإنسان في يقظته. فالرؤيا يُستبشَر بها، والحلم المزعج لا يُلتفت إليه ولا يُحكى.",
  },
  {
    q: "ما هي أضغاث الأحلام؟",
    a: "أضغاث الأحلام تعبير قرآني يعني الأحلام المختلطة غير المترابطة، التي لا تحمل معنى واضحًا ولا تستحق التأويل. كثير مما نراه أثناء النوم من هذا النوع: مشاهد متداخلة من بقايا اليوم والمشاعر.",
  },
  {
    q: "هل كل حلم له تفسير؟",
    a: "لا. جزء كبير مما نحلم به هو حديث نفس أو أضغاث أحلام لا معنى محدد له. لذلك نقرأ الرموز هنا بهدوء، كإلهام للتأمل ومرآة للمشاعر، لا كحكم قاطع على المستقبل.",
  },
  {
    q: "ماذا أفعل إذا رأيت حلمًا مزعجًا؟",
    a: "الأدب المتوارث بسيط ومطمئن: لا تحكِ الحلم المزعج، ولا تُعلّق عليه فكرك، فما يُهمَل منها لا يضرّ. أما الرؤيا الطيبة فيُستحسن أن يُحمَد الله عليها وتُحكى لمن يحب.",
  },
];

export default function DreamTypesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: title,
        description,
        inLanguage: "ar",
        mainEntityOfPage: `${SITE.url}/anwaa-al-ahlam`,
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
          { "@type": "ListItem", position: 2, name: "أنواع الأحلام", item: `${SITE.url}/anwaa-al-ahlam` },
        ],
      },
    ],
  };

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-6">
      <JsonLd data={jsonLd} />
      <header>
        <h1 className="text-balance text-4xl text-text sm:text-5xl">
          أنواع الأحلام والرؤى
        </h1>
        <p className="mt-3 font-serif text-lg italic text-text-muted">
          الفرق بين الرؤيا والحلم وحديث النفس — بهدوء، وبلا ترهيب.
        </p>
      </header>

      <section className="prose text-text">
        <p>
          سؤالٌ يتكرر كثيرًا: هل كل ما نراه في النوم يستحق التأويل؟ في الثقافة
          العربية والإسلامية إجابةٌ لطيفة على هذا، تريح القلب أكثر مما تُقلقه.
          فليست كل المنامات على درجةٍ واحدة، والتمييز بينها هو أول خطوةٍ نحو قراءةٍ
          هادئة وواعية لحلمك.
        </p>

        <h2>1. الرؤيا الصادقة</h2>
        <p>
          الرؤيا هي المنام الطيب الذي يبعث على الطمأنينة والبشرى. يُنظر إليها في
          التقليد الإسلامي بوصفها جزءًا لطيفًا من الخير، وكثيرًا ما ترتبط بوضوحها
          وثباتها في الذاكرة وأثرها الهادئ في النفس بعد الاستيقاظ. إن رأيت ما
          يسرّك، فالأدب المتوارث أن تحمد الله عليه وتحكيه لمن تحب.
        </p>

        <h2>2. الحلم (المزعج)</h2>
        <p>
          الحلم — بالمعنى الخاص هنا — هو المنام الذي يبعث على الخوف أو القلق أو
          التشويش. والحكمة المتوارثة في التعامل معه بسيطة ومريحة:{" "}
          <strong>لا يُحكى ولا يُلتفت إليه</strong>، فما يُهمَل منها لا يترك أثرًا.
          كثيرٌ من كوابيسنا من هذا النوع، وهي أقرب إلى تصريفٍ ليليٍّ للتوتر منها إلى
          رسالةٍ عن المستقبل.
        </p>

        <h2>3. حديث النفس</h2>
        <p>
          حديث النفس هو أكثر أنواع المنامات شيوعًا: انعكاسٌ لما يشغلك في يقظتك — عملٌ
          تفكّر فيه، شخصٌ تحبّه، قلقٌ يلازمك، أو مشهدٌ رأيته قبل النوم. هنا يلتقي
          التراث مع علم النفس الحديث: الحلم مرآةٌ لطيفة لمشاعرك وحياتك اليومية، لا
          أكثر ولا أقل.
        </p>

        <AdSlot slot="inArticle" />

        <h2>أضغاث الأحلام</h2>
        <p>
          «أضغاث أحلام» تعبيرٌ قرآنيٌّ جميل يصف الأحلام المختلطة غير المترابطة، التي
          لا تحمل معنى واضحًا. مشاهد متداخلة، وجوهٌ وأماكن تتبدّل بلا منطق، بقايا اليوم
          تتشابك مع الخيال. هذا النوع لا يستحق عناء التأويل، ويكفي أن نمرّ عليه مرور
          الكرام.
        </p>

        <h2>إذن، متى نأخذ الحلم على محمل الجد؟</h2>
        <p>
          القاعدة الهادئة: خذ من حلمك ما يبعث على الخير والتفاؤل والتأمّل، ودع ما
          يُقلق دون أن تُثقله بالمعاني. نحن هنا نقرأ الرموز — القطة، الماء، الثعبان،
          سقوط الأسنان — كإشاراتٍ لطيفة للتفكير في مشاعرك، لا كأحكامٍ قاطعة. المعنى
          يتوقف دائمًا على السياق والشعور المصاحب.
        </p>

        <blockquote>
          ملاحظة: هذه قراءةٌ ثقافية وتأمّلية مستوحاة من التراث العربي والإسلامي وعلم
          النفس، لغرض الإلهام والراحة، ولا تُغني عن قرارك ولا تُقدّم يقينًا عن الغيب.
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
          تفسير الأحلام لابن سيرين
        </Link>
        <Link href="/sny/" className="rounded-full border border-border bg-bg-soft px-4 py-1.5 text-text no-underline chip">
          كل رموز الأحلام
        </Link>
        <Link href="/" className="rounded-full border border-border bg-bg-soft px-4 py-1.5 text-text no-underline chip">
          ابحث عن حلمك
        </Link>
      </nav>
    </article>
  );
}
