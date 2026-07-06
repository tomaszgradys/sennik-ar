import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Roboty asystentów AI — CHCEMY, żeby crawlowały i mogły cytować/polecać serwis.
// Jawne wpisy (mimo że „*" i tak je dopuszcza) sygnalizują intencję i dają jedno
// miejsce zarządzania, gdyby kiedyś trzeba było coś ograniczyć.
const AI_BOTS = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User", // OpenAI / ChatGPT
  "ClaudeBot", "anthropic-ai", "Claude-Web", // Anthropic / Claude
  "PerplexityBot", "Perplexity-User", // Perplexity
  "Google-Extended", // Google Gemini / AI Overviews
  "Applebot-Extended", // Apple Intelligence
  "CCBot", // Common Crawl (zasila wiele modeli)
  "cohere-ai", "Amazonbot", "Meta-ExternalAgent", "Bytespider",
];

export default function robots(): MetadataRoute.Robots {
  // Bez „Host:" — to niestandardowa dyrektywa, którą Googlebot ignoruje (ostrzeżenie w GSC).
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: "/api/" },
      { userAgent: AI_BOTS, allow: "/", disallow: "/api/" },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
