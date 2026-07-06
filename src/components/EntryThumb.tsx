"use client";

import { useState } from "react";
import DreamImage from "./DreamImage";

// Miniatura wpisu w dzienniku: prawdziwa ilustracja snu (WebP), a gdy jej nie ma
// (albo to własny sen bez symbolu) — deterministyczna, oniryczna grafika SVG.
// `src` to gotowy URL rozwiązany serwerowo (z reuse rodzica); klientowa dla fallbacku.
export default function EntryThumb({
  src,
  slug,
  title,
  className = "",
}: {
  src: string | null;
  slug: string | null;
  title: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- lokalny plik, zoptymalizowany przy generacji
      <img
        src={src}
        alt=""
        width={512}
        height={384}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }
  return <DreamImage seed={slug || title} label={title} className={`h-full w-full object-cover ${className}`} />;
}
