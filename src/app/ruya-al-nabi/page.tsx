import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import JsonLd from "@/components/JsonLd";
import AdSlot from "@/components/AdSlot";

export const revalidate = 86400;

const title = "رؤية النبي محمد ﷺ في المنام: المعنى والآداب بهدوء";
const description =
  "ماذا تعني رؤية النبي محمد ﷺ في المنام؟ قراءة هادئة تستند إلى التراث الإسلامي والحديث الشريف «من رآني في المنام فقد رآني»، بلا ادّعاء يقينٍ عن الغيب ولا ترهيب.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: `${SITE.url}/ruya-al-nabi/` },
  openGraph: { title, description, url: `${SITE.url}/ruya-al-nabi/`, type: "article" },
};

const faq = [
  {
    q: "ماذا تعني رؤية النبي محمد ﷺ في المنام؟",
    a: "يُنظر إليها في التراث الإسلامي بوصفها رؤيا طيبة ومبشّرة غالبًا، ودليلًا على خيرٍ في حال الرائي. لكن المعنى الدقيق يتوقف على حال الرائي وسياق حلمه ومشاعره، ولا يُدّعى فيه يقينٌ عن الغيب.",
  },
  {
    q: "ما معنى حديث «من رآني في المنام فقد رآني»؟",
    a: "هو حديثٌ صحيح متّفق عليه، ومعناه أن الشيطان لا يتمثّل بصورة النبي ﷺ. وقد بيّن العلماء أن هذا يخصّ من رآه على صورته وصفاته الثابتة المعروفة؛ أما تفصيل «هل رأى الرائي الصورة الحقيقية» فمن دقائق العلم التي يُرجع فيها لأهل الاختصاص.",
  },
  {
    q: "هل تصحّ الأحكام الشرعية بناءً على رؤية النبي في المنام؟",
    a: "المستقر عند جمهور العلماء أن الرؤيا لا تُثبت بها الأحكام الشرعية ولا تنسخ ما استقر في الشريعة، مهما كانت مباركة. الرؤيا بشرى وتثبيت للقلب، لا مصدر تشريع.",
  },
  {
    q: "رأيت النبي ﷺ في حلمي فبماذا أشعر؟",
    a: "الأدب المتوارث أن يُحمد الله على الرؤيا الطيبة وأن يُستبشر بها بخير، مع التواضع وعدم التعالي بها على الناس. اجعلها دافعًا لطيفًا نحو الخير، لا موضوعًا للمباهاة.",
  },
];

export default function RuyaNabiPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: title,
        description,
        inLanguage: "ar",
        mainEntityOfPage: `${SITE.url}/ruya-al-nabi`,
        author: { "@type": "Organization", name: SITE.name },
        publisher: { "@type": "Organization", name: SITE.name },
        about: { "@type": "Thing", name: "رؤية النبي في المنام" },
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
          { "@type": "ListItem", position: 3, name: "رؤية النبي في المنام", item: `${SITE.url}/ruya-al-nabi/` },
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
        <span className="text-text">رؤية النبي في المنام</span>
      </nav>

      <header>
        <h1 className="text-balance text-4xl text-text sm:text-5xl">
          رؤية النبي محمد ﷺ في المنام
        </h1>
        <p className="mt-3 font-serif text-lg italic text-text-muted">
          من أعظم ما يُستبشر به من الرؤى — نقرؤه بهدوء وأدب، وبلا ادّعاء يقينٍ عن الغيب.
        </p>
      </header>

      <section className="prose text-text">
        <p>
          قليلٌ من المنامات يترك في القلب أثرًا كالذي تتركه رؤية النبي محمد ﷺ. يستيقظ
          الرائي بمزيجٍ من الطمأنينة والرهبة، ويتساءل: ماذا تعني؟ في هذه الصفحة نقرأ
          هذا المعنى بروح التراث الإسلامي، بلغةٍ دافئة، ومن غير أن نُثقل الرؤيا بما لا
          تحتمل.
        </p>

        <h2>حديثٌ يطمئن القلب</h2>
        <p>
          ثبت في الصحيحين قوله ﷺ:{" "}
          <strong>«من رآني في المنام فقد رآني، فإن الشيطان لا يتمثّل بي»</strong>. وهذا
          الحديث أصلٌ في الباب: فيه بشرى بأن الشيطان لا يستطيع أن يتصوّر بصورة النبي ﷺ.
          وقد بيّن العلماء أن ذلك يخصّ من رآه على صورته وصفاته الثابتة المعروفة، وأن
          تحقيق «هل رأى الصورة الحقيقية» من دقائق العلم التي يُرجع فيها لأهل الاختصاص.
        </p>

        <h2>ماذا تعني عمومًا؟</h2>
        <p>
          يميل التراث إلى عدّها رؤيا طيبة ومبشّرة: علامة خيرٍ وتثبيتٍ للقلب وحبٍّ للنبي
          ﷺ في قلب الرائي. وكثيرًا ما تأتي في أوقات الشدّة فتكون سكينةً وتذكيرًا بالخير.
          ومع ذلك يبقى المعنى الدقيق مرتبطًا بحال الرائي وسياقه ومشاعره؛ فما يبعث على
          الطمأنينة يُؤخذ منه الخير، من غير مبالغةٍ ولا قطعٍ بالغيب.
        </p>

        <AdSlot slot="inArticle" />

        <h2>حدٌّ لطيف: الرؤيا بشرى لا تشريع</h2>
        <p>
          مهما كانت الرؤيا مباركة، فالمستقر عند جمهور العلماء أنها{" "}
          <strong>لا تُثبت بها الأحكام الشرعية ولا تُغيّر ما استقر في الدين</strong>.
          الرؤيا الصالحة بشرى وتثبيت، لا مصدر تشريع. فمن رأى النبي ﷺ فليستبشر بخير،
          وليحمد الله، وليجعلها دافعًا للطاعة والتواضع، لا موضوعًا للمباهاة على الناس.
        </p>

        <blockquote>
          ملاحظة: هذه قراءةٌ ثقافية وتأمّلية مستوحاة من التراث الإسلامي، لغرض الطمأنينة
          والإلهام، ولا تُقدّم يقينًا عن الغيب ولا تُغني عن سؤال أهل العلم في المسائل
          الشرعية.
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
        <Link href="/tafsir-ibn-sirin/" className="rounded-full border border-border bg-bg-soft px-4 py-1.5 text-text no-underline chip">
          تفسير ابن سيرين
        </Link>
      </nav>
    </article>
  );
}
