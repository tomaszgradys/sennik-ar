// Decyduje, czy TERAZ opublikować wpis, tak by wychodził co N dni (ustawiane w panelu
// admina, czytane z publicznego /api/blog-config) o LOSOWEJ godzinie w oknie 09:00-18:00
// (Europe/Warsaw). Wołany co godzinę przez GitHub Action; wypisuje "proceed=true|false"
// do $GITHUB_OUTPUT. Ręczne uruchomienie (workflow_dispatch) zawsze publikuje.
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const INDEX = join(ROOT, "src", "data", "blog", "_index.json");
const END_HOUR = 18; // koniec okna (włącznie z tą godziną jako „ostatnia szansa")
// TODO: podmienić na https://hulm.pro/api/blog-config po podpięciu domeny.
const CONFIG_URL = "https://sennik-ar.vercel.app/api/blog-config";

function warsaw(now = new Date()) {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false,
  }).formatToParts(now);
  const g = (t) => p.find((x) => x.type === t).value;
  return { date: `${g("year")}-${g("month")}-${g("day")}`, hour: Number(g("hour")) };
}

// Różnica w dniach między dwiema datami "YYYY-MM-DD" (b - a).
function daysBetween(a, b) {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

// Częstotliwość z panelu (co ile dni). Fallback: codziennie (1), gdy endpoint niedostępny.
async function fetchEveryDays() {
  try {
    const r = await fetch(CONFIG_URL, { headers: { "cache-control": "no-cache" } });
    if (!r.ok) return 1;
    const d = await r.json();
    const n = Math.round(Number(d.everyDays));
    return Number.isFinite(n) && n >= 1 && n <= 30 ? n : 1;
  } catch {
    return 1;
  }
}

const manual = process.env.EVENT === "workflow_dispatch";
const { date: today, hour } = warsaw();

// Data ostatniego wpisu (najnowszy w indeksie).
let lastDate = null;
if (existsSync(INDEX)) {
  const idx = JSON.parse(readFileSync(INDEX, "utf8"));
  lastDate = idx[0]?.date ?? null;
}
const postedToday = lastDate === today;
const everyDays = await fetchEveryDays();
const daysSince = lastDate ? daysBetween(lastDate, today) : Infinity;
const due = daysSince >= everyDays; // minął odstęp od ostatniej publikacji?

let proceed;
if (manual) proceed = true;
else if (postedToday || !due) proceed = false;
else {
  // Dzień „na publikację": rozkładamy losowo w oknie 09-18. Ostatnia godzina -> na pewno.
  const hoursLeft = Math.max(1, END_HOUR - hour);
  proceed = hour >= END_HOUR - 1 || Math.random() < 1 / hoursLeft;
}

console.log(`proceed=${proceed}`);
console.error(`[gate] manual=${manual} today=${today} hour=${hour} last=${lastDate} everyDays=${everyDays} daysSince=${daysSince} due=${due} postedToday=${postedToday} -> ${proceed}`);
