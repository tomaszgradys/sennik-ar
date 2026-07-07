// توليد صور hero للمدونة العربية من رسوم دليل العلامة (SVG 880x500) عبر sharp.
// لكل مقال: <arSlug>.webp (800w)، <arSlug>-400.webp (400w)، <arSlug>.jpg (og).
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ILL = join(ROOT, "brand-guide-pack", "assets", "illustrations");
const OUT = join(ROOT, "public", "blog-img");

// رسم العلامة -> slug المقال العربي
const MAP = [
  { svg: "ex-partner", slug: "الحلم-بالحبيب-السابق" },
  { svg: "loved-one", slug: "لماذا-نحلم-بالاموات" },
  { svg: "remember-dreams", slug: "لماذا-ننسي-الاحلام" },
];

for (const { svg, slug } of MAP) {
  const buf = readFileSync(join(ILL, `${svg}.svg`));
  await sharp(buf, { density: 200 }).resize(800).webp({ quality: 82 }).toFile(join(OUT, `${slug}.webp`));
  await sharp(buf, { density: 200 }).resize(400).webp({ quality: 80 }).toFile(join(OUT, `${slug}-400.webp`));
  await sharp(buf, { density: 200 }).resize(1200, 630, { fit: "cover" }).jpeg({ quality: 84 }).toFile(join(OUT, `${slug}.jpg`));
  console.log("generated:", slug);
}
console.log("done");
