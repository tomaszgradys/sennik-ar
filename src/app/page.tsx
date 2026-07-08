import type { Metadata } from "next";
import Link from "next/link";
import SearchBox from "@/components/SearchBox";
import SymbolImage from "@/components/SymbolImage";
import AdSlot from "@/components/AdSlot";
import JsonLd from "@/components/JsonLd";
import DiscoverCards from "@/components/DiscoverCards";
import MissingDreamForm from "@/components/MissingDreamForm";
import { publishedSymbols, allPublished, dreamPath } from "@/lib/dream";
import { listPosts, blogPath, heroSrcBlog } from "@/lib/blog";
import { popularSymbols } from "@/lib/daily";
import { customDreamSlugs } from "@/lib/custom";
import { categoryForName, categoryPath } from "@/lib/categories";
import { capitalize } from "@/lib/polish";
import { SITE } from "@/lib/site";
import { T } from "@/locales/pl";

const HOME_FAQ = [
  {
    q: "كيف أعرف تفسير حلمي؟",
    a: "اكتب في البحث الرمز الرئيسي من حلمك، مثل قطة أو ماء أو سنّ أو اسم شخص. يمكنك أيضًا إضافة تفصيل مثل «قطة سوداء» أو «السقوط من علوّ». سنعرض لك تفسيرًا واحدًا متماسكًا مع الجوانب الطيبة والأصعب لهذا الحلم.",
  },
  {
    q: "كيف أفهم الحلم من قاموس الأحلام؟",
    a: "الأحلام مرآة لطيفة للمشاعر ولما يجري في حياتك. نقرؤها هنا كرموز وإشارات لتأمّل هادئ ونصيحة لهذا اليوم، بروح تجمع بين علم النفس وتراث تعبير الرؤى.",
  },
  {
    q: "ماذا أفعل إذا لم يكن حلمي موجودًا؟",
    a: "سيقترح البحث أقرب المصطلحات المطابقة، وإن لم يكن الموضوع لدينا بعد فسيعرض بدائل معقولة ويحفظ استعلامك حتى نضيف المعنى الناقص.",
  },
  {
    q: "لماذا قد يعني الحلم نفسه أشياء مختلفة؟",
    a: "لأن المعنى يتوقف على السياق والمشاعر. الرمز نفسه، مرة هادئًا ومرة مقلقًا، يحمل معنى مختلفًا. لذلك ننبّه عند كل مدخل إلى كيف يغيّر شعور الحلم مغزاه.",
  },
  {
    q: "هل استخدام قاموس الأحلام مجاني؟",
    a: "نعم. تصفّح تفسير الأحلام والألوان والأرقام وأطوار القمر والمدونة مجاني بالكامل ولا يتطلب إنشاء حساب.",
  },
];

// Treści dojrzałe — wyszukiwalne, ale nie eksponowane na stronie głównej.
function isSensitive(slug: string): boolean {
  return slug === "seks" || slug.startsWith("seks-");
}

// Chip tematu (czysty, bez ikonki).
function IconChip({ slug, phrase }: { slug: string; phrase: string }) {
  return (
    <Link
      href={dreamPath(slug)}
      className="rounded-full border border-border bg-bg-soft px-3 py-1.5 text-sm text-text no-underline chip"
    >
      {phrase}
    </Link>
  );
}

// Self-referencyjny canonical strony głównej (Next doda trailing slash → https://hulm.pro/).
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  // Treści dojrzałe (np. seks) istnieją i są wyszukiwalne, ale NIE pokazujemy ich
  // na stronie głównej (popularne/przeglądaj) — świadoma decyzja.
  const symbols = publishedSymbols().filter((s) => !isSensitive(s.slug));
  const bySlug = new Map(symbols.map((s) => [s.slug, s]));
  // „أحلام شائعة" — statyczna lista najpopularniejszych snów w tej kulturze
  // (stała kolejność). Dopełniana z katalogu, gdyby któregoś zabrakło.
  const picked = popularSymbols(8)
    .map((s) => bySlug.get(s))
    .filter((s) => s != null);
  const seen = new Set(picked.map((s) => s!.slug));
  for (const s of symbols) {
    if (picked.length >= 8) break;
    if (!seen.has(s.slug)) picked.push(s);
  }
  const popular = picked.slice(0, 8);

  // Zajawka bloga — trzy najnowsze wpisy pod popularnymi snami.
  const latestPosts = listPosts().slice(0, 3);

  // Liczby do sekcji misji — ŻYWE, z faktycznej ilości w systemie: katalog + sny
  // dodane z panelu (baza). Zaokrąglone w dół dla uczciwego „ponad".
  const roundDown = (n: number, step: number) => Math.floor(n / step) * step;
  const customCount = (await customDreamSlugs()).length;
  const dreamsCount = roundDown(publishedSymbols().length + customCount, 100);
  const interpretationsCount = roundDown(allPublished().length + customCount, 1000);

  // Grupowanie po kategoriach z CSV (kolejność pojawiania).
  const cats: string[] = [];
  const byCat = new Map<string, typeof symbols>();
  for (const s of symbols) {
    if (!byCat.has(s.category)) {
      byCat.set(s.category, []);
      cats.push(s.category);
    }
    byCat.get(s.category)!.push(s);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: SITE.name,
        alternateName: SITE.domain,
        url: SITE.url,
        logo: `${SITE.url}/brand/hulm-icon-512.png`,
      },
      {
        "@type": "WebSite",
        name: SITE.name,
        alternateName: SITE.domain,
        url: SITE.url,
        inLanguage: "ar",
      },
    ],
  };

  return (
    <div className="flex flex-col gap-14">
      <JsonLd data={jsonLd} />
      {/* HERO — zwarty: tytuł + wyszukiwarka u góry, treść (popularne sny) od razu poniżej. */}
      <section className="pt-4 text-center sm:pt-6">
        <h1 className="mx-auto max-w-2xl text-balance text-[1.75rem] font-bold leading-tight tracking-tight text-text sm:text-5xl sm:leading-tight">
          {T.hero.title}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-text-muted sm:mt-4 sm:max-w-xl sm:text-base">
          {T.hero.lead}
        </p>
        <div className="mx-auto mt-6 w-full max-w-xl sm:mt-7">
          <SearchBox autoFocus />
        </div>
        <div className="mx-auto mt-4 w-full max-w-xl">
          <MissingDreamForm />
        </div>
      </section>

      {popular.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
              {T.sections.popular}
            </h2>
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {popular.map((s) => (
              <Link
                key={s.slug}
                href={dreamPath(s.slug)}
                className="group overflow-hidden rounded-2xl border border-border bg-bg-elev no-underline shadow-sm card"
              >
                <SymbolImage symbolSlug={s.slug} label={s.phrase} className="h-28 w-full" />
                <div className="p-3">
                  <div className="font-semibold text-text">{capitalize(s.phrase)}</div>
                  <div className="mt-0.5 text-sm text-text-muted">{s.category}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {latestPosts.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
              من مدونتنا
            </h2>
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {latestPosts.map((p) => {
              const img = heroSrcBlog(p.slug, p.hero);
              return (
                <Link
                  key={p.slug}
                  href={blogPath(p.slug)}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-bg-elev no-underline shadow-sm card"
                >
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img}
                      alt={p.title}
                      width={480}
                      height={360}
                      loading="lazy"
                      decoding="async"
                      className="h-36 w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <span aria-hidden className="h-36 w-full bg-bg-soft" />
                  )}
                  <div className="flex flex-1 flex-col p-4">
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent">
                      {p.category}
                    </div>
                    <h3 className="!font-sans text-lg font-bold leading-snug text-text sm:text-xl">{p.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm text-text-muted">{p.excerpt}</p>
                    <div className="mt-auto pt-3 text-xs text-text-muted">
                      {p.readMinutes} دقيقة قراءة
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="mt-4 text-center">
            <Link href="/blog/" className="link-soft text-sm">
              شاهد كل المقالات ←
            </Link>
          </div>
        </section>
      )}

      <AdSlot slot="homeMiddle" />

      <div>
        <DiscoverCards />
      </div>

      <section>
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">اكتشف المعاني</h2>
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link href="/kolory/" className="group flex items-center gap-4 rounded-2xl border border-border bg-bg-elev p-4 no-underline shadow-sm card">
            <span aria-hidden className="flex shrink-0 items-center gap-1.5">
              {["#C0392B", "#2E5A88", "#3E7C5A", "#C9A44A"].map((h) => (
                <span
                  key={h}
                  className="h-6 w-6 rounded-full transition-transform duration-500 group-hover:scale-110"
                  style={{
                    background: `radial-gradient(circle at 32% 28%, color-mix(in srgb, ${h} 62%, #fff), ${h} 52%, color-mix(in srgb, ${h} 60%, #000))`,
                    boxShadow: `0 0 10px -3px ${h}, inset 0 1px 2px rgba(255,255,255,0.35)`,
                  }}
                />
              ))}
            </span>
            <div>
              <div className="font-semibold text-text">معاني الألوان</div>
              <div className="mt-1 text-sm text-text-muted">رمزية الألوان في المشاعر والأحلام</div>
            </div>
          </Link>
          <Link href="/liczby/" className="group flex items-center gap-4 rounded-2xl border border-border bg-bg-elev p-4 no-underline shadow-sm card">
            <span aria-hidden className="number-tile flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
              <span className="num font-display text-2xl font-semibold">7</span>
            </span>
            <div>
              <div className="font-semibold text-text">معاني الأرقام</div>
              <div className="mt-1 text-sm text-text-muted">ماذا ترمز الأرقام وماذا تعني في الأحلام</div>
            </div>
          </Link>
        </div>
      </section>

      {/* Przeglądaj tematy — kompaktowo: kategorie zwinięte, rozwijasz co chcesz.
          Wszystkie linki są w HTML (SEO nie cierpi), a strona jest krótka. */}
      {cats.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
              {T.sections.browse}
            </h2>
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="flex flex-col gap-2">
            {cats.map((cat, i) => {
              const items = byCat.get(cat)!;
              return (
                <details
                  key={cat}
                  open={i === 0}
                  className="group rounded-xl border border-border bg-bg-elev/60"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:content-none">
                    <span className="font-semibold capitalize text-text">{cat}</span>
                    <span className="flex items-center gap-2 text-sm text-text-muted">
                      {items.length}
                      <span className="inline-block transition-transform group-open:rotate-90 text-accent">
                        ›
                      </span>
                    </span>
                  </summary>
                  <div className="px-4 pb-4">
                    {/* Tylko wybór na kategorię — reszta przez wyszukiwarkę.
                        Zbyt wiele linków na stronie szkodzi SEO i rozdyma HTML. */}
                    <div className="flex flex-wrap gap-2">
                      {items.slice(0, 12).map((s) => (
                        <IconChip key={s.slug} slug={s.slug} phrase={s.phrase} />
                      ))}
                    </div>
                    {categoryForName(cat) && (
                      <Link
                        href={categoryPath(categoryForName(cat)!.slug)}
                        className="link-soft mt-3 inline-block text-sm text-accent"
                      >
                        شاهد كل أحلام فئة «{cat}» ({items.length}) ←
                      </Link>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">رسالتنا</h2>
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="rounded-2xl border border-accent/30 bg-accent-soft/50 p-6 text-center sm:p-8">
          <h3 className="text-balance text-2xl font-bold text-text sm:text-3xl">
            نبني أفضل قاعدة أحلام في العالم
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-text-muted">
            لدينا الآن أكثر من{" "}
            <strong className="text-text">{interpretationsCount.toLocaleString("ar-EG")}</strong>{" "}
            تفسير حلم جاهز، لأن كل موضوع من أكثر من{" "}
            <strong className="text-text">{dreamsCount.toLocaleString("ar-EG")}</strong>{" "}
            موضوع نفصّله إلى عشرات التنويعات الدقيقة، مثل «كلب أسود» أو «ثعبان في الماء». إضافة إلى معاني الألوان والأرقام. وما زلنا نضيف المزيد.
          </p>
          <p className="mx-auto mt-3 max-w-xl text-text-muted">
            هدفنا أكبر قاموس أحلام وأكثرها فائدة: مكان يجد فيه كل حلم تفسيرًا واضحًا هادئًا. دوّن أحلامك في دفتر خاص وساعدنا على جمعها كلها.
          </p>
        </div>
      </section>

      <section className="prose mx-auto text-text">
        <h2>تفسير الأحلام أونلاين — كيف تقرأ معنى حلمك</h2>
        <p>
          قاموس الأحلام دليل هادئ إلى الرموز التي تأتينا ليلًا. اكتب في البحث ما تتذكره من حلمك،
          سواء كان حيوانًا أو شخصًا أو شيئًا أو لونًا أو شعورًا، فنعرض لك تفسيرًا واحدًا واضحًا
          مكتوبًا بلغة دافئة كأنها من كتاب قديم. بلا ترهيب وبلا مصطلحات معقّدة.
        </p>
        <p>
          نقرأ كل حلم في ثلاث طبقات: ما يعنيه الرمز غالبًا، كيف يغيّره الشعور الذي أحسست به،
          وأيّ نصيحة لطيفة قد تُستخلص منه لهذا اليوم. الموضوع نفسه قد يعني شيئًا حين يكون هادئًا،
          وشيئًا آخر حين يكون مقلقًا. لذلك نقدّم تفسيرًا واحدًا واضحًا ونقطة انطلاق لتأمّلك الخاص.
        </p>
        <p>
          إلى جانب آلاف المصطلحات وتركيباتها، تجد لدينا معاني{" "}
          <Link href="/kolory/">الألوان</Link> و<Link href="/liczby/">الأرقام</Link>،
          و<Link href="/faza-ksiezyca/">طور القمر</Link> الحالي،{" "}
          و<Link href="/tafsir-ibn-sirin/">تفسير ابن سيرين</Link> و
          <Link href="/blog/">المدونة</Link> بطرائف
          عن الأحلام. كل ذلك لتفهم بهدوء ما يقوله لك خيال الليل.
        </p>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">أسئلة شائعة</h2>
          <span className="h-px flex-1 bg-border" />
        </div>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: HOME_FAQ.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }}
        />
        <div className="flex flex-col gap-3">
          {HOME_FAQ.map((f, i) => (
            <details key={i} className="group rounded-xl border border-border bg-bg-elev p-4">
              <summary className="cursor-pointer list-none font-semibold text-text marker:content-none">
                <span className="mr-2 inline-block text-accent transition-transform group-open:rotate-90">›</span>
                {f.q}
              </summary>
              <p className="mt-2 mb-0 pl-5 font-serif text-text">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
