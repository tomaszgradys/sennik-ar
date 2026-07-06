// Generuje obrazki FLUX per RODZIC (reuse dla wszystkich wariantów). Prompt bierze
// z pola content[parent].imagePrompt (angielski opis sceny od AI); fallback = fraza.
// Aktualizuje _images.json (rodzice z obrazkiem). Potem: node scripts/og-cards.mjs
// Użycie: node scripts/images.mjs [--limit N]

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT_DIR = join(ROOT, "src", "data", "content");
const IMG_DIR = join(ROOT, "public", "dreams");
const CATALOG = JSON.parse(readFileSync(join(ROOT, "src", "data", "catalog.json"), "utf8"));
const CONCURRENCY = 4;
const STYLE =
  "soft moonlight, warm parchment tones, subtle magical glow, delicate ink and watercolor texture, cozy old dream dictionary atmosphere, elegant composition, gentle shadows, muted beige cream and dusty blue accents, no text, no watermark";

function loadEnv() {
  const f = join(ROOT, ".env.local");
  if (!existsSync(f)) return;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv();
const FAL = process.env.FAL_KEY;
if (!FAL) throw new Error("Brak FAL_KEY");
mkdirSync(IMG_DIR, { recursive: true });

const parentPhrase = new Map(CATALOG.filter((e) => e.type === "symbol").map((e) => [e.slug, e.phrase]));
// Angielskie opisy scen (najlepsze dla FLUX) — priorytet nad polską frazą.
const promptsFile = join(CONTENT_DIR, "_imageprompts.json");
const EN = existsSync(promptsFile) ? JSON.parse(readFileSync(promptsFile, "utf8")) : {};
const FORCE = process.argv.includes("--force");

// --only <plik.json> — ogranicz generację do konkretnych rodziców (lista slugów).
const onlyArg = process.argv.indexOf("--only");
const ONLY =
  onlyArg >= 0
    ? new Set(JSON.parse(readFileSync(process.argv[onlyArg + 1], "utf8")))
    : null;

// Zbierz rodziców z opublikowaną treścią + najlepszy dostępny prompt.
const jobs = [];
for (const f of readdirSync(CONTENT_DIR)) {
  if (!f.endsWith(".json") || f.startsWith("_")) continue;
  const parent = f.replace(/\.json$/, "");
  if (ONLY && !ONLY.has(parent)) continue;
  if (!FORCE && existsSync(join(IMG_DIR, `${parent}.jpg`))) continue;
  const shard = JSON.parse(readFileSync(join(CONTENT_DIR, f), "utf8"));
  const prompt =
    EN[parent] ||
    shard[parent]?.imagePrompt ||
    `dreamlike symbolic illustration of ${parentPhrase.get(parent) || parent}`;
  jobs.push({ parent, prompt });
}

const limitArg = process.argv.indexOf("--limit");
const jobList = limitArg >= 0 ? jobs.slice(0, Number(process.argv[limitArg + 1])) : jobs;
console.log(`Obrazki do wygenerowania: ${jobList.length} (rodziców bez obrazka).`);

async function gen(job) {
  const res = await fetch("https://fal.run/fal-ai/flux/dev", {
    method: "POST",
    headers: { Authorization: `Key ${FAL}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: `Dreamy fairytale book illustration of ${job.prompt}, ${STYLE}`,
      image_size: "landscape_4_3",
      num_images: 1,
    }),
  });
  if (!res.ok) throw new Error(`fal ${res.status}: ${(await res.text()).slice(0, 120)}`);
  const data = await res.json();
  const img = await fetch(data.images[0].url);
  writeFileSync(join(IMG_DIR, `${job.parent}.jpg`), Buffer.from(await img.arrayBuffer()));
}

async function pool(items, size, worker) {
  const q = [...items];
  let ok = 0,
    fail = 0;
  async function next() {
    while (q.length) {
      const job = q.shift();
      try {
        await worker(job);
        ok++;
        if (ok % 25 === 0) console.log(`  …${ok}/${items.length}`);
      } catch (e) {
        fail++;
        console.log(`  ✗ ${job.parent}: ${e.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: size }, next));
  return { ok, fail };
}

const { ok, fail } = await pool(jobList, CONCURRENCY, gen);

// Zaktualizuj _images.json (rodzice z obrazkiem).
const images = readdirSync(IMG_DIR)
  .filter((f) => f.endsWith(".jpg"))
  .map((f) => f.replace(/\.jpg$/, ""));
writeFileSync(join(CONTENT_DIR, "_images.json"), JSON.stringify(images));
console.log(`Gotowe: ${ok} ok, ${fail} błędów. Obrazków łącznie: ${images.length}.`);
console.log("Następnie: node scripts/og-cards.mjs && npm run build");
