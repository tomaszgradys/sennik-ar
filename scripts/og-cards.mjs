// Buduje lekkie karty OG 1200x630 JPEG (~120 KB) z WYPALONYM arabskim podpisem strony.
// WhatsApp/FB odrzucają duże pliki (dynamiczny PNG z next/og ~1 MB), dlatego robimy
// statyczne JPEG-i. Skład arabskiego (RTL, łączenie liter) realizuje satori → SVG
// (tekst jako wektory) → sharp. Kolejność słów gwarantujemy layoutem row-reverse
// (każde słowo osobno), bo bidi satori bywa niejednoznaczne przy frazach.
// Marka „hulm.pro" (łacińska) i gradient — przez sharp/SVG (pewne). Reuse per symbol.
// Uruchom: node scripts/og-cards.mjs [--sample]

import sharp from "sharp";
import satori from "satori";
import { readFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const IMG_DIR = join(ROOT, "public", "dreams");
// خلفية تمثيلية «حلمية» (كتاب تحت سماء مرصّعة بالنجوم) للبطاقات بلا رسم خاص
// (الرئيسية/الصفحات التي ترث default، والأرقام) بدل التدرّج الكحلي المسطّح.
const NIGHT_BG = join(IMG_DIR, "الليل.jpg");
const SAMPLE = process.argv.includes("--sample");
const OG_DIR = SAMPLE ? join(ROOT, "public", "og-sample") : join(ROOT, "public", "og");
rmSync(OG_DIR, { recursive: true, force: true });
mkdirSync(OG_DIR, { recursive: true });

const W = 1200;
const H = 630;

// ---- font arabski (statyczny — satori/opentype.js nie czyta fontów zmiennych) ----
const ARABIC_FONT = readFileSync(join(ROOT, "scripts", "fonts", "Almarai.ttf"));

// ---- warstwa tekstu arabskiego (satori → transparentny PNG) ----
// Jeden box: satori składa arabski poprawnie (łączenie liter, kolejność RTL,
// naturalne odstępy). Weryfikacja: „سمك القرش الكبير" → سمك z prawej (poprawnie).
function arabicWords(text, size, color) {
  return {
    type: "div",
    props: {
      style: { fontFamily: "AR", fontSize: size, color, fontWeight: 700, lineHeight: 1, direction: "rtl", textAlign: "right" },
      children: String(text).trim(),
    },
  };
}
// Szacunek szerokości (nadwyżkowy → bezpiecznie mniejsza czcionka, bez ucięcia).
function fitSize(text, max = 920, start = 92, min = 42) {
  const chars = String(text).trim().length; // ze spacjami (bezpiecznie)
  let size = start;
  while (size > min && chars * size * 0.5 > max) size -= 4;
  return size;
}
async function arabicLayer(kicker, title) {
  const size = fitSize(title);
  const el = {
    type: "div",
    props: {
      style: {
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        alignItems: "flex-end", justifyContent: "flex-end", paddingRight: 72, paddingBottom: 60, paddingLeft: 72,
      },
      children: [
        arabicWords(kicker, 32, "#D3A052"),
        { type: "div", props: { style: { height: 14 } } },
        arabicWords(title, size, "#FFFFFF"),
      ],
    },
  };
  const svg = await satori(el, { width: W, height: H, fonts: [{ name: "AR", data: ARABIC_FONT, weight: 700, style: "normal" }] });
  return sharp(Buffer.from(svg)).png().toBuffer();
}

// ---- nakładka: gradient + marka „hulm.pro" (łacińska, dół-lewo) ----
function brandOverlaySvg() {
  return Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0c0a14" stop-opacity="0.16"/>
      <stop offset="50%" stop-color="#0c0a14" stop-opacity="0.42"/>
      <stop offset="100%" stop-color="#0c0a14" stop-opacity="0.92"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <circle cx="88" cy="74" r="15" fill="#D3A052"/>
  <text x="118" y="87" font-family="Georgia, 'Times New Roman', serif" font-size="38" font-weight="700" fill="#FFF7EF">hulm.pro</text>
</svg>`);
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}
function darken({ r, g, b }, f = 0.42) {
  return { r: Math.round(r * f), g: Math.round(g * f), b: Math.round(b * f) };
}
function brandGradient(tint) {
  const c = tint ?? { r: 24, g: 35, b: 68 };
  return sharp({ create: { width: W, height: H, channels: 3, background: c } }).composite([
    {
      input: Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs><radialGradient id="r" cx="70%" cy="30%" r="90%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.10"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.32"/>
      </radialGradient></defs><rect width="${W}" height="${H}" fill="url(#r)"/></svg>`),
    },
  ]);
}

async function buildCard({ bg, tint, kicker, title, out }) {
  const base = bg && existsSync(bg) ? sharp(bg).resize(W, H, { fit: "cover", position: "centre" }) : brandGradient(tint);
  const baseBuf = await base.jpeg().toBuffer();
  const textPng = await arabicLayer(kicker, title);
  await sharp(baseBuf)
    .composite([{ input: brandOverlaySvg() }, { input: textPng }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(join(OG_DIR, out));
}

// ---- dane ----
const catalog = JSON.parse(readFileSync(join(ROOT, "src/data/catalog.json"), "utf8"));
const phraseByParent = new Map();
for (const e of catalog) if (!phraseByParent.has(e.parent)) phraseByParent.set(e.parent, e.phrase);
let registered = JSON.parse(readFileSync(join(ROOT, "src/data/content/_images.json"), "utf8"));
const registeredSet = new Set(registered);
if (SAMPLE) registered = registered.slice(0, 4);

// domyślna
await buildCard({ bg: NIGHT_BG, kicker: "معاني الأحلام", title: "تفسير حلمك", out: "default.jpg" });
console.log("  ✓ default.jpg");

// 1) Symbole — tytuł = arabska nazwa symbolu.
let nSym = 0;
for (const slug of registered) {
  const src = join(IMG_DIR, `${slug}.jpg`);
  if (!existsSync(src)) continue;
  const phrase = phraseByParent.get(slug) ?? slug;
  await buildCard({ bg: src, kicker: "تفسير الأحلام", title: phrase, out: `${slug}.jpg` });
  nSym++;
}
console.log(`  ✓ ${nSym} kart symboli`);

// 2) Kategorie (12) — tło = reprezentacyjny symbol kategorii + h1.
const CATEGORIES = [
  ["الحيوانات", "حيوانات", "أحلام عن الحيوانات"],
  ["الناس والعلاقات", "ناس-وعلاقات", "أحلام عن الناس والعلاقات"],
  ["البيت والأماكن", "بيت-وأماكن", "أحلام عن البيت والأماكن"],
  ["الطبيعة والطقس", "طبيعه-وطقس", "أحلام عن الطبيعة والطقس"],
  ["الجسد والصحة", "جسد-وصحه", "أحلام عن الجسد والصحة"],
  ["السفر والمركبات", "سفر-ومركبات", "أحلام عن السفر والمركبات"],
  ["العمل والمال والدراسة", "عمل-ومال-ودراسه", "أحلام عن العمل والمال والدراسة"],
  ["المخاطر والمشاعر والأحداث", "مخاطر-ومشاعر-وأحداث", "أحلام عن المخاطر والمشاعر"],
  ["الأفعال والحركة", "أفعال-وحركه", "أحلام عن الأفعال والحركة"],
  ["الأشياء والرموز", "أشياء-ورموز", "أحلام عن الأشياء والرموز"],
  ["الطعام والشراب", "طعام-وشراب", "أحلام عن الطعام والشراب"],
  ["التقنية والإنترنت", "تقنيه-وإنترنت", "أحلام عن التقنية والإنترنت"],
];
let nCat = 0;
for (const [name, slug, h1] of SAMPLE ? CATEGORIES.slice(0, 2) : CATEGORIES) {
  let bg = null;
  for (const e of catalog) {
    if (e.category === name && registeredSet.has(e.parent) && existsSync(join(IMG_DIR, `${e.parent}.jpg`))) {
      bg = join(IMG_DIR, `${e.parent}.jpg`);
      break;
    }
  }
  await buildCard({ bg, kicker: "تصنيف الأحلام", title: h1, out: `cat-${slug}.jpg` });
  nCat++;
}
console.log(`  ✓ ${nCat} kart kategorii`);

// 3) Kolory (13) — gradient w barwie koloru (hex) + nazwa.
const COLORS = [
  ["احمر", "أحمر", "#C0392B"], ["ازرق", "أزرق", "#2E5A88"], ["اخضر", "أخضر", "#3E7C5A"],
  ["اصفر", "أصفر", "#E0B84C"], ["اسود", "أسود", "#2B2B33"], ["ابيض", "أبيض", "#F3EFE7"],
  ["بنفسجي", "بنفسجي", "#6E5AA0"], ["وردي", "وردي", "#D98BA6"], ["برتقالي", "برتقالي", "#D98244"],
  ["رمادي", "رمادي", "#8A8A92"], ["بني", "بني", "#7A5A42"], ["ذهبي", "ذهبي", "#C9A44A"],
  ["فضي", "فضي", "#AEB4BC"],
];
let nCol = 0;
for (const [slug, name, hex] of SAMPLE ? COLORS.slice(0, 3) : COLORS) {
  await buildCard({ tint: darken(hexToRgb(hex), 0.45), kicker: "معنى اللون", title: name, out: `color-${slug}.jpg` });
  nCol++;
}
console.log(`  ✓ ${nCol} kart kolorów`);

// 4) Liczby — gradient marki + liczba.
const numbers = JSON.parse(readFileSync(join(ROOT, "src/data/numbers.json"), "utf8"));
let nNum = 0;
for (const n of SAMPLE ? Object.keys(numbers).slice(0, 3) : Object.keys(numbers)) {
  await buildCard({ bg: NIGHT_BG, kicker: "معنى الرقم", title: String(n), out: `number-${n}.jpg` });
  nNum++;
}
console.log(`  ✓ ${nNum} kart liczb`);

console.log(`Gotowe: ${1 + nSym + nCat + nCol + nNum} kart OG.`);
