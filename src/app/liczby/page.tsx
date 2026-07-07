import type { Metadata } from "next";
import { NUMBERS, numberContent, numberPath } from "@/lib/numbers";
import { SITE } from "@/lib/site";
import JsonLd from "@/components/JsonLd";
import NumberSearch from "@/components/NumberSearch";

export const revalidate = 86400;

const title = `معاني الأرقام — رمزية الأرقام والأحلام — ${SITE.name}`;
const description =
  "ماذا ترمز الأرقام؟ اعرف معنى الأرقام من 1 إلى 333 في الرمزية والأحلام والإشارات اليومية. بلطف وبلا حساب أرقام صارم.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: `${SITE.url}/liczby` },
  openGraph: { title, description, url: `${SITE.url}/liczby` },
};

export default function NumbersHub() {
  const nums = NUMBERS.filter((n) => numberContent(String(n)));
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", name: title, description, url: `${SITE.url}/liczby`, inLanguage: "ar" },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE.name, item: SITE.url },
          { "@type": "ListItem", position: 2, name: "معاني الأرقام", item: `${SITE.url}/liczby` },
        ],
      },
      {
        "@type": "ItemList",
        itemListElement: nums.map((n, i) => ({
          "@type": "ListItem", position: i + 1, name: `الرقم ${n}`, url: `${SITE.url}${numberPath(n)}`,
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
    </div>
  );
}
