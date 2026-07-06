"use client";

import { useEffect } from "react";

// Beacon zliczający wejście na artykuł bloga (raz na wczytanie strony). Nie blokuje
// renderu, nie wysyła nic wrażliwego — tylko slug artykułu.
export default function TrackView({ slug }: { slug: string }) {
  useEffect(() => {
    const body = JSON.stringify({ slug });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/track-view/", new Blob([body], { type: "application/json" }));
      } else {
        fetch("/api/track-view/", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true });
      }
    } catch {
      /* ignore */
    }
  }, [slug]);
  return null;
}
