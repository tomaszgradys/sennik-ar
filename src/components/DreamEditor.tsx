"use client";

import { useState } from "react";
import type { Content } from "@/lib/types";

const FIELD = "w-full rounded-xl border border-border bg-bg-elev px-3 py-2 text-text outline-none focus:border-accent";
const LABEL = "mb-1 block text-sm font-semibold text-text";

function Area({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      <label className={LABEL}>{label}</label>
      <textarea className={FIELD} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export default function DreamEditor({ slug, phrase, content }: { slug: string; phrase: string; content: Content }) {
  const [f, setF] = useState<string>(phrase);
  const [c, setC] = useState<Content>({
    ...content,
    paragraphs: [...(content.paragraphs || [])],
    faq: (content.faq || []).map((x) => ({ ...x })),
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const set = (k: keyof Content, v: unknown) => setC((prev) => ({ ...prev, [k]: v }));

  function setPara(i: number, v: string) {
    setC((prev) => ({ ...prev, paragraphs: prev.paragraphs.map((p, j) => (j === i ? v : p)) }));
  }
  function setFaq(i: number, key: "q" | "a", v: string) {
    setC((prev) => ({ ...prev, faq: prev.faq.map((x, j) => (j === i ? { ...x, [key]: v } : x)) }));
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/panel/edit-dream/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, phrase: f, content: c }),
      });
      const d = await res.json().catch(() => ({}));
      setMsg(d.ok ? { ok: true, text: "Zapisano ✓ (strona odświeżona)" } : { ok: false, text: "Błąd zapisu: " + (d.error || "") });
    } catch {
      setMsg({ ok: false, text: "Błąd sieci" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className={LABEL}>Hasło / tytuł (od tego zależy H1 i title)</label>
        <input className={FIELD} value={f} onChange={(e) => setF(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Rodzaj gramatyczny</label>
          <select className={FIELD} value={c.gender} onChange={(e) => set("gender", e.target.value)}>
            <option value="m">m (ten)</option>
            <option value="f">f (ta)</option>
            <option value="n">n (to)</option>
            <option value="pl">pl (te)</option>
          </select>
        </div>
        <div>
          <label className={LABEL}>Miejscownik (po „o …")</label>
          <input className={FIELD} value={c.locative} onChange={(e) => set("locative", e.target.value)} />
        </div>
      </div>

      <Area label="Meta description (135-160 znaków)" value={c.metaDescription} onChange={(v) => set("metaDescription", v)} rows={2} />
      <Area label="Szybka odpowiedź (quickAnswer)" value={c.quickAnswer} onChange={(v) => set("quickAnswer", v)} />
      <Area label="Wstęp (intro)" value={c.intro} onChange={(v) => set("intro", v)} rows={2} />

      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className={LABEL + " mb-0"}>Akapity</span>
          <button type="button" onClick={() => set("paragraphs", [...c.paragraphs, ""])} className="text-sm text-accent">+ dodaj akapit</button>
        </div>
        <div className="flex flex-col gap-2">
          {c.paragraphs.map((p, i) => (
            <div key={i} className="flex gap-2">
              <textarea className={FIELD} rows={3} value={p} onChange={(e) => setPara(i, e.target.value)} />
              <button type="button" onClick={() => set("paragraphs", c.paragraphs.filter((_, j) => j !== i))} className="shrink-0 rounded-lg border border-border px-2 text-text-muted hover:text-negative">✕</button>
            </div>
          ))}
        </div>
      </div>

      <Area label="Dobre znaki (positive)" value={c.positive} onChange={(v) => set("positive", v)} />
      <Area label="Na co uważać (negative)" value={c.negative} onChange={(v) => set("negative", v)} />
      <Area label="Wskazówka (advice)" value={c.advice} onChange={(v) => set("advice", v)} />

      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className={LABEL + " mb-0"}>FAQ</span>
          <button type="button" onClick={() => set("faq", [...c.faq, { q: "", a: "" }])} className="text-sm text-accent">+ dodaj pytanie</button>
        </div>
        <div className="flex flex-col gap-3">
          {c.faq.map((x, i) => (
            <div key={i} className="rounded-xl border border-border p-3">
              <div className="mb-2 flex items-center gap-2">
                <input className={FIELD} placeholder="Pytanie" value={x.q} onChange={(e) => setFaq(i, "q", e.target.value)} />
                <button type="button" onClick={() => set("faq", c.faq.filter((_, j) => j !== i))} className="shrink-0 rounded-lg border border-border px-2 text-text-muted hover:text-negative">✕</button>
              </div>
              <textarea className={FIELD} rows={2} placeholder="Odpowiedź" value={x.a} onChange={(e) => setFaq(i, "a", e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 flex items-center gap-3 border-t border-border bg-bg-elev/95 py-3 backdrop-blur">
        <button onClick={save} disabled={busy} className="rounded-full bg-accent px-5 py-2.5 font-medium text-white disabled:opacity-60">
          {busy ? "Zapisuję…" : "Zapisz zmiany"}
        </button>
        {msg && <span className={`text-sm ${msg.ok ? "text-accent" : "text-negative"}`}>{msg.text}</span>}
      </div>
    </div>
  );
}
