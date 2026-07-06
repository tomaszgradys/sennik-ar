import { LEGAL } from "@/lib/site";

// Wspólny układ stron prawnych: tytuł, data aktualizacji, czytelna kolumna tekstu.
export default function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-text-muted">
        آخر تحديث: {LEGAL.lastUpdated}
      </p>
      {intro && <p className="mt-4 text-text-muted">{intro}</p>}
      <div className="legal mt-8 text-text">{children}</div>
    </article>
  );
}
