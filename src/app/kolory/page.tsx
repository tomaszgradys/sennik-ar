import type { Metadata } from "next";
import Link from "next/link";
import { COLORS, colorContent, colorPath } from "@/lib/colors";
import { SITE } from "@/lib/site";
import JsonLd from "@/components/JsonLd";
import { capitalize } from "@/lib/polish";

export const revalidate = 86400;

const title = `معاني الألوان — رمزية الألوان والأحلام — ${SITE.name}`;
const description =
  "ماذا ترمز الألوان؟ اعرف معنى الأحمر والأسود والأبيض وغيرها في الرمزية والمشاعر والأحلام. بأسلوب هادئ وإنساني.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: `${SITE.url}/kolory/` },
  openGraph: { title, description, url: `${SITE.url}/kolory/` },
};

export default function ColorsHub() {
  const colors = COLORS.filter((c) => colorContent(c.slug));
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: title,
        description,
        url: `${SITE.url}/kolory/`,
        inLanguage: "ar",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE.name, item: SITE.url },
          { "@type": "ListItem", position: 2, name: "معاني الألوان", item: `${SITE.url}/kolory/` },
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
    </div>
  );
}
