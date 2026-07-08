// Buduje lekkie karty OG 1200x630 JPEG (~150 KB) dla podglądu linków.
// WhatsApp odrzuca duże pliki (dynamiczny PNG z next/og ~1 MB), dlatego robimy
// statyczne JPEG-i: ilustracja FLUX (cover) + ciemna nakładka + logo/tagline.
// Reuse per symbol: karta symbolu obsługuje wszystkie jego warianty.
// Uruchom: node scripts/og-cards.mjs

import sharp from "sharp";
import { readFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const IMG_DIR = join(ROOT, "public", "dreams");
const OG_DIR = join(ROOT, "public", "og");
mkdirSync(OG_DIR, { recursive: true });

const W = 1200;
const H = 630;

// Nakładka: gradient (ciemniejszy u dołu) + złoty księżyc + wordmark hulm.pro.
// WYŁĄCZNIE łaciński wordmark (marka „hulm.pro", jak w nagłówku strony) — arabski
// tekst w SVG przez sharp/librsvg jest zawodny (brak fontu + kształtowanie RTL),
// a domena hulm.pro jest poprawną, spójną reprezentacją marki. ZERO polskiego.
function overlaySvg() {
  return Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0c0a14" stop-opacity="0.15"/>
      <stop offset="55%" stop-color="#0c0a14" stop-opacity="0.42"/>
      <stop offset="100%" stop-color="#0c0a14" stop-opacity="0.90"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <circle cx="88" cy="548" r="20" fill="#D3A052"/>
  <text x="122" y="566" font-family="Georgia, 'Times New Roman', serif" font-size="66" font-weight="700" fill="#FFFFFF">hulm.pro</text>
</svg>`);
}

async function buildCard(bgInput, outName) {
  const base = bgInput
    ? sharp(bgInput).resize(W, H, { fit: "cover", position: "centre" })
    : sharp({
        create: {
          width: W,
          height: H,
          channels: 3,
          background: { r: 24, g: 35, b: 68 }, // navy marki
        },
      });
  await base
    .composite([{ input: overlaySvg() }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(join(OG_DIR, outName));
  const kb = Math.round(existsSync(join(OG_DIR, outName)) ? readFileSync(join(OG_DIR, outName)).length / 1024 : 0);
  console.log(`  ✓ og/${outName} (${kb} KB)`);
}

// Karta domyślna (bez ilustracji) — dla stron bez obrazka symbolu (horoskop itd.).
await buildCard(null, "default.jpg");

// Karta per symbol (z ilustracji FLUX).
const imgs = existsSync(IMG_DIR)
  ? readdirSync(IMG_DIR).filter((f) => f.endsWith(".jpg"))
  : [];
for (const f of imgs) {
  await buildCard(join(IMG_DIR, f), f); // ten sam slug symbolu
}
console.log(`Gotowe: ${imgs.length} kart symboli + default.`);
