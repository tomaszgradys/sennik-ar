// Optymalizacja obrazów pod szybkość (WebP):
//  - /thumbs/<slug>.webp  (256, smart-crop na obiekcie) — karty/listy
//  - /hero/<slug>.webp    (800px WebP)                  — obraz na stronie snu
// Źródło: public/dreams/<slug>.jpg (zostaje jako oryginał dla kart OG).
//   node scripts/webp.mjs [--force] [--only plik.json]
import sharp from "sharp";
import { readdirSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "public", "dreams");
const THUMBS = join(ROOT, "public", "thumbs");
const HERO = join(ROOT, "public", "hero");
mkdirSync(THUMBS, { recursive: true });
mkdirSync(HERO, { recursive: true });

const FORCE = process.argv.includes("--force");
const onlyArg = process.argv.indexOf("--only");
const ONLY = onlyArg >= 0 ? new Set(JSON.parse(readFileSync(process.argv[onlyArg + 1], "utf8"))) : null;

let files = readdirSync(SRC).filter((f) => f.endsWith(".jpg"));
if (ONLY) files = files.filter((f) => ONLY.has(f.replace(/\.jpg$/, "")));
console.log(`WebP: ${files.length} obrazów.`);

let ok = 0;
async function run(f) {
  const slug = f.replace(/\.jpg$/, "");
  const src = join(SRC, f);
  const thumbOut = join(THUMBS, `${slug}.webp`);
  const heroOut = join(HERO, `${slug}.webp`);

  // Hero: 800px szerokości, WebP q72 (~40-60KB zamiast ~230KB JPEG).
  if (FORCE || !existsSync(heroOut)) {
    await sharp(src).resize(800, 600, { fit: "cover", position: "attention" })
      .webp({ quality: 72 }).toFile(heroOut);
  }
  // Miniatura: pełny kadr 4:3 pomniejszony (jak dawniej pełny obraz w karcie,
  // object-cover docina do proporcji karty) — BEZ agresywnego przybliżenia.
  if (FORCE || !existsSync(thumbOut)) {
    await sharp(src).resize(512, 384, { fit: "cover" })
      .webp({ quality: 72 }).toFile(thumbOut);
  }
  ok++;
}

const CH = 8;
for (let i = 0; i < files.length; i += CH) {
  await Promise.all(files.slice(i, i + CH).map(run));
  if (i % 200 === 0) console.log(`  …${i}/${files.length}`);
}
console.log(`Gotowe: ${ok} obrazów (thumbs + hero WebP).`);
