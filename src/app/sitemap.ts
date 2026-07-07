import type { MetadataRoute } from "next";
import { allPublished, dreamPath } from "@/lib/dream";
import { SIGNS } from "@/lib/horoscope";
import { colorSlugs, colorPath } from "@/lib/colors";
import { numberSlugs, numberPath } from "@/lib/numbers";
import { listPosts, blogPath } from "@/lib/blog";
import { customDreamSlugs } from "@/lib/custom";
import { categorySlugs, categoryPath } from "@/lib/categories";
import { SITE } from "@/lib/site";

// Sitemap z opublikowanymi hasłami — Google odkrywa też długi ogon.
// UWAGA: przy zbliżeniu do 50 000 URL (limit/plik) podzielić na sitemap index.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  // Sny dodane z panelu (baza) też do sitemap.
  const custom = (await customDreamSlugs()).map((slug) => ({
    url: `${SITE.url}${dreamPath(slug)}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Wykluczamy najsłabsze kombinacje (priorytet 3) — są noindex, nie ma po co
  // marnować na nie crawl budgetu. Zostają symbole i mocniejsze kombinacje.
  const dreams = allPublished()
    .filter((e) => e.type === "symbol" || e.priority < 3)
    .map((e) => ({
      url: `${SITE.url}${dreamPath(e.slug)}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: e.type === "symbol" ? 0.8 : 0.6,
    }));

  // Wszystkie URL-e z trailing slashem (projekt ma trailingSlash:true) — żeby żaden
  // wpis w sitemap nie był przekierowaniem 308 (marnowanie crawl budgetu, ostrzeżenia GSC).
  const sections: MetadataRoute.Sitemap = [
    { url: `${SITE.url}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${SITE.url}/horoskop/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...SIGNS.map((s) => ({
      url: `${SITE.url}/horoskop/${s.slug}/`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    {
      url: `${SITE.url}/faza-ksiezyca/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    { url: `${SITE.url}/kolory/`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    ...colorSlugs().map((s) => ({
      url: `${SITE.url}${colorPath(s)}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: `${SITE.url}/liczby/`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    ...numberSlugs().map((n) => ({
      url: `${SITE.url}${numberPath(n)}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    // Huby kategorii (topical) — wysoki priorytet, zbierają symbole danej kategorii.
    ...categorySlugs().map((s) => ({
      url: `${SITE.url}${categoryPath(s)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
    { url: `${SITE.url}/blog/`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    ...listPosts().map((p) => ({
      url: `${SITE.url}${blogPath(p.slug)}`,
      lastModified: new Date(p.date + "T12:00:00"),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    // Strony edytorskie natywne kulturowo — wysoki priorytet (EEAT + duże słowa kluczowe)
    { url: `${SITE.url}/tafsir-ibn-sirin/`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE.url}/anwaa-al-ahlam/`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE.url}/o-nas/`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    ...["regulamin", "polityka-prywatnosci", "kontakt"].map((p) => ({
      url: `${SITE.url}/${p}/`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
  ];

  return [...sections, ...dreams, ...custom];
}
