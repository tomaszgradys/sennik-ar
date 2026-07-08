// Auto-blog (عربي): يختار AI ديناميكيًا موضوعًا مناسبًا للموسم/الاتجاهات لموقع hulm.pro
// (تفسير الأحلام)، دون تكرار وبلا قائمة انتظار جامدة. يبحث في الإنترنت (web_search)،
// يكتب مقالًا عربيًا أصليًا (تأليف وليس ترجمة)، يولّد صورة hero عبر fal.ai/FLUX
// (إلزامية: لا يُنشر المقال بلا صورة)، ثم يحفظ المقال ويحدّث _index.json.
//   node scripts/blog.mjs generate   # مقال جديد واحد (الموضوع يختاره AI لهذا اليوم)
//   node scripts/blog.mjs suggest    # اعرض الموضوع المقترح فقط (بلا كتابة)
//   node scripts/blog.mjs list       # آخر المقالات المنشورة
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BLOG_DIR = join(ROOT, "src", "data", "blog");
const IMG_DIR = join(ROOT, "public", "blog-img");
const INDEX = join(BLOG_DIR, "_index.json");
const API = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-5";
mkdirSync(BLOG_DIR, { recursive: true });
mkdirSync(IMG_DIR, { recursive: true });

function loadEnv() {
  const f = join(ROOT, ".env.local");
  if (!existsSync(f)) return;
  for (const l of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv();
const KEY = process.env.ANTHROPIC_API_KEY;
const FAL = process.env.FAL_KEY;
if (!KEY) throw new Error("Brak ANTHROPIC_API_KEY");
const H = { "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" };
const CTRL = /[ -]+/g;

// تحويل العبارة إلى slug عربي صالح للمسار (مطابق لـ slugify في src/lib/polish.ts).
function slugify(input) {
  return String(input || "")
    .normalize("NFC")
    .replace(/[ً-ْٰـ]/g, "")
    .replace(/[آأإ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .toLowerCase()
    .replace(/[^ء-ي٠-٩a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// كتالوج رموز الأحلام الموجودة (للتحقق من روابط "related" — بلا اختلاق).
const CONTENT_DIR = join(ROOT, "src", "data", "content");
function symbolExists(slug) {
  return existsSync(join(CONTENT_DIR, `${slug}.json`));
}

const CATEGORIES = ["تفسير الأحلام", "النوم والعلم", "طور القمر"];

// استراتيج اختيار الموضوع: موسم + مناسبات + Google Discover، ضمن نيشة الموقع، بلا تكرار.
const SELECT_SYSTEM = `أنت استراتيجي محتوى SEO لموقع hulm.pro (تفسير الأحلام) الموجّه لقراء العربية الفصحى
في المنطقة العربية والإسلامية. اختر موضوعًا واحدًا لمقال جديد اليوم، مناسبًا تمامًا للموسم واللحظة.
قواعد الاختيار:
- راعِ المناسبات والتقويم المرتبط بالتاريخ الحالي: رمضان وليلة القدر والأحلام، موسم الحج وعرفة،
  رأس السنة الهجرية وعاشوراء، المولد النبوي، بداية العام الدراسي، الصيف والنوم، فصول السنة،
  كسوف/خسوف القمر. اختر موضوعًا اللحظة مناسبة له الآن تحديدًا.
- استهدف Google Discover: موضوع مثير فضولًا، عاطفي، بـ"خطّاف" واضح، مما يبحث عنه الناس فعلًا
  أو سيبحثون عنه في الأيام القادمة.
- التزم بنيشة الموقع: معنى/رمزية الأحلام، علم النوم، القمر، المشاعر أثناء الحلم.
- ممنوع تمامًا مواضيع الأبراج/التنجيم/علم الفلك التنجيمي (الموقع لا يتضمن هذا القسم إطلاقًا).
- لا تكرّر مواضيع نُشرت من قبل (ستصلك قائمتها) ولا معاني قريبة منها.
- يمكنك استخدام web_search للتحقق مما هو رائج الآن.
أجب حصرًا بكتلة JSON واحدة:
{"slug":"عنوان قصير بالعربية الفصحى يصلح slug (كلمات مفصولة بمسافات، بلا تشكيل)","title":"عنوان جذّاب وصادق بالعربية الفصحى","category":"واحدة من: تفسير الأحلام، النوم والعلم، طور القمر","brief":"3-6 عبارات إنجليزية للبحث","relatedSlugs":["سلاجات عربية حقيقية لرموز أحلام موجودة"],"reason":"جملة واحدة: لماذا الآن بالتحديد"}`;

const SYSTEM = `أنت محرر مدونة hulm.pro، قاموس أحلام عربي دافئ يجمع بين علم نفس النوم والتراث العربي
الكلاسيكي في تعبير الرؤى (ابن سيرين، النابلسي)، بلا ترهيب وبلا إصدار أحكام فقهية (حلال/حرام).
تكتب مقالات فريدة وإنسانية، بناءً على بحث في عدة مصادر موثوقة، لكن بأسلوبك الخاص (تأليف
وتوليف، ليس نسخًا أو صياغة مصدر واحد).
قواعد صارمة:
- من الجملة الأولى ادخل في الملموس. ممنوع تمامًا الشرطات الطويلة (—,–) داخل الجمل.
- ممنوعة كليشيهات الذكاء الاصطناعي: «في يومنا هذا»، «جدير بالذكر»، «ليس فقط... بل أيضًا»، «باختصار».
- لا تُرهب، بلا تشخيصات طبية وبلا تنبؤات قاطعة. نبرة هادئة، دافئة، موثوقة، فيها لمسة حكائية خفيفة.
- ممنوع نهائيًا الجزم بأن الحلم أو تفسير الأحلام غير حقيقي أو خرافة أو بلا معنى أو غير علمي.
  لا تكتب "لا توجد أدلة" أو "مجرد خرافة" أو ما شابه. تعامل مع معتقدات القارئ باحترام.
- ممنوع تمامًا الحديث عن الأبراج أو التنجيم أو علم الفلك التنجيمي.
- اذكر الحقائق العلمية بحذر ووفق المصادر. في حقل sources ضع فقط روابط حقيقية استُخدمت فعلًا.
- عربية فصحى سليمة وطبيعية، بلا ركاكة ترجمة.
أجب في النهاية بكتلة JSON صحيحة فقط (بلا markdown)، بالعربية.`;

const schema = (t) => `اكتب مقال مدونة عن: «${t.title}». أولًا ابحث في الإنترنت عن 3-5 مصادر موثوقة
(علم النوم، علم النفس، ويمكن مصادر تراثية عربية موثوقة) حول: ${t.brief}. ثم اكتب مقالًا عربيًا
أصليًا ومتماسكًا.
لـ Google Discover: يجب أن تجذب المقدمة من الجملة الأولى (فضول، عاطفة، تفصيل ملموس)، بلا
استدراج فارغ وبلا وعود لا يفي بها النص. اكتب بأسلوب جديد ومناسب للحظة الحالية؛ إذا كان
للموضوع سياق موسمي فأشر إليه بلطف.
شرط الطول: النص نفسه (المقدمة + فقرات الأقسام، دون الأسئلة الشائعة) لا يقل عن 900 كلمة،
والأفضل 1000-1300. هذا مهم لتحسين محركات البحث. طوّر كل قسم بتفصيل حقيقي بلا حشو.
أعد في النهاية JSON بالحقول التالية بالضبط:
{
 "metaDescription": "135-160 حرفًا، يحوي الموضوع",
 "excerpt": "جملة أو جملتان تعريفيتان (40-60 كلمة)",
 "readMinutes": رقم من 5 إلى 9,
 "imagePrompt": "وصف قصير بالإنجليزية لمشهد رمزي، 8-16 كلمة، بلا ذكر أسلوب، هادئ وحالم، مناسب للموضوع. مهم: بلا أشخاص ولا وجوه ولا بشر ولا سيلويت لأشخاص. عبّر عن الموضوع عبر الطبيعة والأشياء والضوء والسماء الليلية فقط",
 "intro": "مقدمة جاذبة من 50-70 كلمة",
 "sections": [{"h2":"عنوان فرعي","paragraphs":["3-4 فقرات مطوّرة"]}],
 "takeaways": ["3-4 نقاط سريعة"],
 "faq": [{"q":"سؤال حقيقي يُبحث عنه في جوجل","a":"40-70 كلمة"}],
 "sources": [{"title":"اسم المصدر","url":"https://رابط-حقيقي"}]
}
sections: 5-6 أقسام، كل قسم بـ3-4 فقرات مطوّرة. faq: 4-5 أسئلة. sources: 3-5 روابط حقيقية
استُخدمت في البحث. مجموع النص >= 900 كلمة.`;

// web_search يُدرج وسوم <cite ...>...</cite> في النص. نزيل كل وسوم HTML (يبقى النص وحده).
function stripTags(v) {
  if (typeof v === "string") return v.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  if (Array.isArray(v)) return v.map(stripTags);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, stripTags(x)]));
  return v;
}

// اقتطاع أول كائن JSON متوازن (واعٍ للسلاسل النصية) — لا يلتقط أقواسًا من نص/اقتباسات.
function extractJson(text) {
  const start = text.indexOf("{");
  if (start < 0) throw new Error("brak JSON");
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
    } else if (ch === '"') inStr = true;
    else if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0) return text.slice(start, i + 1); }
  }
  throw new Error("JSON urwany (brak zamknięcia)");
}

async function callJSON(system, prompt, { maxTokens = 8000, maxUses = 6 } = {}) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let a = 1; a <= 3; a++) {
    try {
      const body = {
        model: MODEL, max_tokens: maxTokens, system,
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: maxUses }],
        messages: [{ role: "user", content: prompt }],
      };
      const res = await fetch(API, { method: "POST", headers: H, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(`${res.status}: ${(await res.text()).slice(0, 200)}`);
      const data = await res.json();
      const text = data.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
      return stripTags(JSON.parse(extractJson(text).replace(CTRL, " ")));
    } catch (e) {
      if (a === 3) throw e;
      console.log(`  retry (${a}): ${e.message}`);
      await sleep(3000 * a);
    }
  }
}

// اختيار ديناميكي للموضوع اليوم (موسم/اتجاهات/Discover)، مع تفادي ما نُشر من قبل.
async function pickTopic(index) {
  const now = new Date();
  const iso = now.toISOString().slice(0, 10);
  const human = now.toLocaleDateString("ar", { day: "numeric", month: "long", year: "numeric" });
  const done = new Set(index.map((p) => p.slug));
  const published = index
    .slice(0, 60)
    .map((p) => `- ${p.title} (${p.slug}, ${p.date})`)
    .join("\n");

  const prompt = `اليوم: ${human} (${iso}). اختر أفضل موضوع لمقال جديد على hulm.pro للأيام القادمة،
مناسب للموسم/اللحظة ولـ Google Discover. راعِ المناسبات العربية والإسلامية والفصل الحالي.
المنشور من قبل (لا تكرره ولا تصغه بشكل مقارب):
${published || "(لا شيء بعد)"}
relatedSlugs: 2-3 سلاجات عربية حقيقية لرموز أحلام موجودة، مرتبطة بالموضوع.`;

  const pick = await callJSON(SELECT_SYSTEM, prompt, { maxTokens: 2000, maxUses: 3 });

  const slug = slugify(pick.slug || pick.title || "");
  const title = String(pick.title || "").trim();
  if (!slug || !title || done.has(slug)) return null;
  const category = CATEGORIES.includes(pick.category) ? pick.category : "تفسير الأحلام";

  // related: فقط رموز موجودة فعلًا + رابط آمن دائمًا لمركز المدونة.
  const related = [];
  for (const s of (pick.relatedSlugs || []).slice(0, 3)) {
    const cs = slugify(String(s));
    if (cs && symbolExists(cs)) related.push({ href: `/sen/${cs}/`, label: `حلم ${cs.replace(/-/g, " ")}` });
  }
  related.push({ href: "/blog/", label: "المزيد عن الأحلام في المدونة" });

  return { slug, title, category, brief: String(pick.brief || title), related, reason: String(pick.reason || "").trim() };
}

// أسلوب رمزي/أجواء بلا أشخاص (تكييف ثقافي لسوق عربي-إسلامي: نتجنّب البشر كموضوع رئيسي،
// لا وجوه ولا نساء، فقط طبيعة/أشياء/سماء ليلية/رموز). أكثر أمانًا لكل الشرائح وأنسب لأجواء
// قاموس الأحلام الحالمة. القيد مكرّر في نهاية البرومبت لأن FLUX dev بلا negative prompt منفصل.
const IMG_STYLE = "symbolic still scene, no people, no humans, no human figures, no faces, no woman, no man, no child, nature objects and symbols only, soft moonlight, warm parchment tones, subtle magical glow, delicate ink and watercolor texture, cozy dreamy atmosphere, muted beige cream and dusty blue, no text, no watermark";

// الصورة إلزامية: 3 محاولات مع تأخير متزايد. فشل نهائي => استثناء (لا يُنشر مقال بلا صورة).
// force=true يتجاوز إعادة الاستخدام (لإصلاح صور بديلة/تالفة).
async function genImage(slug, imagePrompt, { force = false } = {}) {
  // إعادة استخدام: إذا كانت الصورة موجودة فعلًا (مثلًا عند إعادة توليد المحتوى)، لا ندفع لـ FLUX مجددًا.
  if (!force && existsSync(join(IMG_DIR, `${slug}.jpg`)) && existsSync(join(IMG_DIR, `${slug}-400.webp`))) return;
  if (!FAL) throw new Error("Brak FAL_KEY — لا يمكن توليد صورة الغلاف، والنشر بلا صورة ممنوع.");

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let lastErr;
  for (let a = 1; a <= 3; a++) {
    try {
      const res = await fetch("https://fal.run/fal-ai/flux/dev", {
        method: "POST", headers: { Authorization: `Key ${FAL}`, "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `Dreamy symbolic fairytale book illustration of ${imagePrompt}, ${IMG_STYLE}`, image_size: "landscape_4_3", num_images: 1 }),
      });
      if (!res.ok) throw new Error(`fal ${res.status}: ${(await res.text()).slice(0, 150)}`);
      const d = await res.json();
      const buf = Buffer.from(await (await fetch(d.images[0].url)).arrayBuffer());
      // OG (1200 JPEG) + WebP متجاوب: 400w (موبايل) و800w (سطح مكتب). معيار لكل مقال.
      await sharp(buf).resize(1200, 900, { fit: "cover" }).jpeg({ quality: 82, mozjpeg: true }).toFile(join(IMG_DIR, `${slug}.jpg`));
      await sharp(buf).resize(800, 600, { fit: "cover" }).webp({ quality: 70 }).toFile(join(IMG_DIR, `${slug}.webp`));
      await sharp(buf).resize(400, 300, { fit: "cover" }).webp({ quality: 66 }).toFile(join(IMG_DIR, `${slug}-400.webp`));
      return;
    } catch (e) {
      lastErr = e;
      console.log(`  صورة الغلاف فشلت (محاولة ${a}/3): ${e.message}`);
      if (a < 3) await sleep(a * 4000);
    }
  }
  throw new Error(`تعذّر توليد صورة الغلاف بعد 3 محاولات: ${lastErr?.message}`);
}

function loadIndex() {
  return existsSync(INDEX) ? JSON.parse(readFileSync(INDEX, "utf8")) : [];
}

// حدّ حجم WebP (بايت) لتمييز صورة FLUX حقيقية عن رسم بديل مصغّر (SVG قديم ~3KB).
const MIN_HERO_BYTES = 8000;

function heroLooksReal(slug) {
  const webp = join(IMG_DIR, `${slug}.webp`);
  const small = join(IMG_DIR, `${slug}-400.webp`);
  const jpg = join(IMG_DIR, `${slug}.jpg`);
  if (!existsSync(webp) || !existsSync(small) || !existsSync(jpg)) return false;
  try { return statSync(webp).size >= MIN_HERO_BYTES; } catch { return false; }
}

// وصف مشهد إنجليزي لـ FLUX من عنوان المقال العربي (للمقالات القديمة بلا imagePrompt).
async function imagePromptFromTitle(title) {
  const sys = "You turn an Arabic blog post title about dreams into ONE short English scene description for a dreamy illustration. 8-14 words, concrete visual scene, calm and oniric. IMPORTANT: symbolic scene with NO people, no humans, no faces, no figures, no silhouettes of persons. Depict the theme only through nature, objects, light, night sky, landscapes. No style words, no text in image. Reply with the description only.";
  const body = JSON.stringify({ model: MODEL, max_tokens: 200, system: sys, messages: [{ role: "user", content: `Arabic title: «${title}»` }] });
  for (let a = 1; a <= 3; a++) {
    try {
      const res = await fetch(API, { method: "POST", headers: H, body });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join(" ").replace(/\s+/g, " ").trim();
      if (text) return text.replace(/^["'«]|["'»]$/g, "");
    } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, a * 2000));
  }
  return null;
}

// يضمن أن كل مقال منشور له صورة hero حقيقية (fal.ai). يعيد توليد أي صورة ناقصة أو بديلة
// مصغّرة. هذا هو "حارس الصور": يُشغّل يوميًا حتى تبقى الصور موجودة دائمًا.
// مع --all: يعيد توليد صور كل المقالات (لتطبيق سياسة صور جديدة على الأرشيف كله).
async function repair({ all = false } = {}) {
  const index = loadIndex();
  const broken = all
    ? index.filter((p) => p.hero !== false)
    : index.filter((p) => p.hero !== false && !heroLooksReal(p.slug));
  if (broken.length === 0) return console.log(`كل المقالات (${index.length}) لها صورة hero حقيقية. لا شيء لإصلاحه.`);
  console.log(`مقالات ${all ? "لإعادة التوليد" : "بحاجة لصورة"}: ${broken.length}/${index.length}`);
  if (!FAL) throw new Error("Brak FAL_KEY — لا يمكن إصلاح الصور بلا مفتاح fal.ai.");

  let ok = 0;
  for (const meta of broken) {
    const post = existsSync(join(BLOG_DIR, `${meta.slug}.json`))
      ? JSON.parse(readFileSync(join(BLOG_DIR, `${meta.slug}.json`), "utf8"))
      : null;
    let prompt = post?.imagePrompt;
    if (!prompt) prompt = await imagePromptFromTitle(post?.title || meta.title);
    if (!prompt) { console.log(`  ✗ ${meta.slug}: تعذّر اشتقاق وصف الصورة`); continue; }
    try {
      console.log(`  توليد: ${meta.slug} ← "${prompt}"`);
      await genImage(meta.slug, prompt, { force: true });
      ok++;
    } catch (e) {
      console.log(`  ✗ ${meta.slug}: ${e.message}`);
    }
  }
  console.log(`تم إصلاح ${ok}/${broken.length} صورة.`);
  if (ok < broken.length) process.exitCode = 1; // أبلغ CI أن بعض الصور ما زالت ناقصة.
}

async function chooseTopic(index) {
  const done = new Set(index.map((p) => p.slug));
  const t = await pickTopic(index);
  if (t && !done.has(t.slug)) return t;
  if (t) console.log(`  (اختيار AI أعاد موضوعًا منشورًا من قبل: ${t.slug})`);
  return null;
}

async function generate() {
  const index = loadIndex();
  const topic = await chooseTopic(index);
  if (!topic) return console.log("لا يوجد موضوع متاح اليوم (فشل الاختيار الديناميكي).");
  console.log(`أكتب: ${topic.slug} — «${topic.title}»${topic.reason ? ` [${topic.reason}]` : ""}`);

  const c = await callJSON(SYSTEM, schema(topic), { maxTokens: 8000, maxUses: 6 });
  const date = new Date().toISOString().slice(0, 10);

  // الصورة إلزامية: فشلها يوقف النشر بالكامل (لا نكتب أي ملف).
  await genImage(topic.slug, c.imagePrompt || topic.brief);

  const post = {
    slug: topic.slug, title: topic.title, h1: topic.title,
    metaDescription: c.metaDescription, excerpt: c.excerpt,
    date, category: topic.category, readMinutes: c.readMinutes || 5, hero: true,
    intro: c.intro, sections: c.sections, takeaways: c.takeaways || [],
    faq: c.faq || [], sources: (c.sources || []).filter((s) => /^https?:\/\//.test(s.url || "")),
    related: topic.related || [],
  };
  writeFileSync(join(BLOG_DIR, `${topic.slug}.json`), JSON.stringify(post, null, 1));

  const meta = { slug: post.slug, title: post.title, excerpt: post.excerpt, date, category: post.category, readMinutes: post.readMinutes, hero: true };
  writeFileSync(INDEX, JSON.stringify([meta, ...index], null, 1));
  console.log(`تم: ${topic.slug} (hero=true، مصادر=${post.sources.length}، أقسام=${post.sections.length})`);
}

function list() {
  const idx = loadIndex();
  console.log(`منشور: ${idx.length}. الأحدث:`);
  for (const p of idx.slice(0, 12)) console.log(`  ✓ ${p.date}  ${p.slug} — ${p.title}`);
  console.log("المواضيع تُختار ديناميكيًا (موسم/اتجاهات) — لا توجد قائمة انتظار ثابتة.");
}

async function suggest() {
  const t = await pickTopic(loadIndex());
  if (!t) return console.log("تعذّر اختيار موضوع.");
  console.log(`الموضوع المقترح: ${t.slug}\n  العنوان: ${t.title}\n  الفئة: ${t.category}\n  لماذا الآن: ${t.reason}`);
}

const cmd = process.argv[2];
if (cmd === "generate") await generate();
else if (cmd === "suggest") await suggest();
else if (cmd === "list") list();
else if (cmd === "repair") await repair({ all: process.argv.includes("--all") });
else console.log("الاستخدام: node scripts/blog.mjs generate | suggest | list | repair [--all]");
