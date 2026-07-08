"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CONSENT_KEY, type Consent } from "@/lib/consent";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    openCookieSettings?: () => void;
  }
}

function applyConsent(c: Consent) {
  window.gtag?.("consent", "update", {
    ad_storage: c.marketing ? "granted" : "denied",
    ad_user_data: c.marketing ? "granted" : "denied",
    ad_personalization: c.marketing ? "granted" : "denied",
    analytics_storage: c.analytics ? "granted" : "denied",
  });
}

export default function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);

  useEffect(() => {
    // Pokaż baner tylko, gdy brak zapisanego wyboru.
    if (!localStorage.getItem(CONSENT_KEY)) setOpen(true);
    // Umożliw ponowne otwarcie z linku w stopce.
    window.openCookieSettings = () => {
      setCustomize(true);
      setOpen(true);
    };
  }, []);

  function save(c: Consent) {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(c));
    applyConsent(c);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-bg-elev/95 backdrop-blur">
      <div className="mx-auto max-w-3xl px-4 py-4 text-center text-sm text-text">
        <p className="m-0">
          نستخدم ملفات تعريف الارتباط (cookies) ليعمل الموقع بشكل صحيح، وبموافقتك أيضًا
          للإحصاءات والإعلانات. التفاصيل في{" "}
          <Link href="/polityka-prywatnosci/" className="link-soft">
            سياسة الخصوصية
          </Link>
          .
        </p>

        {customize && (
          <div className="mt-3 flex flex-col gap-2 rounded-lg border border-border bg-bg-soft p-3">
            <label className="flex items-center gap-2 text-text-muted">
              <input type="checkbox" checked disabled />
              ضرورية (مفعّلة دائمًا)
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
              />
              الإحصاءات (Google Analytics)
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
              />
              الإعلانات (محتوى مخصّص)
            </label>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => save({ analytics: false, marketing: false, ts: Date.now() })}
            className="rounded-full border border-border px-4 py-2 text-sm text-text"
          >
            الضرورية فقط
          </button>
          <button
            onClick={() => save({ analytics: true, marketing: true, ts: Date.now() })}
            className="dream-save dream-save--calm inline-flex items-center px-5 py-2 text-sm font-semibold"
          >
            أوافق على الكل
          </button>
          {customize ? (
            <button
              onClick={() => save({ analytics, marketing, ts: Date.now() })}
              className="rounded-full border border-accent px-4 py-2 text-sm text-accent"
            >
              حفظ الاختيار
            </button>
          ) : (
            <button
              onClick={() => setCustomize(true)}
              className="rounded-full border border-border px-4 py-2 text-sm text-text-muted"
            >
              الإعدادات
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
