// Obrazy modułu imion (kaligrafia/natura wg znaczenia, NIEfiguratywne).
// public/hero/name-<slug>.webp + og/name-<slug>.jpg + hub og/asma.jpg. Wznawialne.
import sharp from "sharp";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUB = join(ROOT, "public");
for (const l of readFileSync(join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const FAL = process.env.FAL_KEY;
if (!FAL) throw new Error("Brak FAL_KEY");

const SEED = JSON.parse(readFileSync(join(ROOT, "scripts", "names-seed.json"), "utf8"));
const STYLE = "ornamental arabic calligraphy artwork, no people, no human figure, no faces, no bodies, no christian cross, elegant flowing script as the centerpiece, soft moonlight, warm parchment and cream tones, delicate gold ink, subtle magical glow, dreamy fairytale book plate, muted dusty blue accents, no watermark";

async function flux(prompt) {
  let lastErr;
  for (let a = 1; a <= 3; a++) {
    try {
      const res = await fetch("https://fal.run/fal-ai/flux/dev", {
        method: "POST", headers: { Authorization: `Key ${FAL}`, "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `${prompt}, ${STYLE}`, image_size: "landscape_4_3", num_images: 1 }),
      });
      if (!res.ok) throw new Error(`fal ${res.status}`);
      const d = await res.json();
      return Buffer.from(await (await fetch(d.images[0].url)).arrayBuffer());
    } catch (e) { lastErr = e; if (a < 3) await new Promise((r) => setTimeout(r, a * 5000)); }
  }
  throw lastErr;
}
async function writeVariants(key, buf) {
  await sharp(buf).resize(800, 600, { fit: "cover", position: "attention" }).webp({ quality: 74 }).toFile(join(PUB, "hero", `${key}.webp`));
  await sharp(buf).resize(1200, 630, { fit: "cover", position: "centre" }).jpeg({ quality: 82, mozjpeg: true }).toFile(join(PUB, "og", `${key}.jpg`));
}

const force = process.argv.includes("--force");
const jobs = SEED.map((s) => ({ key: `name-${s.slug}`, prompt: s.imagePrompt }));
// karta huba
jobs.push({ key: "asma", prompt: "an open old book with elegant horizontal flowing golden arabic calligraphy across its glowing pages, a crescent moon and scattered stars above, warm light" });

const todo = jobs.filter((j) => force || !existsSync(join(PUB, "hero", `${j.key}.webp`)));
console.log(`obrazów imion do zrobienia: ${todo.length} / ${jobs.length}`);

let ok = 0, fail = 0, i = 0;
async function worker() {
  while (i < todo.length) {
    const j = todo[i++];
    try { await writeVariants(j.key, await flux(j.prompt)); ok++; }
    catch (e) { fail++; console.log("✗", j.key, String(e.message).slice(0, 80)); }
    if ((ok + fail) % 15 === 0) console.log("…", ok + fail, "/", todo.length);
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
console.log(`DONE ok:${ok} fail:${fail}`);
