import type { Metadata } from "next";
import { moonPhase, moonIllumination, dailyMoonTip } from "@/lib/moon";
import { SITE } from "@/lib/site";
import AdSlot from "@/components/AdSlot";

export const revalidate = 3600;

const title = `طور القمر اليوم — كيف يؤثّر في يومك — ${SITE.name}`;
const description =
  "اعرف طور القمر اليوم وماذا يعني ليومك: هل هو وقت مناسب للأمور الجديدة أم للراحة أم للترتيب. بيانات فلكية حقيقية.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: `${SITE.url}/faza-ksiezyca/` },
  openGraph: { title, description, url: `${SITE.url}/faza-ksiezyca/` },
};

export default function MoonPage() {
  const now = new Date();
  const phase = moonPhase(now);
  const illum = moonIllumination(now);
  const dateLabel = now.toLocaleDateString("ar-EG", {
    timeZone: "Asia/Riyadh",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // الأيام الـ14 القادمة.
  const upcoming = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now.getTime() + (i + 1) * 86400000);
    return { date: d, phase: moonPhase(d) };
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
          طور القمر اليوم
        </h1>
        <p className="mt-1 text-text-muted">{dateLabel}</p>
      </header>

      <section className="rounded-2xl border border-border bg-bg-elev p-6 text-center shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/moon/${phase.slug}.jpg`}
          alt={`طور القمر: ${phase.name}`}
          width={1024}
          height={1024}
          fetchPriority="high"
          className="mx-auto aspect-square w-48 rounded-2xl border border-border object-cover shadow-sm sm:w-56"
        />
        <h2 className="mt-4 text-2xl font-bold text-text">{phase.name}</h2>
        <p className="text-sm text-text-muted">
          إضاءة القرص: {illum}%
        </p>
        <p className="mx-auto mt-3 max-w-md text-text">{phase.starting}</p>
      </section>

      <aside className="rounded-xl border border-border bg-bg-soft p-4">
        <div className="mb-1 text-sm font-semibold text-text-muted">
          نصيحة اليوم
        </div>
        <p className="m-0 text-text">{dailyMoonTip(now)}</p>
      </aside>

      <AdSlot slot="inArticle" />

      <section>
        <h2 className="mb-3 text-lg font-semibold text-text">
          الأيام الـ14 القادمة
        </h2>
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {upcoming.map(({ date, phase: p }) => (
            <li
              key={date.toISOString()}
              className="flex items-center justify-between rounded-lg border border-border bg-bg-elev px-3 py-2"
            >
              <span className="text-sm text-text">
                {date.toLocaleDateString("ar-EG", {
                  timeZone: "Asia/Riyadh",
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </span>
              <span className="text-sm text-text-muted">
                {p.emoji} {p.name}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
