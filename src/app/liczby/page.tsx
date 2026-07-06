import type { Metadata } from "next";
import { NUMBERS, numberContent, numberPath } from "@/lib/numbers";
import { SITE } from "@/lib/site";
import JsonLd from "@/components/JsonLd";
import NumberSearch from "@/components/NumberSearch";

export const revalidate = 86400;

const title = `Znaczenie liczb — symbolika liczb i sny — ${SITE.name}`;
const description =
  "Co symbolizują liczby? Sprawdź znaczenie liczb od 1 do 333 — w symbolice, snach i codziennych znakach. Miękko, bez twardej numerologii.";

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
      { "@type": "CollectionPage", name: title, description, url: `${SITE.url}/liczby`, inLanguage: "pl-PL" },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE.name, item: SITE.url },
          { "@type": "ListItem", position: 2, name: "Znaczenie liczb", item: `${SITE.url}/liczby` },
        ],
      },
      {
        "@type": "ItemList",
        itemListElement: nums.map((n, i) => ({
          "@type": "ListItem", position: i + 1, name: `Liczba ${n}`, url: `${SITE.url}${numberPath(n)}`,
        })),
      },
    ],
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <JsonLd data={jsonLd} />
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">Znaczenie liczb</h1>
        <p className="mx-auto mt-3 max-w-xl text-text-muted">
          Liczby potrafią nieść nastrój i symbolikę. Sprawdź, z czym kojarzą się
          poszczególne liczby i co mogą oznaczać w snach — spokojnie i przystępnie.
        </p>
      </header>

      <NumberSearch numbers={nums} />
    </div>
  );
}
