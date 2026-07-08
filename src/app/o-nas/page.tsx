import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import JsonLd from "@/components/JsonLd";

export const revalidate = 86400;

const title = `من نحن — من يصنع ${SITE.name}`;
const description =
  "تعرّف على hulm.pro: من نحن، كيف نكتب تفسير الأحلام، ولماذا نراهن على الهدوء والجودة واحترام القارئ. قاموس أحلام دافئ وموثوق أونلاين.";

export const metadata: Metadata = {
  title: { absolute: `${title} — ${SITE.name}` },
  description,
  alternates: { canonical: `${SITE.url}/o-nas/` },
  openGraph: { title, description, url: `${SITE.url}/o-nas/`, type: "website" },
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "AboutPage", name: title, description, url: `${SITE.url}/o-nas/`, inLanguage: "ar" },
      {
        "@type": "Organization",
        name: SITE.name,
        alternateName: SITE.domain,
        url: SITE.url,
        description,
        contactPoint: { "@type": "ContactPoint", contactType: "customer support", url: `${SITE.url}/kontakt` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE.name, item: SITE.url },
          { "@type": "ListItem", position: 2, name: "من نحن", item: `${SITE.url}/o-nas` },
        ],
      },
    ],
  };

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-6">
      <JsonLd data={jsonLd} />
      <header>
        <h1 className="text-balance text-4xl text-text sm:text-5xl">من نحن</h1>
        <p className="mt-3 font-serif text-lg italic text-text-muted">
          قاموس أحلام هادئ وموثوق أونلاين. بلا ترهيب، وباحترام للقارئ.
        </p>
      </header>

      <section className="prose text-text">
        <h2>من نحن</h2>
        <p>
          {SITE.name} ({SITE.domain}) موقع مستقل عن معاني الأحلام والرموز والألوان والأرقام.
          أنشأناه لأن معظم قواميس الأحلام على الإنترنت فوضوية ومكررة ومزدحمة بالإعلانات.
          أردنا العكس: تفسيرًا واحدًا واضحًا، مكتوبًا بلغة دافئة كأنها من كتاب قديم، مريحًا للقراءة حتى في الليل.
        </p>

        <h2>كيف نكتب التفسيرات</h2>
        <p>
          نصف كل مصطلح استنادًا إلى الرمزية الثقافية وتراث تعبير الرؤى وعلم نفس الأحلام. نقرأ الحلم في
          ثلاث طبقات: ما يعنيه الرمز غالبًا، كيف يغيّره الشعور الذي رافقه، وأيّ نصيحة لطيفة قد تُستخلص منه.
          بدل التنبؤات القاطعة نقدّم نقطة انطلاق لتأمّلك الخاص، بروح تجمع بين الهدوء النفسي وتراث ابن سيرين.
        </p>
        <p>
          نراجع النصوص ونتحقق منها لغةً واتساقًا. لا ننسخ قواميس غيرنا. وفي مقالات المدونة نذكر المصادر التي استعنّا بها.
        </p>

        <h2>ما لن تجده لدينا</h2>
        <p>
          لا نُرهب ولا نصدر أحكامًا قاطعة. تفسيرات الأحلام ذات طابع تأمّلي ولا تُغني عن استشارة نفسية أو
          طبية. وإن ارتبط الحلم بمشاعر صعبة تتكرر، فمن الطيب أن تتحدث مع شخص قريب أو مختص.
        </p>

        <h2>تواصل معنا</h2>
        <p>
          لديك سؤال أو اقتراح أو ينقصك حلم ما؟ اكتب إلينا عبر صفحة{" "}
          <Link href="/kontakt/">اتصل بنا</Link>. شروط الاستخدام في{" "}
          <Link href="/regulamin/">شروط الاستخدام</Link>، وطريقة معالجة البيانات في{" "}
          <Link href="/polityka-prywatnosci/">سياسة الخصوصية</Link>.
        </p>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link href="/" className="rounded-full border border-border bg-bg-soft px-4 py-2 text-sm text-text no-underline chip">تفسير الأحلام</Link>
        <Link href="/kolory/" className="rounded-full border border-border bg-bg-soft px-4 py-2 text-sm text-text no-underline chip">معاني الألوان</Link>
        <Link href="/liczby/" className="rounded-full border border-border bg-bg-soft px-4 py-2 text-sm text-text no-underline chip">معاني الأرقام</Link>
        <Link href="/blog/" className="rounded-full border border-border bg-bg-soft px-4 py-2 text-sm text-text no-underline chip">المدونة</Link>
      </div>
    </article>
  );
}
