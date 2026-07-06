// Inteligentne miniatury (kwadrat) z istniejących zdjęć symboli — bez generowania
// nowych. sharp z pozycją "attention" kadruje na najważniejszy fragment (zwykle
// zwierzę/obiekt), więc na małej ikonce widać sedno, nie tło. -> public/thumbs.
// Uruchom: node scripts/thumbs.mjs

import sharp from "sharp";
import { readdirSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "public", "dreams");
const OUT = join(ROOT, "public", "thumbs");
mkdirSync(OUT, { recursive: true });

const files = readdirSync(SRC).filter((f) => f.endsWith(".jpg"));
const FORCE = process.argv.includes("--force");
console.log(`Miniatury: ${files.length} zdjęć.`);

let ok = 0;
async function run(f) {
  const out = join(OUT, f);
  if (existsSync(out) && !FORCE) return;
  // Krok 1: attention kadruje kwadrat na obiekcie (zwierzę). Krok 2: przybliżamy
  // na górno-środkową część tego kwadratu — tam zwykle jest głowa zwierzęcia.
  const base = 512;
  const sq = await sharp(join(SRC, f))
    .resize(base, base, { fit: "cover", position: sharp.strategy.attention })
    .toBuffer();
  const z = 0.66; // im mniej, tym większe przybliżenie
  const c = Math.round(base * z);
  const left = Math.round((base - c) / 2);
  const top = Math.round((base - c) * 0.12); // lekko ku górze (głowa)
  await sharp(sq)
    .extract({ left, top, width: c, height: c })
    .resize(192, 192)
    .jpeg({ quality: 78, mozjpeg: true })
    .toFile(out);
  ok++;
}

// Sekwencyjnie w małych paczkach (sharp jest CPU-bound).
const CH = 8;
for (let i = 0; i < files.length; i += CH) {
  await Promise.all(files.slice(i, i + CH).map(run));
  if (i % 200 === 0) console.log(`  …${i}/${files.length}`);
}
console.log(`Gotowe: ${ok} nowych miniatur w public/thumbs.`);
