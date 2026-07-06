"use client";

import { useEffect, useState } from "react";
import { APP_PROMO } from "@/lib/monetization";
import { T } from "@/locales/pl";

const DISMISS_KEY = "sennik-app-promo-dismissed";

// Zachęta do pobrania aplikacji mobilnej. Ukryta, dopóki APP_PROMO.enabled=false
// (włączymy, gdy apka trafi do sklepów). Po zamknięciu nie wraca.
export default function AppPromoBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!APP_PROMO.enabled) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-bg-elev p-3 shadow-lg">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-semibold text-text">{T.appPromo.title}</div>
          <div className="text-sm text-text-muted">{T.appPromo.lead}</div>
        </div>
        <div className="flex items-center gap-2">
          {APP_PROMO.androidUrl && (
            <a
              href={APP_PROMO.androidUrl}
              className="rounded-full bg-accent px-4 py-2 text-sm text-white no-underline"
            >
              {T.appPromo.android}
            </a>
          )}
          {APP_PROMO.iosUrl && (
            <a
              href={APP_PROMO.iosUrl}
              className="rounded-full bg-accent px-4 py-2 text-sm text-white no-underline"
            >
              {T.appPromo.ios}
            </a>
          )}
          <button
            onClick={() => {
              localStorage.setItem(DISMISS_KEY, "1");
              setVisible(false);
            }}
            aria-label={T.appPromo.dismiss}
            className="rounded-full border border-border px-3 py-2 text-sm text-text-muted"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
