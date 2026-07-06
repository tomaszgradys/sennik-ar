import type { Metadata } from "next";
import Link from "next/link";
import { isAdmin } from "@/lib/admin";
import { resolveDream } from "@/lib/resolve";
import PanelLogin from "@/components/PanelLogin";
import DreamEditor from "@/components/DreamEditor";

export const metadata: Metadata = {
  title: { absolute: "Edycja snu — Panel" },
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function EditDreamPage({ params }: { params: Promise<{ slug: string }> }) {
  if (!(await isAdmin())) return <PanelLogin />;
  const { slug } = await params;
  const entry = await resolveDream(slug);

  if (!entry) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <Link href="/panel" className="link-soft text-sm">← Panel</Link>
        <h1 className="mt-3 text-2xl font-bold text-text">Nie znaleziono snu</h1>
        <p className="mt-2 text-text-muted">
          Nie ma snu o slugu „{slug}". Sprawdź pisownię (bez polskich znaków, myślniki zamiast spacji).
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-6">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/panel" className="link-soft text-sm">← Panel</Link>
        <a href={`/sen/${slug}/`} target="_blank" rel="noreferrer" className="link-soft text-sm">Zobacz stronę ↗</a>
      </div>
      <h1 className="mb-1 text-2xl font-bold text-text">Edycja snu</h1>
      <p className="mb-6 text-sm text-text-muted">slug: <code>{slug}</code></p>
      <DreamEditor slug={slug} phrase={entry.phrase} content={entry.content} />
    </div>
  );
}
