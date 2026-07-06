"use client";

import { useState } from "react";
import Link from "next/link";

// „Nie znalazłeś snu?" — użytkownik opisuje sen, którego nie ma; leci do panelu admina.
export default function MissingDreamForm() {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await fetch("/api/submit/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body, email: email || null }),
    });
    setBusy(false);
    if (res.ok) setDone(true);
    else {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "حدث خطأ ما.");
    }
  }

  if (done) {
    return (
      <p className="text-center text-sm text-positive">
        شكرًا لك! سنهتم بهذا الحلم ونضيف له تفسيرًا. 🌙
      </p>
    );
  }

  if (!open) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-xs text-text-muted sm:text-sm">
        <span>
          لم تجده؟{" "}
          <button onClick={() => setOpen(true)} className="link-soft text-accent">
            صف حلمك ←
          </button>
        </span>
        <span aria-hidden className="opacity-40">·</span>
        <Link href="/moj-dziennik?new=1" rel="nofollow" className="link-soft text-accent">
          احفظ الحلم في الدفتر ←
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto flex max-w-xl flex-col gap-3 rounded-2xl border border-border bg-bg-elev p-4">
      <label className="text-sm font-semibold text-text">صف حلمك</label>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        autoFocus
        placeholder="مثال: حلمت ببيت على البحر أضيّع فيه المفاتيح…"
        className="rounded-xl border border-border bg-bg-soft px-3 py-2 text-text outline-none focus:border-accent"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="البريد الإلكتروني (اختياري، سنعلمك)"
        className="rounded-xl border border-border bg-bg-soft px-3 py-2 text-sm text-text outline-none focus:border-accent"
      />
      {err && <p className="m-0 text-sm text-negative">{err}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {busy ? "جارٍ الإرسال…" : "إرسال"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-border px-4 py-2 text-sm text-text-muted"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}
