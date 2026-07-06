import type { CSSProperties } from "react";

// Gwiazdki w tle, które co jakiś czas delikatnie błyskają. Pozycje stałe (deterministyczne).
// BASE: widoczne zawsze (na telefonie dają zauważalną gęstość w małym obszarze).
// DESKTOP: dodatkowe, tylko od md w górę (szeroki ekran „rozrzedza" gwiazdy, więc dokładamy
// więcej — głównie w wolnych marginesach bocznych — żeby błyski były zauważalne).
type Star = { top: string; left: string; dur: string; delay: string; max: number; size: number };

const BASE: Star[] = [
  { top: "16%", left: "7%", dur: "8s", delay: "0s", max: 0.9, size: 3 },
  { top: "30%", left: "90%", dur: "9s", delay: "1.2s", max: 0.8, size: 2 },
  { top: "52%", left: "5%", dur: "8.5s", delay: "2.4s", max: 0.85, size: 3 },
  { top: "12%", left: "62%", dur: "9.5s", delay: "3.5s", max: 0.7, size: 2 },
  { top: "68%", left: "93%", dur: "8s", delay: "4.6s", max: 0.9, size: 3 },
  { top: "78%", left: "12%", dur: "9s", delay: "5.6s", max: 0.75, size: 2 },
  { top: "40%", left: "48%", dur: "10s", delay: "6.4s", max: 0.65, size: 2 },
  { top: "88%", left: "70%", dur: "8.5s", delay: "7.2s", max: 0.8, size: 3 },
];

// Tylko desktop (md+). Szeroki ekran „rozrzedza" gwiazdy, więc dokładamy ich sporo
// (i w marginesach bocznych, i nad kolumną treści), żeby błyski były wyraźnie
// zauważalne. Mobile (BASE) zostaje bez zmian — ta sama liczba i częstotliwość migania.
const DESKTOP: Star[] = [
  { top: "8%", left: "18%", dur: "7.5s", delay: "0.5s", max: 0.85, size: 2 },
  { top: "22%", left: "3%", dur: "8s", delay: "1.7s", max: 0.9, size: 3 },
  { top: "35%", left: "96%", dur: "7s", delay: "2.9s", max: 0.8, size: 2 },
  { top: "18%", left: "82%", dur: "9s", delay: "3.9s", max: 0.75, size: 2 },
  { top: "46%", left: "10%", dur: "7.5s", delay: "0.9s", max: 0.9, size: 3 },
  { top: "58%", left: "88%", dur: "8s", delay: "2.1s", max: 0.85, size: 2 },
  { top: "62%", left: "2%", dur: "9s", delay: "4.3s", max: 0.8, size: 3 },
  { top: "74%", left: "97%", dur: "7s", delay: "5.1s", max: 0.9, size: 2 },
  { top: "84%", left: "22%", dur: "8.5s", delay: "3.2s", max: 0.75, size: 2 },
  { top: "92%", left: "40%", dur: "8s", delay: "6.1s", max: 0.7, size: 2 },
  { top: "6%", left: "44%", dur: "9.5s", delay: "1.3s", max: 0.65, size: 2 },
  { top: "50%", left: "94%", dur: "7.5s", delay: "6.8s", max: 0.85, size: 3 },
  { top: "28%", left: "14%", dur: "8s", delay: "4.9s", max: 0.8, size: 2 },
  { top: "70%", left: "16%", dur: "9s", delay: "2.5s", max: 0.9, size: 3 },
  { top: "12%", left: "34%", dur: "8.5s", delay: "5.7s", max: 0.7, size: 2 },
  { top: "94%", left: "84%", dur: "7.5s", delay: "0.2s", max: 0.85, size: 2 },
  // + zagęszczenie desktopu (żeby na szerokim ekranie miganie było zauważalne)
  { top: "4%", left: "10%", dur: "7s", delay: "2.2s", max: 0.85, size: 2 },
  { top: "38%", left: "78%", dur: "8s", delay: "5.3s", max: 0.8, size: 2 },
  { top: "26%", left: "52%", dur: "7.5s", delay: "3.1s", max: 0.7, size: 2 },
  { top: "54%", left: "30%", dur: "9s", delay: "1.1s", max: 0.75, size: 2 },
  { top: "66%", left: "62%", dur: "8s", delay: "4.7s", max: 0.8, size: 2 },
  { top: "80%", left: "48%", dur: "7.5s", delay: "6.5s", max: 0.7, size: 2 },
  { top: "10%", left: "72%", dur: "8.5s", delay: "0.7s", max: 0.85, size: 3 },
  { top: "44%", left: "66%", dur: "7s", delay: "3.8s", max: 0.75, size: 2 },
  { top: "20%", left: "26%", dur: "9s", delay: "5.9s", max: 0.8, size: 2 },
  { top: "88%", left: "8%", dur: "8s", delay: "2.7s", max: 0.9, size: 3 },
  { top: "58%", left: "12%", dur: "7.5s", delay: "6.2s", max: 0.8, size: 2 },
  { top: "72%", left: "86%", dur: "8.5s", delay: "1.9s", max: 0.75, size: 2 },
  { top: "32%", left: "38%", dur: "9s", delay: "4.1s", max: 0.65, size: 2 },
  { top: "48%", left: "80%", dur: "7s", delay: "0.4s", max: 0.85, size: 2 },
  { top: "16%", left: "50%", dur: "8s", delay: "5.5s", max: 0.7, size: 2 },
  { top: "82%", left: "60%", dur: "8.5s", delay: "3.4s", max: 0.8, size: 2 },
  { top: "90%", left: "30%", dur: "7.5s", delay: "1.5s", max: 0.75, size: 2 },
  { top: "6%", left: "88%", dur: "9s", delay: "6.9s", max: 0.85, size: 3 },
];

function starStyle(s: Star): CSSProperties {
  return {
    top: s.top,
    left: s.left,
    width: s.size,
    height: s.size,
    "--tw-dur": s.dur,
    "--tw-delay": s.delay,
    "--tw-max": s.max,
  } as CSSProperties;
}

export default function Twinkles() {
  return (
    <div className="twinkles" aria-hidden>
      {BASE.map((s, i) => (
        <span key={`b${i}`} className="twinkle" style={starStyle(s)} />
      ))}
      {DESKTOP.map((s, i) => (
        <span key={`d${i}`} className="twinkle hidden md:block" style={starStyle(s)} />
      ))}
    </div>
  );
}
