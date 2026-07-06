import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import JsonLd from "@/components/JsonLd";

export const revalidate = 86400;

const title = `O nas — kto tworzy ${SITE.name}`;
const description =
  "Poznaj sennik.tv: kim jesteśmy, jak piszemy interpretacje snów i dlaczego stawiamy na spokój, jakość i szacunek do czytelnika. Ciepły, wiarygodny sennik online.";

export const metadata: Metadata = {
  title: { absolute: `${title} — ${SITE.name}` },
  description,
  alternates: { canonical: `${SITE.url}/o-nas` },
  openGraph: { title, description, url: `${SITE.url}/o-nas`, type: "website" },
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "AboutPage", name: title, description, url: `${SITE.url}/o-nas`, inLanguage: "pl-PL" },
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
          { "@type": "ListItem", position: 2, name: "O nas", item: `${SITE.url}/o-nas` },
        ],
      },
    ],
  };

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-6">
      <JsonLd data={jsonLd} />
      <header>
        <h1 className="text-balance text-4xl text-text sm:text-5xl">O nas</h1>
        <p className="mt-3 font-serif text-lg italic text-text-muted">
          Spokojny, wiarygodny sennik online. Bez straszenia, z szacunkiem do czytelnika.
        </p>
      </header>

      <section className="prose text-text">
        <h2>Kim jesteśmy</h2>
        <p>
          {SITE.name} ({SITE.domain}) to niezależny portal o znaczeniu snów, symboli, kolorów i liczb.
          Tworzymy go, bo polskie senniki zwykle są chaotyczne, przepisane w kółko i zasypane reklamami.
          Chcieliśmy czegoś odwrotnego: jednej jasnej interpretacji, napisanej ciepłym, książkowym
          językiem, wygodnej do czytania także w nocy.
        </p>

        <h2>Jak piszemy interpretacje</h2>
        <p>
          Każde hasło opisujemy w oparciu o symbolikę kulturową, tradycję senników i psychologię snu.
          Sen czytamy w trzech warstwach: co dany symbol oznacza najczęściej, jak zmienia go emocja ze snu
          oraz jaka łagodna wskazówka może z niego wynikać. Zamiast kategorycznych przepowiedni proponujemy
          punkt wyjścia do własnej refleksji.
        </p>
        <p>
          Treści redagujemy i sprawdzamy pod kątem poprawnej polszczyzny i spójności. Nie kopiujemy cudzych
          senników. W artykułach na blogu podajemy źródła, z których korzystaliśmy.
        </p>

        <h2>Czego u nas nie znajdziesz</h2>
        <p>
          Nie straszymy i nie stawiamy diagnoz. Interpretacje snów mają charakter refleksyjny i nie
          zastępują porady psychologicznej ani medycznej. Jeśli sen wiąże się z trudnymi emocjami, które
          wracają, warto porozmawiać z bliską osobą lub specjalistą.
        </p>

        <h2>Kontakt</h2>
        <p>
          Masz pytanie, sugestię albo brakuje Ci jakiegoś snu? Napisz do nas przez stronę{" "}
          <Link href="/kontakt">kontakt</Link>. Zasady korzystania opisujemy w{" "}
          <Link href="/regulamin">regulaminie</Link>, a sposób przetwarzania danych w{" "}
          <Link href="/polityka-prywatnosci">polityce prywatności</Link>.
        </p>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link href="/" className="rounded-full border border-border bg-bg-soft px-4 py-2 text-sm text-text no-underline chip">Sennik</Link>
        <Link href="/kolory" className="rounded-full border border-border bg-bg-soft px-4 py-2 text-sm text-text no-underline chip">Znaczenie kolorów</Link>
        <Link href="/liczby" className="rounded-full border border-border bg-bg-soft px-4 py-2 text-sm text-text no-underline chip">Znaczenie liczb</Link>
        <Link href="/blog" className="rounded-full border border-border bg-bg-soft px-4 py-2 text-sm text-text no-underline chip">Blog</Link>
      </div>
    </article>
  );
}
