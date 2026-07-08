"use client";

import { T } from "@/locales/pl";

// Link w stopce do ponownego otwarcia ustawień cookies (RODO: zgoda musi być
// odwoływalna równie łatwo jak wyrażona).
export default function CookieSettingsButton() {
  return (
    <button
      onClick={() => window.openCookieSettings?.()}
      className="link-soft text-left text-text-muted"
    >
      {T.footer.cookieSettings}
    </button>
  );
}
