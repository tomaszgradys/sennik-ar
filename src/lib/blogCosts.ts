// Szacunkowy koszt wygenerowania JEDNEGO wpisu blogowego (scripts/blog.mjs) oraz
// koszt miesięczny przy publikacji 1 wpisu dziennie.
//
// Składniki jednego wpisu:
//  - dobór tematu przez AI (sezon/trendy/Discover) — mały call z web_search,
//  - model claude-sonnet-5 (research + tekst PL, max_tokens 8000),
//  - narzędzie web_search (dobór + research razem, ~7 wyszukiwań),
//  - obrazek hero FLUX dev (fal.ai), 1 sztuka.
//
// Założenia tokenów są przybliżone: web_search doprowadza wyniki do kontekstu, więc
// realny input jest znacznie większy niż sam prompt. Liczby łatwo skorygować tutaj.

export interface CostAssumptions {
  model: string;
  inputTokens: number; // łączny input w pętli agentowej (prompt + wstrzyknięte wyniki web_search)
  outputTokens: number; // wygenerowany JSON wpisu (~1000-1300 słów + FAQ + źródła)
  webSearches: number; // średnia liczba wyszukiwań (max 6)
  fluxImageUsd: number; // FLUX dev, 1 obrazek landscape_4_3 (~1 MP)
  price: {
    inputPerMUsd: number; // $ / 1M tokenów wejściowych
    outputPerMUsd: number; // $ / 1M tokenów wyjściowych
    searchPerKUsd: number; // $ / 1000 wyszukiwań web_search
    promoNote: string;
  };
  postsPerMonth: number; // 1 wpis/dzień
  usdPln: number; // orientacyjny kurs do przeliczenia na PLN
}

// Ceny na 2026-07: Sonnet 5 w promocji do 2026-08-31 ($2/$10 za 1M), potem $3/$15.
// web_search: $10 / 1000 wyszukiwań.
export const BLOG_COST: CostAssumptions = {
  model: "claude-sonnet-5",
  inputTokens: 34000,
  outputTokens: 7000,
  webSearches: 7,
  fluxImageUsd: 0.03,
  price: {
    inputPerMUsd: 2,
    outputPerMUsd: 10,
    searchPerKUsd: 10,
    promoNote: "ceny promocyjne Sonnet 5 do 2026-08-31 (potem ok. +50% za tokeny)",
  },
  postsPerMonth: 30,
  usdPln: 3.7,
};

export interface CostLine { label: string; usd: number }
export interface CostEstimate {
  perBlogUsd: number;
  perMonthUsd: number;
  perBlogPln: number;
  perMonthPln: number;
  breakdown: CostLine[];
  assumptions: CostAssumptions;
}

// ── Ciekawostka: koszt przy WŁASNYM LLM (self-hosted) ──────────────────────
// Zamiast płacić za tokeny API, płacimy za sprzęt (amortyzacja) + prąd. Marginalny
// koszt na wpis spada prawie do zera, ale dochodzi stały koszt maszyny co miesiąc.
export interface SelfHostedAssumptions {
  hardwareUsd: number; // stacja z GPU zdolna uruchomić model ~30B + FLUX (np. RTX 4090 24GB)
  amortMonths: number; // amortyzacja sprzętu
  powerW: number; // pobór pod obciążeniem
  minutesPerBlog: number; // czas generacji tekstu + obrazka
  kwhPriceUsd: number; // cena prądu
  searchPerBlogUsd: number; // web_search i tak płatny (albo tańsza alternatywa)
}

export const SELF_HOSTED: SelfHostedAssumptions = {
  hardwareUsd: 3500,
  amortMonths: 36,
  powerW: 450,
  minutesPerBlog: 6,
  kwhPriceUsd: 0.22,
  searchPerBlogUsd: 0.02,
};

export interface SelfHostedEstimate {
  monthlyAmortUsd: number; // stały koszt/mies (amortyzacja sprzętu)
  perBlogUsd: number; // marginalny koszt/wpis (prąd + wyszukiwarka)
  perMonthUsd: number; // razem/mies przy założonej liczbie wpisów
  perMonthPln: number;
  breakEvenBlogs: number | null; // od ilu wpisów/mies własny LLM jest tańszy niż API
  assumptions: SelfHostedAssumptions;
}

export function estimateSelfHostedCost(
  apiPerBlogUsd: number,
  postsPerMonth = BLOG_COST.postsPerMonth,
  usdPln = BLOG_COST.usdPln,
  a: SelfHostedAssumptions = SELF_HOSTED,
): SelfHostedEstimate {
  const monthlyAmort = a.hardwareUsd / a.amortMonths;
  const energy = (a.powerW / 1000) * (a.minutesPerBlog / 60) * a.kwhPriceUsd;
  const perBlog = energy + a.searchPerBlogUsd;
  const perMonth = monthlyAmort + perBlog * postsPerMonth;
  const denom = apiPerBlogUsd - perBlog;
  const breakEven = denom > 0 ? Math.ceil(monthlyAmort / denom) : null;
  return {
    monthlyAmortUsd: monthlyAmort,
    perBlogUsd: perBlog,
    perMonthUsd: perMonth,
    perMonthPln: perMonth * usdPln,
    breakEvenBlogs: breakEven,
    assumptions: a,
  };
}

export function estimateBlogCost(a: CostAssumptions = BLOG_COST): CostEstimate {
  const llmInput = (a.inputTokens / 1_000_000) * a.price.inputPerMUsd;
  const llmOutput = (a.outputTokens / 1_000_000) * a.price.outputPerMUsd;
  const search = (a.webSearches / 1000) * a.price.searchPerKUsd;
  const image = a.fluxImageUsd;

  const breakdown: CostLine[] = [
    { label: `Sonnet 5 — input (~${(a.inputTokens / 1000).toFixed(0)}k tok.)`, usd: llmInput },
    { label: `Sonnet 5 — output (~${(a.outputTokens / 1000).toFixed(0)}k tok.)`, usd: llmOutput },
    { label: `web_search (~${a.webSearches} zapytań)`, usd: search },
    { label: "Obrazek hero (FLUX dev)", usd: image },
  ];

  const perBlogUsd = llmInput + llmOutput + search + image;
  const perMonthUsd = perBlogUsd * a.postsPerMonth;

  return {
    perBlogUsd,
    perMonthUsd,
    perBlogPln: perBlogUsd * a.usdPln,
    perMonthPln: perMonthUsd * a.usdPln,
    breakdown,
    assumptions: a,
  };
}
