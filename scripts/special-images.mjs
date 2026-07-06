// Obrazki dla znaków zodiaku (12) i faz Księżyca (8) — FLUX, kwadrat 1024x1024
// (wyższa rozdzielczość, ładne na dużym wyświetlaniu). Zapis: public/zodiac, public/moon.
// Uruchom: node scripts/special-images.mjs

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
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

const ZODIAC_STYLE =
  "dreamy celestial illustration, glowing golden constellation lines and soft stars, deep night sky in navy and violet, subtle magical glow, elegant symbolic, muted gold and dusty blue accents, no text, no watermark";
const MOON_STYLE =
  "dreamy fairytale illustration, soft moonlight, warm parchment and dusty blue night sky, delicate watercolor and ink texture, subtle magical glow, gentle stars, muted cream gold and blue, no text, no watermark";

const ZODIAC = {
  baran: "a majestic ram with large curled horns",
  byk: "a powerful bull with strong horns",
  blizneta: "two twin figures side by side",
  rak: "a crab with raised claws",
  lew: "a proud lion with a flowing mane",
  panna: "a graceful maiden holding wheat",
  waga: "balanced golden scales",
  skorpion: "a scorpion with a raised curved tail",
  strzelec: "a centaur archer drawing a bow and arrow",
  koziorozec: "a sea-goat with horns and a fish tail",
  wodnik: "a water bearer pouring water from an urn",
  ryby: "two fish swimming in a circle",
};

const MOON = {
  now: "a barely visible new moon, dark disc with a faint glowing outline in the night sky",
  "przybywajacy-sierp": "a thin waxing crescent moon lit on the right side, night sky with stars",
  "pierwsza-kwadra": "a first quarter moon with the right half glowing bright, night sky",
  "przybywajacy-garb": "a waxing gibbous moon, mostly lit with a small shadow on the left, night sky",
  pelnia: "a glowing bright full round moon with soft clouds and stars in the night sky",
  "ubywajacy-garb": "a waning gibbous moon, mostly lit with a small shadow on the right, night sky",
  "ostatnia-kwadra": "a last quarter moon with the left half glowing bright, night sky",
  "ubywajacy-sierp": "a thin waning crescent moon lit on the left side, night sky with stars",
};

async function gen(prompt, outPath) {
  if (existsSync(outPath) && !process.argv.includes("--force")) return "skip";
  const res = await fetch("https://fal.run/fal-ai/flux/dev", {
    method: "POST",
    headers: { Authorization: `Key ${FAL}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, image_size: "square_hd", num_images: 1 }),
  });
  if (!res.ok) throw new Error(`fal ${res.status}: ${(await res.text()).slice(0, 120)}`);
  const data = await res.json();
  const img = await fetch(data.images[0].url);
  writeFileSync(outPath, Buffer.from(await img.arrayBuffer()));
  return "ok";
}

const zDir = join(ROOT, "public", "zodiac");
const mDir = join(ROOT, "public", "moon");
mkdirSync(zDir, { recursive: true });
mkdirSync(mDir, { recursive: true });

const jobs = [
  ...Object.entries(ZODIAC).map(([slug, s]) => ({
    prompt: `Dreamy celestial illustration of ${s}, ${ZODIAC_STYLE}`,
    out: join(zDir, `${slug}.jpg`),
    label: `zodiac/${slug}`,
  })),
  ...Object.entries(MOON).map(([slug, s]) => ({
    prompt: `${s}, ${MOON_STYLE}`,
    out: join(mDir, `${slug}.jpg`),
    label: `moon/${slug}`,
  })),
];

async function pool(items, size) {
  const q = [...items];
  let ok = 0;
  async function next() {
    while (q.length) {
      const j = q.shift();
      try {
        const r = await gen(j.prompt, j.out);
        console.log(`  ${r === "ok" ? "✓" : "–"} ${j.label}`);
        if (r === "ok") ok++;
      } catch (e) {
        console.log(`  ✗ ${j.label}: ${e.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: size }, next));
  return ok;
}

const ok = await pool(jobs, 4);
console.log(`Gotowe: ${ok} nowych obrazków (12 znaków + 8 faz).`);
