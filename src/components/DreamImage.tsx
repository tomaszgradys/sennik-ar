import { slugify } from "@/lib/polish";
import { T } from "@/locales/pl";

// Deterministyczna, „oniryczna" grafika generowana z sluga — spójna dla danego
// symbolu (ta sama dla „pies", „czarny pies" itd., zgodnie z logiką reuse).
// Docelowo w tym miejscu wyświetlimy obraz wygenerowany przez FLUX i zapisany
// w bazie/Blob — sygnatura komponentu się nie zmieni.
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export default function DreamImage({
  seed,
  label,
  className = "",
  priority = false,
}: {
  seed: string; // slug symbolu (nie kombinacji) — dla wspólnej grafiki
  label: string;
  className?: string;
  priority?: boolean;
}) {
  const h = hash(slugify(seed));
  const hue1 = h % 360;
  const hue2 = (hue1 + 40 + ((h >> 8) % 60)) % 360;
  const cx = 20 + ((h >> 4) % 60);
  const cy = 20 + ((h >> 12) % 50);
  const id = `g-${slugify(seed)}`;

  return (
    <svg
      viewBox="0 0 400 300"
      role="img"
      aria-label={`${T.dream.imageAlt} ${label}`}
      className={className}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id={`${id}-a`} cx={`${cx}%`} cy={`${cy}%`} r="75%">
          <stop offset="0%" stopColor={`hsl(${hue1} 70% 62%)`} />
          <stop offset="100%" stopColor={`hsl(${hue2} 55% 30%)`} />
        </radialGradient>
        <radialGradient id={`${id}-b`} cx={`${100 - cx}%`} cy={`${90 - cy}%`} r="55%">
          <stop offset="0%" stopColor={`hsl(${hue2} 80% 70%)`} stopOpacity="0.7" />
          <stop offset="100%" stopColor={`hsl(${hue1} 60% 40%)`} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#${id}-a)`} />
      <rect width="400" height="300" fill={`url(#${id}-b)`} />
      <circle cx={cx * 4} cy={cy * 3} r="70" fill="#fff" opacity="0.08" />
      <circle cx={400 - cx * 3} cy={300 - cy * 2} r="110" fill="#000" opacity="0.06" />
      {priority ? null : null}
    </svg>
  );
}
