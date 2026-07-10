import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import JsonLd from "@/components/JsonLd";
import AdSlot from "@/components/AdSlot";

export const revalidate = 86400;

const title = "الرؤيا في القرآن الكريم: قصة يوسف عليه السلام";
const description =
  "كيف تحدث القرآن الكريم عن الرؤيا؟ قراءة هادئة في سورة يوسف: رؤيا الكواكب، وحلم الملك، وأدب «لا تقصص رؤياك»، وما تعلّمنا إياه القصة عن التأويل والتواضع أمام الغيب.";

export const metadata: Metadata = {
  title: { absolute: `${title} — ${SITE.name}` },
  description,
  alternates: { canonical: `${SITE.url}/ruya-fi-alquran/` },
  openGraph: { title, description, url: `${SITE.url}/ruya-fi-alquran/`, type: "article" },
};

const faq = [
  {
    q: "أين ورد ذكر الرؤيا في القرآن الكريم؟",
    a: "أوسع موضع هو سورة يوسف: رؤيا يوسف عليه السلام للكواكب والشمس والقمر، ورؤيا صاحبَي السجن، ورؤيا الملك بالبقرات والسنابل. وورد ذكر الرؤيا أيضًا في مواضع أخرى كرؤيا إبراهيم عليه السلام ورؤيا النبي ﷺ في سورة الفتح. وكلها تدل على أن الرؤيا الصادقة قد تحمل معنى، وأن تأويلها علمٌ وفضلٌ من الله.",
  },
  {
    q: "ما معنى «لا تقصص رؤياك على إخوتك»؟",
    a: "هي وصية يعقوب عليه السلام لابنه يوسف حين قصّ عليه رؤياه. ومنها أخذ أهل العلم أدبًا لطيفًا: الرؤيا الطيبة لا تُحكى لكل أحد، بل لمن يحب الخير لك وينصحك، حتى لا تكون سببًا لحسد أو أذى. وهو أدب متوارث نافع إلى اليوم.",
  },
  {
    q: "ما معنى «أضغاث أحلام» الواردة في السورة؟",
    a: "حين سُئل ملأ الملك عن رؤياه قالوا «أضغاث أحلام وما نحن بتأويل الأحلام بعالمين»، أي خليط من المنامات المتداخلة التي لا تأويل لها. ومن هنا صار التعبير وصفًا لكل حلم مختلط لا يحمل معنى واضحًا، وهو قسم معروف من أقسام المنامات.",
  },
  {
    q: "هل تعلّمنا القصة أن كل رؤيا تتحقق حرفيًا؟",
    a: "لا. القصة تعلّمنا أن الرؤيا الصادقة موجودة وقد تحمل بشرى أو تنبيهًا، لكن تأويلها علمٌ دقيق آتاه الله من شاء من عباده، وأن الغيب لله وحده. لذلك نقرأ رموز الأحلام بتواضع، كإشارات للتأمل لا كأحكام قاطعة على المستقبل.",
  },
];

export default function RuyaQuranPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: title,
        description,
        inLanguage: "ar",
        mainEntityOfPage: `${SITE.url}/ruya-fi-alquran`,
        author: { "@type": "Organization", name: SITE.name },
        publisher: { "@type": "Organization", name: SITE.name },
        about: { "@type": "Thing", name: "الرؤيا في القرآن" },
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
          { "@type": "ListItem", position: 3, name: "الرؤيا في القرآن", item: `${SITE.url}/ruya-fi-alquran/` },
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
        <span className="text-text">الرؤيا في القرآن</span>
      </nav>

      <header>
        <h1 className="text-balance text-4xl text-text sm:text-5xl">
          الرؤيا في القرآن الكريم: قصة يوسف عليه السلام
        </h1>
        <p className="mt-3 font-serif text-lg italic text-text-muted">
          أجمل ما قيل عن الرؤيا قيل في «أحسن القصص» — نقرؤه بهدوء وتدبّر.
        </p>
      </header>

      <section className="prose text-text">
        <p>
          من أراد أن يفهم مكانة الرؤيا في الثقافة الإسلامية فليبدأ من سورة يوسف.
          فالسورة كلها تدور حول رؤى ثلاث: رؤيا غلامٍ صغير، ورؤيا سجينين، ورؤيا ملك.
          وبين هذه الرؤى تتكشف قصة نبيٍّ كريم علّمه الله{" "}
          <strong>تأويل الأحاديث</strong>، فصار التأويل في وعينا علمًا له أهله وأدبه.
        </p>

        <h2>رؤيا الكواكب: بشرى في صورة رمز</h2>
        <p>
          تفتتح السورة بقول يوسف عليه السلام لأبيه:{" "}
          <strong>«يَا أَبَتِ إِنِّي رَأَيْتُ أَحَدَ عَشَرَ كَوْكَبًا وَالشَّمْسَ وَالْقَمَرَ
          رَأَيْتُهُمْ لِي سَاجِدِينَ»</strong>{" "}
          (يوسف: 4). رؤيا رمزية خالصة: كواكب وشمس وقمر تسجد. ولم يتحقق معناها في
          يومٍ أو شهر، بل بعد سنين طويلة حين اجتمع له أهله في مصر. وفي هذا درسٌ
          لطيف: الرؤيا الصادقة قد تكون بشرى بعيدة المدى، لا موعدًا عاجلًا.
        </p>

        <h2>«لا تقصص رؤياك»: أول أدبٍ في التعامل مع الحلم</h2>
        <p>
          كان جواب يعقوب عليه السلام:{" "}
          <strong>«يَا بُنَيَّ لَا تَقْصُصْ رُؤْيَاكَ عَلَىٰ إِخْوَتِكَ فَيَكِيدُوا لَكَ
          كَيْدًا»</strong>{" "}
          (يوسف: 5). فليست كل رؤيا تُحكى لكل أحد؛ الرؤيا الطيبة تُحفظ ويُحدَّث بها
          من يحبك وينصحك. وهذا هو الأصل الذي تجده مفصّلًا في{" "}
          <Link href="/adab-al-ruya/">آداب الرؤيا</Link>.
        </p>

        <AdSlot slot="inArticle" />

        <h2>رؤيا الملك: سبع بقرات وسبع سنابل</h2>
        <p>
          في قلب السورة رؤيا الملك: سبع بقرات سمان يأكلهن سبع عجاف، وسبع سنابل خضر
          وأخر يابسات. عجز عنها الملأ وقالوا: <strong>«أَضْغَاثُ أَحْلَامٍ»</strong>{" "}
          (يوسف: 44) — ومن هنا جاء المصطلح الذي ما زلنا نستعمله لوصف الأحلام
          المختلطة. أمّا يوسف فأوّلها علمًا من الله: سبع سنين خصب تتبعها سبع شداد،
          وخطة عملية كاملة للادخار. فكان التأويل هنا سببًا في نجاة بلادٍ بأكملها.
        </p>

        <h2>ماذا نتعلم من القصة؟</h2>
        <ul>
          <li><strong>الرؤيا الصادقة موجودة</strong>، وقد تحمل بشرى أو تنبيهًا نافعًا.</li>
          <li><strong>التأويل علمٌ وفضل</strong> («وَعَلَّمْتَنِي مِن تَأْوِيلِ الْأَحَادِيثِ») لا تخمين ولا ادّعاء.</li>
          <li><strong>الأدب قبل التأويل</strong>: لا تُحكى الرؤيا لكل أحد.</li>
          <li><strong>الغيب لله وحده</strong>؛ والرؤيا لا تُبنى عليها الأحكام ولا القرارات المصيرية وحدها.</li>
        </ul>

        <blockquote>
          ملاحظة: هذه قراءةٌ ثقافية تأملية في القصة القرآنية لغرض الفهم والطمأنينة،
          وليست تفسيرًا فقهيًا؛ ولتدبّر السورة كاملة يُرجع إلى كتب التفسير المعتمدة
          وأهل العلم.
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
        <Link href="/ruya-al-nabi/" className="rounded-full border border-border bg-bg-soft px-4 py-1.5 text-text no-underline chip">
          رؤية النبي ﷺ في المنام
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
