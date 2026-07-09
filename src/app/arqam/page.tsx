import type { Metadata } from "next";
import { NUMBERS, numberContent, numberPath } from "@/lib/numbers";
import { SITE } from "@/lib/site";
import JsonLd from "@/components/JsonLd";
import NumberSearch from "@/components/NumberSearch";

export const revalidate = 86400;

const title = `معاني الأرقام — رمزية الأرقام والأحلام — ${SITE.name}`;
const description =
  "ماذا ترمز الأرقام في الأحلام؟ اعرف معنى الأرقام من 0 إلى 100، والأرقام المتكررة (777، 1111)، والرقم 786، في الرمزية والأحلام والإشارات اليومية. بلطف وبلا حساب أرقام صارم.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: `${SITE.url}/arqam/` },
  openGraph: { title, description, url: `${SITE.url}/arqam/` },
};

const faq = [
  {
    q: "هل للأرقام في المنام معنى ثابت؟",
    a: "لا. الرقم إشارةٌ لطيفة تُقرأ في سياق الحلم والشعور المصاحب له، لا حكمٌ قاطع. الرقم نفسه قد يعني الوفرة في منام، والانتظار في آخر. نقرأه هنا كمرآةٍ للتأمل بلا حساب أرقامٍ صارم.",
  },
  {
    q: "ما دلالة الرقم 786 في الثقافة الإسلامية؟",
    a: "786 عددٌ يستعمله بعض المسلمين رمزًا لعبارة «بسم الله الرحمن الرحيم» بحساب الجُمَّل، فيكتبونه في مستهلّ الرسائل تبرّكًا. هو عادة ثقافية متوارثة عند بعضهم، وتجد شرحه الكامل على صفحته الخاصة.",
  },
  {
    q: "ماذا تعني الأرقام المتكررة مثل 777 و1111؟",
    a: "الأرقام المتكررة تلفت الانتباه بتناسقها، فيربطها كثيرون بلحظة تأمّلٍ أو تذكيرٍ للتوقف والانتباه لما يشغل البال. نعرض هذه المعاني كإلهامٍ هادئ، لكل رقمٍ صفحته وتفصيله.",
  },
  {
    q: "كيف أعرف معنى رقمٍ ظهر في حلمي؟",
    a: "ابحث عن الرقم من 0 إلى 100 في مربّع البحث أعلاه، أو تصفّح الأرقام المتكررة والخاصة. ستجد على كل صفحة معنى الرقم في الرمزية والأحلام والإشارات اليومية، بأسلوبٍ ميسّر ومطمئن.",
  },
];

export default function NumbersHub() {
  const nums = NUMBERS.filter((n) => numberContent(String(n)));
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", name: title, description, url: `${SITE.url}/arqam/`, inLanguage: "ar" },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE.name, item: SITE.url },
          { "@type": "ListItem", position: 2, name: "معاني الأرقام", item: `${SITE.url}/arqam` },
        ],
      },
      {
        "@type": "ItemList",
        itemListElement: nums.map((n, i) => ({
          "@type": "ListItem", position: i + 1, name: `الرقم ${n}`, url: `${SITE.url}${numberPath(n)}`,
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
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">معاني الأرقام</h1>
        <p className="mx-auto mt-3 max-w-xl text-text-muted">
          الأرقام قد تحمل مزاجًا ورمزية. اعرف بماذا يرتبط كل رقم وما قد يعنيه في
          الأحلام، بهدوء وبأسلوب ميسّر.
        </p>
      </header>

      <NumberSearch numbers={nums} />

      <section className="prose text-text">
        <h2>الأرقام في الأحلام والرمزية</h2>
        <p>
          منذ القدم رافق الرقمُ الإنسانَ لا بوصفه أداة عدٍّ فحسب، بل رمزًا يحمل مزاجًا:
          فالواحد يوحي بالبداية والوحدة، والسبعة بالاكتمال في مواضع كثيرة، والأربعون
          بالمدّة والتحوّل. حين يظهر رقمٌ لافت في المنام — على ساعةٍ أو باب أو في تكرارٍ
          غريب — كثيرًا ما يترك في النفس سؤالًا: تُرى ماذا يعني؟
        </p>
        <p>
          نقرأ الأرقام هنا بلطف، وبلا حساب أرقامٍ صارم يزعم اليقين. المعنى إشارةٌ للتأمل
          تُقرأ في سياق حلمك وشعورك، لا حكمًا على المستقبل. تجد أرقامًا من 0 إلى 100،
          والأرقام المتكررة (777، 1111)، وأرقامًا ذات حضورٍ ثقافيٍّ خاص مثل 786 و40،
          لكلٍّ منها صفحتها وتفصيلها.
        </p>
        <p>
          ابحث عن رقمك في المربّع أعلاه، أو تصفّح القائمة، واقرأ معناه في الرمزية والأحلام
          والإشارات اليومية — بهدوء، وكإلهامٍ للتفكير لا أكثر.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-text">أسئلة شائعة عن أرقام الأحلام</h2>
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
