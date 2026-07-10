import type { Metadata } from "next";
import Link from "next/link";
import { NAMES, namesByGender, namePath, nameContent } from "@/lib/names";
import { SITE } from "@/lib/site";
import JsonLd from "@/components/JsonLd";
import AdSlot from "@/components/AdSlot";

export const revalidate = 86400;

const title = `تفسير الأسماء في المنام — معاني الأسماء في الأحلام — ${SITE.name}`;
const description =
  "ماذا يعني ظهور اسمٍ في المنام؟ تفسير رؤية الأسماء في الأحلام على قاعدة التراث «الأسماء تُؤوّل بمعانيها». معاني أشهر أسماء الذكور والإناث ودلالتها في الرؤيا، بهدوء وبلا ادّعاء يقينٍ عن الغيب.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: `${SITE.url}/asma/` },
  openGraph: { title, description, url: `${SITE.url}/asma/`, images: [{ url: `${SITE.url}/og/asma.jpg`, width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title, description, images: [`${SITE.url}/og/asma.jpg`] },
};

const faq = [
  {
    q: "كيف تُفسَّر رؤية الاسم في المنام؟",
    a: "القاعدة المتوارثة عند ابن سيرين والنابلسي أن «الأسماء في المنام تُؤوّل بمعانيها»؛ فيُنظر إلى معنى الاسم لغةً وما يوحيه من تفاؤل أو تنبيه. فمن رأى اسمًا معناه السلامة قد يُبشَّر بالعافية، ومن رأى اسمًا معناه العلوّ قد يُقرأ رفعةً وشأنًا. وهي قراءةٌ رمزية لطيفة لا حكمٌ قاطع.",
  },
  {
    q: "هل رؤية اسم شخصٍ تعني ذلك الشخص بعينه؟",
    a: "ليس بالضرورة. قد يكون ظهور الاسم إشارةً إلى معناه في حياة الرائي، لا إلى صاحبه المعروف. والسياق والشعور المصاحب للرؤيا هما ما يرجّح المعنى. نقرأ الاسم هنا كإلهامٍ للتأمل، لا كإخبارٍ قاطع عن أحدٍ أو عن الغيب.",
  },
  {
    q: "ما معنى سماع اسمٍ أو مناداةٍ به في الحلم؟",
    a: "سماع الاسم أو النداء به قد يُقرأ على معنى الاسم نفسه: دعاءً خفيًّا أو بشارةً أو تذكيرًا لطيفًا. فاسمٌ معناه الهداية قد يوحي بوضوح الطريق، واسمٌ معناه الفرح قد يبشّر بسرور. الشعور الذي رافق النداء يوجّه القراءة.",
  },
  {
    q: "هل رؤية اسم النبي محمد ﷺ كرؤية النبي نفسه؟",
    a: "لا. رؤية الاسم مكتوبًا أو سماعه شيء، ورؤية النبي محمد ﷺ نفسه بابٌ آخر له آدابه وأحكامه، وقد أفردناه بصفحة مستقلة. فيُقرأ ظهور الاسم على معناه الكريم من الحمد، لا على أنه رؤية للنبي ﷺ.",
  },
];

function NameGrid({ items }: { items: typeof NAMES }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((n) => (
        <Link
          key={n.slug}
          href={namePath(n.slug)}
          className="group flex flex-col items-center gap-1 rounded-2xl border border-border bg-bg-elev p-4 text-center no-underline shadow-sm card"
        >
          <span className="font-display text-2xl font-semibold text-accent">{n.name}</span>
          <span className="text-xs text-text-muted">{n.translit}</span>
          <span className="mt-1 line-clamp-1 text-xs text-text-muted">{n.meaning.split("،")[0]}</span>
        </Link>
      ))}
    </div>
  );
}

export default function NamesHub() {
  const males = namesByGender("m");
  const females = namesByGender("f");
  const all = NAMES.filter((n) => nameContent(n.slug));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", name: title, description, url: `${SITE.url}/asma/`, inLanguage: "ar" },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE.name, item: SITE.url },
          { "@type": "ListItem", position: 2, name: "الأسماء في المنام", item: `${SITE.url}/asma/` },
        ],
      },
      {
        "@type": "ItemList",
        itemListElement: all.map((n, i) => ({
          "@type": "ListItem", position: i + 1, name: `اسم ${n.name}`, url: `${SITE.url}${namePath(n.slug)}`,
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <JsonLd data={jsonLd} />
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">الأسماء في المنام</h1>
        <p className="mx-auto mt-3 max-w-xl text-text-muted">
          لكل اسمٍ معنى، والأسماء في المنام تُؤوّل بمعانيها. اعرف دلالة رؤية اسمك أو
          اسمٍ ظهر في حلمك، بقراءةٍ هادئة من تراث تعبير الرؤى.
        </p>
      </header>

      <section className="prose text-text">
        <h2>كيف نقرأ الأسماء في الأحلام؟</h2>
        <p>
          من أجمل ما ورّثنا إياه علماء تعبير الرؤى قاعدةٌ لطيفة: أنّ{" "}
          <strong>الأسماء في المنام تُؤوّل بمعانيها ومبانيها</strong>. فحين يظهر اسمٌ في
          الحلم، مكتوبًا أو منطوقًا أو اسمَ شخصٍ نعرفه، لا يُنظر إليه بمعزلٍ عن معناه، بل
          يُقرأ ما يحمله من دلالةٍ لغويةٍ وما يوحيه من تفاؤلٍ أو تنبيه. فاسمٌ معناه
          السلامة قد يبشّر بالعافية، واسمٌ معناه العلوّ قد يُقرأ رفعةً وشأنًا.
        </p>
        <p>
          نعرض هنا معاني أشهر الأسماء العربية ودلالتها في الرؤيا، بأسلوبٍ دافئ ومطمئن،
          من غير ادّعاء يقينٍ عن الغيب ولا حكمٍ قاطع. المعنى إشارةٌ للتأمل تُقرأ في سياق
          حلمك وشعورك. ابحث عن الاسم الذي يشغلك في القائمة أدناه، واقرأ معناه ودلالته.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-text">أسماء الذكور في المنام</h2>
        <NameGrid items={males} />
      </section>

      <AdSlot slot="inArticle" />

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-text">أسماء الإناث في المنام</h2>
        <NameGrid items={females} />
      </section>

      <nav className="flex flex-wrap gap-3 text-sm">
        <Link href="/tafsir-ibn-sirin/" className="rounded-full border border-border bg-bg-soft px-4 py-1.5 text-text no-underline chip">
          تفسير ابن سيرين
        </Link>
        <Link href="/arqam/" className="rounded-full border border-border bg-bg-soft px-4 py-1.5 text-text no-underline chip">
          معاني الأرقام
        </Link>
        <Link href="/alwan/" className="rounded-full border border-border bg-bg-soft px-4 py-1.5 text-text no-underline chip">
          معاني الألوان
        </Link>
        <Link href="/ahlam/" className="rounded-full border border-border bg-bg-soft px-4 py-1.5 text-text no-underline chip">
          كل رموز الأحلام
        </Link>
      </nav>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-text">أسئلة شائعة عن الأسماء في المنام</h2>
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
