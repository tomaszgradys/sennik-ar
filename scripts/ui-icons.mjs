// Małe ikony UI do kart „Sprawdź też" (księżyc, zodiak) — FLUX, kwadrat.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
function loadEnv() {
  const f = join(ROOT, ".env.local");
  if (!existsSync(f)) return;
  for (const l of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv();
const FAL = process.env.FAL_KEY;
const dir = join(ROOT, "public", "ui");
mkdirSync(dir, { recursive: true });
const S =
  "minimal elegant icon, deep navy background, glowing gold and soft violet, delicate stars, dreamy celestial, centered, no text, no watermark";
const jobs = [
  { out: "moon.jpg", p: `a glowing golden crescent moon with a few small stars, ${S}` },
  { out: "zodiac.jpg", p: `a golden circular zodiac constellation wheel with stars, ${S}` },
];
for (const j of jobs) {
  const res = await fetch("https://fal.run/fal-ai/flux/dev", {
    method: "POST",
    headers: { Authorization: `Key ${FAL}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: j.p, image_size: "square_hd", num_images: 1 }),
  });
  if (!res.ok) throw new Error(`${res.status}: ${(await res.text()).slice(0, 120)}`);
  const data = await res.json();
  const img = await fetch(data.images[0].url);
  writeFileSync(join(dir, j.out), Buffer.from(await img.arrayBuffer()));
  console.log(`✓ ui/${j.out}`);
}
