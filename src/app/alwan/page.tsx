import type { Metadata } from "next";
import Link from "next/link";
import { COLORS, colorContent, colorPath } from "@/lib/colors";
import { SITE } from "@/lib/site";
import JsonLd from "@/components/JsonLd";
import { capitalize } from "@/lib/polish";

export const revalidate = 86400;

// العلامة التجارية خارج <title>: جوجل يعرض اسم الموقع منفصلاً في نتائج
// الهاتف، ووجودها في العنوان يلتهم مساحة الجاذب فقط.
const title = "معاني الألوان: ماذا يقول لونك عنك؟";
const description =
  "ماذا ترمز الألوان؟ اعرف معنى الأحمر والأسود والأبيض وغيرها في الرمزية والمشاعر والأحلام. بأسلوب هادئ وإنساني.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: `${SITE.url}/alwan/` },
  openGraph: { title, description, url: `${SITE.url}/alwan/` },
};

const faq = [
  {
    q: "هل لكل لون في المنام معنى ثابت؟",
    a: "لا. لون واحد قد يحمل دلالات مختلفة باختلاف السياق والشعور المصاحب له في الحلم. نقرأ اللون هنا كإشارة لطيفة للتأمل في المشاعر والحال، لا كحكم قاطع. فاللون الذي يبعث على الطمأنينة في منامٍ قد يعني شيئًا آخر حين يقترن بالخوف أو الحزن.",
  },
  {
    q: "ما دلالة اللون الأخضر في الأحلام؟",
    a: "الأخضر من أكثر الألوان محمودةً في التراث العربي والإسلامي؛ يرتبط بالحياة والنماء والراحة، وله في الوجدان مكانة خاصة تقربه من معاني الخير والطمأنينة. ومع ذلك يبقى المعنى مرهونًا بتفاصيل الحلم وشعور صاحبه.",
  },
  {
    q: "ما أكثر الألوان ظهورًا في الأحلام؟",
    a: "الأبيض والأسود والأحمر والأخضر من أكثر الألوان حضورًا. الأبيض يُقرَن غالبًا بالصفاء والسلام، والأسود بالغموض والمجهول، والأحمر بالحيوية والانفعال القوي. تجد شرح كل لون على صفحته الخاصة.",
  },
  {
    q: "كيف أعرف معنى لونٍ رأيته في المنام؟",
    a: "اختر اللون من القائمة أعلاه لتصل إلى صفحته، حيث تجد معناه في الأحلام والمشاعر والعلاقات، مع دلالاته الطيبة وما ينبغي الانتباه له. واقرأه بهدوء، مستحضرًا سياق حلمك وشعورك حينها.",
  },
];

export default function ColorsHub() {
  const colors = COLORS.filter((c) => colorContent(c.slug));
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: title,
        description,
        url: `${SITE.url}/alwan/`,
        inLanguage: "ar",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE.name, item: SITE.url },
          { "@type": "ListItem", position: 2, name: "معاني الألوان", item: `${SITE.url}/alwan/` },
        ],
      },
      {
        "@type": "ItemList",
        itemListElement: colors.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: `لون ${c.name}`,
          url: `${SITE.url}${colorPath(c.slug)}`,
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
        <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
          معاني الألوان
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-text-muted">
          لكل لون مزاجه ورمزيته الخاصة. اعرف ماذا تعني الألوان في المشاعر
          والعلاقات والأحلام، بهدوء وبأسلوب إنساني.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {colors.map((c) => (
          <Link
            key={c.slug}
            href={colorPath(c.slug)}
            className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-bg-elev p-4 no-underline shadow-sm card"
          >
            <span
              aria-hidden
              className="dream-orb"
              style={{ ["--orb" as string]: c.hex }}
            />
            <span className="font-semibold text-text">{capitalize(c.name)}</span>
          </Link>
        ))}
      </div>

      <section className="prose text-text">
        <h2>لماذا نهتمّ بألوان الأحلام؟</h2>
        <p>
          اللون لغةٌ صامتة تحمل مزاجًا قبل أن تحمل معنى. حين يظهر لونٌ بارز في المنام —
          أخضر زرعٍ، أو بياض ثوبٍ، أو حُمرة سماء — كثيرًا ما يترك في النفس أثرًا يفوق
          تفاصيل الحلم نفسه. لذلك يُنظر إلى اللون في تفسير الأحلام بوصفه إشارةً إلى الحال
          والشعور: هل كان الحلم مطمئنًا أم مقلقًا؟ دافئًا أم موحشًا؟
        </p>
        <p>
          في التراث العربي والإسلامي حضورٌ خاص لبعض الألوان؛ فالأخضر يقترن بالحياة والراحة
          وله في الوجدان مكانةٌ محبوبة، والأبيض بالصفاء والسلام، والأسود بالغموض والمجهول.
          لكنّ اللون لا يُقرأ وحده أبدًا، بل ضمن سياق الحلم كاملًا ومع الشعور الذي رافقه.
        </p>
        <p>
          اختر لونًا من القائمة أعلاه لتقرأ معناه بهدوء: دلالته في الأحلام والمشاعر
          والعلاقات، وجانبه الطيّب وما يستحقّ الانتباه. نقدّم ذلك كإلهامٍ للتأمل ومرآةٍ
          للمشاعر، لا كحكمٍ قاطع على المستقبل.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-text">أسئلة شائعة عن ألوان الأحلام</h2>
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
