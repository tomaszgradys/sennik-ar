// Jednorazowa naprawa kulturowa obrazków snów (rynek arabsko-muzułmański): regeneruje
// 17 symboli (Tier 1+2) polityką „bez ludzi, bez haram" przez fal.ai/FLUX i odtwarza
// wszystkie 4 warianty (dreams jpg / hero webp / thumbs webp / og jpg — czyste, bez
// polskiego overlaya). Prompty symboliczne: winogrona/jęczmień zamiast alkoholu, ptaki/
// symbole zamiast par, obiekty/architektura zamiast postaci religijnych.
//   node scripts/fix-dream-images.mjs
import sharp from "sharp";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
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

const STYLE = "symbolic still scene, no people, no humans, no human figures, no faces, no woman, no man, no child, nature objects architecture and symbols only, soft moonlight, warm parchment tones, subtle magical glow, delicate ink and watercolor texture, cozy old dream dictionary atmosphere, muted beige cream and dusty blue, no text, no watermark";

// arSlug -> angielski opis sceny (symboliczny, bez ludzi, bez haram). PEŁNY zapis
// naprawy Tier 1+2 (17 obrazków). UWAGA: FLUX (flux/dev, bez negatywnego promptu)
// uparcie dokleja gotyckie kościoły z krzyżami + postać do „mrocznych" scen i płonącą
// księgę do ognia. Dlatego szatan = zbliżenie cierni (kompozycja bez horyzontu/obiektu
// nie zostawia miejsca na te artefakty), a synagoga = sama menora (bez budynku, który
// FLUX wieńczył krzyżem). Kościół/katedra/kaplica MAJĄ krzyże — to wierne symbolowi, OK.
const JOBS = {
  // Tier 1
  "ملاك": "a single luminous white feather descending through soft moonlit clouds, gentle radiant glow",
  "قبله": "two turtle doves gently touching beaks on a blossoming branch under the moon",
  "التقبيل": "two white swans forming a heart shape on a calm moonlit lake",
  "عشيق": "a single red rose resting on an old folded letter on a moonlit windowsill",
  "عشيقه": "a delicate red rose and a flowing silk ribbon under soft moonlight",
  "الخمر": "a cluster of dark grapes on a twisting vine under the moon with fallen leaves",
  "البيره": "golden barley stalks and hop flowers swaying in a field under moonlight",
  "الخمر-2": "ripe grapes and sheaves of grain resting on old parchment under moonlight",
  "بار": "an empty quiet old wooden counter with a single glowing lantern at night, no bottles",
  // Tier 2
  "قسيس": "an open old book and a burning candle on a stone ledge, moonlight through an arched window",
  "راهبه": "a quiet stone cloister archway with prayer beads hanging, moonlit garden beyond",
  "كنيسه": "a simple old stone church silhouette on a hill at night under the moon",
  "كاتدرائيه": "a grand stone cathedral silhouette against a serene moonlit sky, distant",
  "كنيسه-صغيره": "a small stone chapel with a single arched window glowing softly at night",
  "الصليب": "a weathered wooden cross on a quiet moonlit hill among wildflowers",
  "كنيس": "a large golden seven-branched menorah with softly lit candles standing on an old stone table, a Star of David engraved behind it, moonlight, plain dark background, no building, no church, no steeple, no cross, no crucifix, no people",
  "شيطان": "macro close-up of a dense tangle of twisted black thorns and dark brambles with a faint red glow, sharp spiky branches filling the whole frame on a dark background, no book, no paper, no object, no scene, no buildings, no church, no cross, no people, no figure, no animal",
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
      if (!res.ok) throw new Error(`fal ${res.status}: ${(await res.text()).slice(0, 150)}`);
      const d = await res.json();
      return Buffer.from(await (await fetch(d.images[0].url)).arrayBuffer());
    } catch (e) { lastErr = e; console.log(`  próba ${a}/3: ${e.message}`); if (a < 3) await sleep(a * 4000); }
  }
  throw new Error(`FLUX nie powiódł się: ${lastErr?.message}`);
}

async function writeVariants(slug, buf) {
  // /dreams/<slug>.jpg — oryginał (źródło + tło OG), 1024x768 jak reszta katalogu.
  await sharp(buf).resize(1024, 768, { fit: "cover" }).jpeg({ quality: 85, mozjpeg: true }).toFile(join(PUB, "dreams", `${slug}.jpg`));
  // /hero/<slug>.webp — 800x600 (jak webp.mjs).
  await sharp(buf).resize(800, 600, { fit: "cover", position: "attention" }).webp({ quality: 72 }).toFile(join(PUB, "hero", `${slug}.webp`));
  // /thumbs/<slug>.webp — 512x384 (jak webp.mjs).
  await sharp(buf).resize(512, 384, { fit: "cover" }).webp({ quality: 72 }).toFile(join(PUB, "thumbs", `${slug}.webp`));
  // /og/<slug>.jpg — 1200x630 CZYSTE (bez polskiego overlaya z og-cards.mjs).
  await sharp(buf).resize(1200, 630, { fit: "cover", position: "centre" }).jpeg({ quality: 82, mozjpeg: true }).toFile(join(PUB, "og", `${slug}.jpg`));
}

const slugs = Object.keys(JOBS);
console.log(`Naprawiam ${slugs.length} obrazków (Tier 1+2)…`);
let ok = 0;
for (const slug of slugs) {
  try {
    console.log(`  ${slug} ← "${JOBS[slug]}"`);
    const buf = await flux(JOBS[slug]);
    await writeVariants(slug, buf);
    ok++;
  } catch (e) {
    console.log(`  ✗ ${slug}: ${e.message}`);
  }
}
console.log(`Gotowe: ${ok}/${slugs.length}. Warianty: dreams+hero+thumbs+og.`);
if (ok < slugs.length) process.exitCode = 1;
