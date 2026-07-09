// Pełny przegląd obrazków z ludźmi (rekomendacja audytu). 46 symboli-osób (kobiety
// z odkrytymi włosami, intymne sceny man+woman itd.) regenerowane symbolicznie przez
// fal.ai/FLUX — obiekty/sceny BEZ ludzi, kulturowo bezpieczne dla rynku arab.-muzułm.
// Odtwarza wszystkie 4 warianty (dreams/hero/thumbs/og — OG czyste bez overlaya).
//   node scripts/fix-people-images.mjs [--only slug1,slug2]
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

// UWAGA (nauka z 1. przebiegu): FLUX dokleja postać, gdy scena IMPLIKUJE człowieka
// (marynarka→noszący, buciki/pokój→dziecko, modlitwa/pływanie/krzyk/kłótnia→wykonawca).
// Dlatego prompty = ODCZEPIONE obiekty na prostym tle / czysta abstrakcja, bez sceny
// sugerującej obecność człowieka. Styl agresywnie wyklucza figury.
const STYLE = "symbolic still life of objects only on a plain simple background, absolutely no people, no humans, no human figure, no silhouette, no faces, no woman, no man, no child, no body, empty scene, soft moonlight, warm parchment tones, subtle magical glow, delicate ink and watercolor texture, cozy old dream dictionary atmosphere, muted beige cream and dusty blue, no text, no watermark";

// arSlug -> ODCZEPIONY obiekt/atrybut (nikt go nie nosi/nie używa) lub abstrakcja.
const JOBS = {
  // Kobiety i role żeńskie — atrybuty odczepione
  "امراه": "a single elegant red rose and a folded silk scarf lying on plain fabric",
  "عروس": "a white bridal veil, a bouquet of white roses and two golden rings arranged on satin",
  "العروس": "a white bridal bouquet and a folded lace veil resting alone on a plain cushion",
  "الزوجه": "two golden wedding rings on an open book beside a small vase of roses",
  "اخت": "two roses intertwined on one stem lying on plain fabric",
  "الجده": "an empty old wooden rocking chair with a folded knitted shawl and a ball of yarn",
  "فتاه": "a hair ribbon and a small bunch of wildflowers on a plain windowsill",
  "فتاه-مراهقه": "a closed diary, a single flower and colored pens arranged on a plain desk",
  "ممثله": "two classic theater masks resting on a plain surface before a folded red curtain",
  "خاله": "a brass teapot and two small empty glass tea cups on an embroidered cloth",
  "العمه": "a dallah coffee pot and a plate of dates on an embroidered cloth",
  "بنت-الاخت": "a small flower crown and a ribbon resting on a plain soft blanket",
  "زوجه-الاب": "a single house key and a rose lying on a plain wooden table",
  "اميره": "a delicate jeweled tiara resting alone on a velvet cushion",
  "ملكه": "an ornate golden crown resting alone on a deep red velvet cushion",
  "صديقه": "two empty tea cups and a plate of sweets on an embroidered cloth",
  "الجاره": "two closed neighboring wooden doors with a potted plant between them, no one around",
  "معلمه": "a closed book, a piece of chalk and a small empty blackboard on a plain surface",
  "مغنيه": "a vintage microphone on a stand and floating musical notes on a plain background",
  // Mężczyźni, role — atrybuty odczepione
  "طبيب": "a stethoscope resting on a closed medical book beside a small lamp",
  "صديق": "two empty coffee cups and a closed backgammon board on a plain wooden table",
  "صديق-2": "two empty wooden chairs facing each other beside an old tree, no one around",
  "معلم": "a small blackboard with chalk, a closed book and a globe on a plain surface",
  "شرطي": "a police cap and a brass badge resting alone on a plain wooden desk",
  "رجل-الاطفاء": "a red fire helmet, a coiled hose and a ladder leaning against a plain wall",
  "جندي": "a military helmet resting alone on folded boots on a plain surface",
  "ملك": "a golden crown resting alone on an empty ornate throne, no one seated",
  "مغني": "an acoustic guitar leaning beside a microphone on a stand, plain background",
  "الميت": "a simple stone grave with a white shroud cloth and a single rose, empty and quiet",
  "رضيع": "an empty wooden cradle with a soft folded blanket and a small rattle",
  "رجل-عجوز": "a wooden cane and prayer beads resting alone on an empty old chair",
  "رجل-عجوز-2": "an old felt hat and eyeglasses resting on a worn leather book",
  "العريس": "an empty groom suit on a wooden hanger with a white boutonniere and two rings on a table",
  "خال": "a brass coffee pot and empty floor majlis cushions in a plain room, no one around",
  "طفل": "colorful wooden toy blocks and a small teddy bear on a plain surface, empty and quiet",
  // Aktywności / emocje — czysta abstrakcja (bez wykonawcy)
  "الشجار": "two dark storm clouds violently colliding with a flash of lightning, empty sky",
  "شجار": "cracked dry ground with two thorny branches tangled together, empty barren land",
  "الصلاه": "a rolled prayer rug and wooden prayer beads resting on it, top-down flat view, empty",
  "الصلاه-2": "wooden prayer beads coiled beside a closed decorated book on a plain surface, empty",
  "السباحه": "close-up of a clear turquoise water surface with gentle ripples and light reflections, no swimmer",
  "الصراخ": "abstract concentric sound waves radiating from a lone old megaphone, dark red background",
  "شاب": "a pair of sneakers, a backpack and a phone resting on a plain bench, no one around",
  "رجل": "a folded jacket, a wristwatch and a set of keys on a plain wooden table",
  "خطيب": "a small open ring box with a golden ring and a rose resting on velvet",
  "خطيبه": "a delicate engagement ring resting alone on a rose petal",
  "الجار": "two closed neighboring doors with a shared hanging lantern between them, no one around",
};

async function flux(prompt) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let lastErr;
  for (let a = 1; a <= 3; a++) {
    try {
      const res = await fetch("https://fal.run/fal-ai/flux/dev", {
        method: "POST", headers: { Authorization: `Key ${FAL}`, "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `Dreamy symbolic fairytale book illustration of ${prompt}, ${STYLE}`, image_size: "landscape_4_3", num_images: 1 }),
      });
      if (!res.ok) throw new Error(`fal ${res.status}: ${(await res.text()).slice(0, 120)}`);
      const d = await res.json();
      return Buffer.from(await (await fetch(d.images[0].url)).arrayBuffer());
    } catch (e) { lastErr = e; console.log(`    próba ${a}/3: ${e.message}`); if (a < 3) await sleep(a * 4000); }
  }
  throw new Error(`FLUX: ${lastErr?.message}`);
}

async function writeVariants(slug, buf) {
  await sharp(buf).resize(1024, 768, { fit: "cover" }).jpeg({ quality: 85, mozjpeg: true }).toFile(join(PUB, "dreams", `${slug}.jpg`));
  await sharp(buf).resize(800, 600, { fit: "cover", position: "attention" }).webp({ quality: 72 }).toFile(join(PUB, "hero", `${slug}.webp`));
  await sharp(buf).resize(512, 384, { fit: "cover" }).webp({ quality: 72 }).toFile(join(PUB, "thumbs", `${slug}.webp`));
  await sharp(buf).resize(1200, 630, { fit: "cover", position: "centre" }).jpeg({ quality: 82, mozjpeg: true }).toFile(join(PUB, "og", `${slug}.jpg`));
}

const onlyArg = process.argv.indexOf("--only");
const only = onlyArg >= 0 ? new Set(process.argv[onlyArg + 1].split(",")) : null;
const slugs = Object.keys(JOBS).filter((s) => (!only || only.has(s)) && existsSync(join(PUB, "dreams", `${s}.jpg`)));
console.log(`Regeneruję ${slugs.length} obrazków-osób symbolicznie…`);

// Pula z ograniczoną równoległością (FLUX + sharp).
let ok = 0, fail = 0, done = 0;
const q = [...slugs];
async function worker() {
  while (q.length) {
    const slug = q.shift();
    try { const buf = await flux(JOBS[slug]); await writeVariants(slug, buf); ok++; console.log(`  ✓ ${slug}`); }
    catch (e) { fail++; console.log(`  ✗ ${slug}: ${e.message}`); }
    done++;
  }
}
await Promise.all(Array.from({ length: 3 }, worker));
console.log(`Gotowe: ${ok} ok, ${fail} błędów z ${slugs.length}.`);
if (fail) process.exitCode = 1;
