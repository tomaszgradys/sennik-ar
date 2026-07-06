// نقل كامل PL -> AR عبر Anthropic Batch API (-50%، غير متزامن).
// كل طلب يترجم ويكيّف ثقافيًا مدخلًا بولنديًا من قاموس الأحلام إلى العربية،
// فيعيد المصطلح بالعربية الفصحى + المحتوى. يُبنى الكتالوج العربي من النتائج
// (أصل كل تركيبة يأتي من خريطة الرموز).
//
//   node scripts/batch-ar.mjs submit   # يرسل الدفعة (يستخدم scripts/pl-catalog.json)
//   node scripts/batch-ar.mjs fetch    # يفحص الحالة؛ عند الجهوزية يبني الكتالوج + المحتوى + الصور
//   node scripts/batch-ar.mjs retry        # يعيد إرسال الإخفاقات
//   node scripts/batch-ar.mjs retry-fetch  # يدمج نتائج إعادة المحاولة
//
// الحالة: scripts/.batch-ar.json (id + قائمة محاذية لـ custom_id r{index}).
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, copyFileSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPTS = join(ROOT, "scripts");
const DATA = join(ROOT, "src", "data");
const CONTENT_DIR = join(DATA, "content");
const PUB = join(ROOT, "public");
const STATE = join(SCRIPTS, ".batch-ar.json");
// مصدر واحد: كتالوج PL. يمكن إضافة رموز عربية خاصة عبر scripts/ar-extra.json.
const PL_CATALOG = JSON.parse(readFileSync(join(SCRIPTS, "pl-catalog.json"), "utf8"));
const EXTRA = existsSync(join(SCRIPTS, "ar-extra.json"))
  ? JSON.parse(readFileSync(join(SCRIPTS, "ar-extra.json"), "utf8"))
  : [];
const PL_IMAGES = new Set(
  existsSync(join(SCRIPTS, "pl-images.json"))
    ? JSON.parse(readFileSync(join(SCRIPTS, "pl-images.json"), "utf8"))
    : []
);
const MODEL = "claude-sonnet-5";
const API = "https://api.anthropic.com/v1/messages/batches";

function loadEnv() {
  const f = join(ROOT, ".env.local");
  if (!existsSync(f)) return;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv();
const KEY = process.env.ANTHROPIC_API_KEY;
if (!KEY) throw new Error("مفقود ANTHROPIC_API_KEY");
const H = { "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" };

// إرسال دفعة مع إعادة محاولة عند أخطاء البوابة العابرة (5xx) وحمل كبير.
async function postBatch(requests) {
  const body = JSON.stringify({ requests });
  let lastErr;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetch(API, { method: "POST", headers: H, body });
      if (res.ok) return await res.json();
      const txt = (await res.text()).slice(0, 200);
      if (res.status >= 500 || res.status === 429) {
        lastErr = new Error(`${res.status}: ${txt}`);
        const wait = attempt * 8000;
        console.log(`محاولة ${attempt} فشلت (${res.status})، إعادة بعد ${wait / 1000}ث…`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw new Error(`Batch submit ${res.status}: ${txt}`);
    } catch (e) {
      lastErr = e;
      const wait = attempt * 8000;
      console.log(`محاولة ${attempt} خطأ شبكة (${e.message?.slice(0, 60)})، إعادة بعد ${wait / 1000}ث…`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

// اسم الفئة PL -> AR (يجب أن يطابق CATEGORIES في src/lib/categories.ts)
const CAT_MAP = {
  "zwierzęta": "الحيوانات",
  "ludzie i relacje": "الناس والعلاقات",
  "ciało i zdrowie": "الجسد والصحة",
  "dom i miejsca": "البيت والأماكن",
  "natura i pogoda": "الطبيعة والطقس",
  "podróże i pojazdy": "السفر والمركبات",
  "technologia i internet": "التقنية والإنترنت",
  "praca pieniądze i szkoła": "العمل والمال والدراسة",
  "rzeczy codzienne i symbole": "الأشياء والرموز",
  "zagrożenia emocje i wydarzenia": "المخاطر والمشاعر والأحداث",
  "czynności i ruch": "الأفعال والحركة",
  "jedzenie i napoje": "الطعام والشراب",
};

// slug عربي: نزيل التشكيل والتطويل، نبقي الحروف العربية + اللاتينية + الأرقام،
// ونستبدل ما سواها بشرطة. النتيجة تُستخدم في المسار والملفات والصور.
function slugify(input) {
  return String(input || "")
    .normalize("NFC")
    .replace(/[ً-ْٰـ]/g, "") // حركات + ألف خنجرية + تطويل
    .replace(/[آأإ]/g, "ا") // توحيد الألف (آ أ إ -> ا)
    .replace(/ة/g, "ه") // تاء مربوطة -> هاء (تبسيط للمسار)
    .replace(/ى/g, "ي") // ألف مقصورة -> ياء
    .toLowerCase()
    .replace(/[^ء-ي٠-٩a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const SYSTEM = `أنت كاتب قاموس أحلام عربي بعنوان «معنى الحلم» (تفسير الأحلام) وأخصائي نفسي في آن واحد.
تتلقّى مدخلًا من قاموس أحلام بولندي، فتنتج النسخة العربية: أولًا تترجم المصطلح إلى عربية فصحى
طبيعية (المصطلح الذي يكتبه عربيّ ويبحث عنه في جوجل)، ثم تكتب تفسيرًا فريدًا مكيّفًا مع الثقافة العربية.

التكييف الثقافي: الأساس دافئ ونفسي هادئ (بلا ترهيب)، مع تضفير إشارات من تراث تعبير الرؤى العربي
الكلاسيكي (ابن سيرين، النابلسي) حين يكون ذلك طبيعيًا وذا صلة، باحترام ودون إصدار أحكام فقهية
(حلال/حرام) ودون وعد بحظ أو أرقام. إذا كان الرمز بولنديًا محضًا وقليل الصلة بالعالم العربي،
فكيّفه إلى أقرب مكافئ عربي (المعنى نفسه بمصطلح محلي). حين يكون للرمز وزن في الثقافة العربية
(معتقدات شعبية، إيمان، طبيعة صحراوية) اذكره بخفّة واحترام، بلا تنميط.

الأجواء: كتاب أحلام قديم، سحر خفيف، هدوء من يقرأ على ضوء مصباح ليلًا.
ثلاث طبقات: (1) ما معناه، (2) كيف يغيّره شعور الحلم، (3) نصيحة لطيفة.

قواعد صارمة:
- ممنوع منعًا باتًا استخدام الشرطة الطويلة (—,–) داخل الجمل. استخدم جملًا منفصلة أو فواصل.
- ادخل في الملموس من الجملة الأولى، بلا حشو.
- فقرات قصيرة مريحة على الهاتف.
- ممنوعة كليشيهات الذكاء الاصطناعي: «في يومنا هذا»، «جدير بالذكر»، «ليس فقط... بل أيضًا»،
  «جانب أساسي»، «باختصار».
- لا تُرهب. تعامل مع الموضوعات الصعبة برقّة. لا تنبؤات قاطعة ولا نصائح طبية كأنها يقين.
  عربية فصحى صحيحة سليمة.

أجب بـ JSON صالح فقط (بلا markdown). داخل القيم لا تستخدم أسطرًا جديدة خام ولا علامات اقتباس
مستقيمة ("); للاقتباس استخدم «القوسين» أو 'المفردة'.`;

function userPrompt(t) {
  const isSymbol = t.type === "symbol";
  const focus = isSymbol
    ? `هذه هي الصفحة الرئيسية لرمز. اكتب بشمول.`
    : `هذه تنويعة فرعية من الرمز الأصل (بالبولندية: "${t.parent}"). منذ الفقرة الأولى وضّح ما الذي يغيّره هذا التفصيل.`;
  const imageField = isSymbol
    ? `\n  "imagePrompt": "وصف قصير بالإنجليزية لمشهد يوضّح الرمز (مثال: 'a calm black cat on a moonlit windowsill')، 6-14 كلمة، بلا ذكر أسلوب،",`
    : "";
  return `المدخل البولندي: "${t.phrase}" (الفئة: ${t.arCategory}).
${focus}

أعد JSON يحوي هذه الحقول تحديدًا:
{
  "phrase": "المصطلح بالعربية الفصحى (ترجمة طبيعية/مكيّفة؛ مثال: 'kot'->'قطة'، 'czarny kot'->'قطة سوداء'). دون نقطة نهائية.",
  "gender": "m|f|pl (جنس الاسم العربي: مذكر m، مؤنث f، جمع pl)",
  "locative": "المصطلح كما يظهر بعد 'الحلم بـ' (غالبًا مطابق لـ phrase)",${imageField}
  "metaDescription": "135-160 حرفًا، فريد، يحوي 'تفسير حلم' أو 'الحلم بـ' + المصطلح",
  "quickAnswer": "45-75 كلمة: إجابة مباشرة عمّا يعنيه هذا الحلم",
  "intro": "35-55 كلمة، مقدمة جاذبة، المصطلح في أوائل الكلمات",
  "paragraphs": ["3-4 فقرات قصيرة"],
  "positive": "إشارات طيبة: 45-70 كلمة",
  "negative": "ما ينبغي الانتباه له: 45-70 كلمة، برقّة",
  "advice": "نصيحة لليوم: 40-65 كلمة",
  "faq": [{"q":"سؤال حقيقي من جوجل (يحوي 'تفسير حلم' أو 'الحلم بـ')","a":"40-70 كلمة"}]
}
faq: من 4 إلى 5 أسئلة تحديدًا. "phrase" و "gender" يجب أن يكونا صحيحين بالعربية الفصحى.`;
}

function buildTasks() {
  // ننقل كل كتالوج PL (مرآة) ونثريه بالفئة العربية. ثم نضيف الرموز العربية الخاصة.
  const base = PL_CATALOG.map((e) => ({
    ...e,
    arCategory: CAT_MAP[e.category] || "الأشياء والرموز",
  }));
  const extra = EXTRA.map((e) => ({
    slug: e.slug,
    phrase: e.phrase, // نص بولندي أو عربي كبذرة؛ النموذج يعيد الصياغة العربية
    parent: e.parent,
    type: e.type,
    priority: e.priority ?? 2,
    category: e.category,
    arCategory: CAT_MAP[e.category] || e.arCategory || "الأشياء والرموز",
  }));
  return base.concat(extra);
}

async function submit() {
  const tasks = buildTasks();
  const requests = tasks.map((t, i) => ({
    custom_id: `r${i}`,
    // العربية تستهلك رموزًا (tokens) أكثر من اللاتينية لكل حرف؛ نرفع الحد لتجنّب البتر.
    params: { model: MODEL, max_tokens: 5200, system: SYSTEM, messages: [{ role: "user", content: userPrompt(t) }] },
  }));
  console.log(`إرسال دفعة: ${requests.length} مدخلًا (PL -> AR)…`);
  const data = await postBatch(requests);
  const meta = tasks.map((t) => ({ plSlug: t.slug, plParent: t.parent, type: t.type, priority: t.priority, arCategory: t.arCategory }));
  writeFileSync(STATE, JSON.stringify({ id: data.id, meta }));
  console.log(`تم. Batch id: ${data.id} (الحالة: ${data.processing_status}).`);
  console.log(`تحقّق: node scripts/batch-ar.mjs fetch`);
}

function parseContent(r) {
  const text = r.result.message.content.map((b) => b.text ?? "").join("");
  let s = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  s = s.replace(/[\u2013\u2014]/g, " ").replace(/[\u0000-\u001f]+/g, " ");
  return JSON.parse(s);
}

async function fetchResults() {
  if (!existsSync(STATE)) throw new Error("لا يوجد scripts/.batch-ar.json — شغّل submit أولًا.");
  const { id, meta } = JSON.parse(readFileSync(STATE, "utf8"));
  const st = await (await fetch(`${API}/${id}`, { headers: H })).json();
  console.log(`الحالة: ${st.processing_status}`, st.request_counts);
  if (st.processing_status !== "ended") {
    console.log("لا يزال قيد المعالجة — تحقّق لاحقًا.");
    return;
  }
  const raw = await (await fetch(st.results_url, { headers: H })).text();

  const byIndex = new Map();
  for (const line of raw.split(/\r?\n/).filter(Boolean)) {
    const r = JSON.parse(line);
    byIndex.set(Number(r.custom_id.slice(1)), r);
  }

  const used = new Set();
  const uniqueSlug = (base) => {
    let s = base || "حلم";
    if (!used.has(s)) { used.add(s); return s; }
    for (let i = 2; ; i++) { const c = `${s}-${i}`; if (!used.has(c)) { used.add(c); return c; } }
  };

  // ننظّف المحتوى القديم — إعادة بناء كاملة من النقل.
  mkdirSync(CONTENT_DIR, { recursive: true });
  for (const f of readdirSync(CONTENT_DIR)) if (f.endsWith(".json")) unlinkSync(join(CONTENT_DIR, f));

  const catalog = [];
  const shards = new Map(); // parentArSlug -> { slug: content }
  const symbolMap = new Map(); // plSlug -> arSlug (رموز فقط)
  const withImage = [];
  const failures = [];
  let ok = 0, bad = 0;

  const put = (parent, slug, content) => {
    if (!shards.has(parent)) shards.set(parent, {});
    shards.get(parent)[slug] = content;
  };
  const copyImage = (plSlug, arSlug) => {
    if (!PL_IMAGES.has(plSlug)) return false;
    for (const [dir, ext] of [["dreams", "jpg"], ["thumbs", "webp"], ["hero", "webp"], ["og", "jpg"]]) {
      const src = join(PUB, dir, `${plSlug}.${ext}`);
      const dst = join(PUB, dir, `${arSlug}.${ext}`);
      if (existsSync(src) && src !== dst) copyFileSync(src, dst);
    }
    withImage.push(arSlug);
    return true;
  };

  // المرحلة 1: الرموز (تحدّد أصل التركيبات + جسر الصور).
  for (let i = 0; i < meta.length; i++) {
    if (meta[i].type !== "symbol") continue;
    const r = byIndex.get(i);
    let j;
    if (r?.result?.type !== "succeeded") { bad++; failures.push(meta[i]); continue; }
    try { j = parseContent(r); } catch { bad++; failures.push(meta[i]); continue; }
    if (!j.phrase) { bad++; failures.push(meta[i]); continue; }
    const arSlug = uniqueSlug(slugify(j.phrase));
    symbolMap.set(meta[i].plSlug, arSlug);
    catalog.push({ slug: arSlug, phrase: j.phrase, parent: arSlug, category: meta[i].arCategory, priority: meta[i].priority, type: "symbol" });
    const { phrase, ...content } = j; void phrase;
    put(arSlug, arSlug, content);
    copyImage(meta[i].plSlug, arSlug);
    ok++;
  }

  // المرحلة 2: التركيبات (الأصل = arSlug للرمز الأب).
  for (let i = 0; i < meta.length; i++) {
    if (meta[i].type !== "combo") continue;
    const parentAr = symbolMap.get(meta[i].plParent);
    if (!parentAr) { bad++; failures.push(meta[i]); continue; }
    const r = byIndex.get(i);
    let j;
    if (r?.result?.type !== "succeeded") { bad++; failures.push(meta[i]); continue; }
    try { j = parseContent(r); } catch { bad++; failures.push(meta[i]); continue; }
    if (!j.phrase) { bad++; failures.push(meta[i]); continue; }
    const arSlug = uniqueSlug(slugify(j.phrase));
    catalog.push({ slug: arSlug, phrase: j.phrase, parent: parentAr, category: meta[i].arCategory, priority: meta[i].priority, type: "combo" });
    const { phrase, ...content } = j; void phrase;
    put(parentAr, arSlug, content);
    ok++;
  }

  writeFileSync(join(DATA, "catalog.json"), JSON.stringify(catalog));
  for (const [parent, obj] of shards) writeFileSync(join(CONTENT_DIR, `${parent}.json`), JSON.stringify(obj));
  const published = new Set();
  for (const [, obj] of shards) for (const s of Object.keys(obj)) published.add(s);
  writeFileSync(join(CONTENT_DIR, "_published.json"), JSON.stringify([...published]));
  writeFileSync(join(CONTENT_DIR, "_images.json"), JSON.stringify(withImage));
  writeFileSync(join(SCRIPTS, ".batch-ar-map.json"), JSON.stringify({ symbolMap: Object.fromEntries(symbolMap), used: [...used] }));
  writeFileSync(join(SCRIPTS, ".batch-ar-failures.json"), JSON.stringify(failures));

  console.log(`بُني: ${ok} ناجح، ${bad} فشل. الكتالوج: ${catalog.length}. الصور: ${withImage.length}.`);
  console.log(`الإخفاقات محفوظة: ${failures.length}. إعادة: node scripts/batch-ar.mjs retry`);
}

// يعيد إرسال الإخفاقات في دفعة جديدة (max_tokens أكبر لتجنّب البتر).
async function retry() {
  const fp = join(SCRIPTS, ".batch-ar-failures.json");
  if (!existsSync(fp)) throw new Error("لا إخفاقات — شغّل fetch أولًا.");
  const failures = JSON.parse(readFileSync(fp, "utf8"));
  if (!failures.length) return console.log("لا إخفاقات لإعادة الإرسال.");
  const all = buildTasks();
  const bySlug = new Map(all.map((e) => [e.slug, e]));
  const tasks = failures.map((m) => {
    const e = bySlug.get(m.plSlug) || {};
    return { phrase: e.phrase, parent: e.parent, type: m.type, arCategory: m.arCategory, plSlug: m.plSlug, plParent: m.plParent, priority: m.priority };
  });
  const requests = tasks.map((t, i) => ({
    custom_id: `r${i}`,
    params: { model: MODEL, max_tokens: 6000, system: SYSTEM, messages: [{ role: "user", content: userPrompt(t) }] },
  }));
  console.log(`إعادة: إرسال ${requests.length} مدخلًا (max_tokens 6000)…`);
  const data = await postBatch(requests);
  const rmeta = tasks.map((t) => ({ plSlug: t.plSlug, plParent: t.plParent, type: t.type, priority: t.priority, arCategory: t.arCategory }));
  writeFileSync(join(SCRIPTS, ".batch-ar-retry.json"), JSON.stringify({ id: data.id, meta: rmeta }));
  console.log(`تم retry batch id: ${data.id}. ثم: node scripts/batch-ar.mjs retry-fetch`);
}

// يرسل الرموز العربية الخاصة (scripts/ar-extra.json) كدفعة مستقلة تُدمج لاحقًا.
async function submitExtra() {
  if (!EXTRA.length) throw new Error("لا يوجد scripts/ar-extra.json — شغّل node scripts/build-ar-extra.mjs أولًا.");
  const tasks = EXTRA.map((e) => ({
    phrase: e.phrase, parent: e.parent, type: e.type, priority: e.priority ?? 2,
    plSlug: e.slug, plParent: e.parent,
    arCategory: e.arCategory || CAT_MAP[e.category] || "الأشياء والرموز",
  }));
  const requests = tasks.map((t, i) => ({
    custom_id: `r${i}`,
    params: { model: MODEL, max_tokens: 6000, system: SYSTEM, messages: [{ role: "user", content: userPrompt(t) }] },
  }));
  console.log(`إرسال دفعة الرموز الخاصة: ${requests.length} مدخلًا…`);
  const data = await postBatch(requests);
  const meta = tasks.map((t) => ({ plSlug: t.plSlug, plParent: t.plParent, type: t.type, priority: t.priority, arCategory: t.arCategory }));
  writeFileSync(join(SCRIPTS, ".batch-ar-extra.json"), JSON.stringify({ id: data.id, meta }));
  console.log(`تم extra batch id: ${data.id}. ثم: node scripts/batch-ar.mjs extra-fetch`);
}

// يدمج دفعة (إعادة محاولة أو رموز خاصة) في الكتالوج/المحتوى الموجود (دون تنظيف).
async function retryFetch(stateFile = ".batch-ar-retry.json") {
  const rp = join(SCRIPTS, stateFile);
  if (!existsSync(rp)) throw new Error(`لا ${stateFile} — شغّل الخطوة السابقة أولًا.`);
  const { id, meta } = JSON.parse(readFileSync(rp, "utf8"));
  const st = await (await fetch(`${API}/${id}`, { headers: H })).json();
  console.log(`حالة retry: ${st.processing_status}`, st.request_counts);
  if (st.processing_status !== "ended") { console.log("لا يزال قيد المعالجة."); return; }
  const raw = await (await fetch(st.results_url, { headers: H })).text();
  const byIndex = new Map();
  for (const line of raw.split(/\r?\n/).filter(Boolean)) { const r = JSON.parse(line); byIndex.set(Number(r.custom_id.slice(1)), r); }

  const catalog = JSON.parse(readFileSync(join(DATA, "catalog.json"), "utf8"));
  const { symbolMap: smObj, used: usedArr } = JSON.parse(readFileSync(join(SCRIPTS, ".batch-ar-map.json"), "utf8"));
  const symbolMap = new Map(Object.entries(smObj));
  const used = new Set(usedArr);
  const withImage = new Set(JSON.parse(readFileSync(join(CONTENT_DIR, "_images.json"), "utf8")));
  const uniqueSlug = (base) => { let s = base || "حلم"; if (!used.has(s)) { used.add(s); return s; } for (let i = 2; ; i++) { const c = `${s}-${i}`; if (!used.has(c)) { used.add(c); return c; } } };
  const dirty = new Map();
  const getShard = (p) => { if (!dirty.has(p)) { const f = join(CONTENT_DIR, `${p}.json`); dirty.set(p, existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : {}); } return dirty.get(p); };

  let ok = 0, bad = 0;
  for (let i = 0; i < meta.length; i++) {
    if (meta[i].type !== "symbol") continue;
    if (symbolMap.has(meta[i].plSlug)) continue;
    const r = byIndex.get(i); let j;
    if (r?.result?.type !== "succeeded") { bad++; continue; }
    try { j = parseContent(r); } catch { bad++; continue; }
    if (!j.phrase) { bad++; continue; }
    const arSlug = uniqueSlug(slugify(j.phrase));
    symbolMap.set(meta[i].plSlug, arSlug);
    catalog.push({ slug: arSlug, phrase: j.phrase, parent: arSlug, category: meta[i].arCategory, priority: meta[i].priority, type: "symbol" });
    const { phrase, ...content } = j; void phrase; getShard(arSlug)[arSlug] = content;
    if (PL_IMAGES.has(meta[i].plSlug)) {
      for (const [dir, ext] of [["dreams", "jpg"], ["thumbs", "webp"], ["hero", "webp"], ["og", "jpg"]]) {
        const src = join(PUB, dir, `${meta[i].plSlug}.${ext}`); const dst = join(PUB, dir, `${arSlug}.${ext}`);
        if (existsSync(src) && src !== dst) copyFileSync(src, dst);
      }
      withImage.add(arSlug);
    }
    ok++;
  }
  for (let i = 0; i < meta.length; i++) {
    if (meta[i].type !== "combo") continue;
    const parentAr = symbolMap.get(meta[i].plParent);
    if (!parentAr) { bad++; continue; }
    const r = byIndex.get(i); let j;
    if (r?.result?.type !== "succeeded") { bad++; continue; }
    try { j = parseContent(r); } catch { bad++; continue; }
    if (!j.phrase) { bad++; continue; }
    const arSlug = uniqueSlug(slugify(j.phrase));
    catalog.push({ slug: arSlug, phrase: j.phrase, parent: parentAr, category: meta[i].arCategory, priority: meta[i].priority, type: "combo" });
    const { phrase, ...content } = j; void phrase; getShard(parentAr)[arSlug] = content;
    ok++;
  }

  for (const [p, obj] of dirty) writeFileSync(join(CONTENT_DIR, `${p}.json`), JSON.stringify(obj));
  writeFileSync(join(DATA, "catalog.json"), JSON.stringify(catalog));
  const published = new Set(JSON.parse(readFileSync(join(CONTENT_DIR, "_published.json"), "utf8")));
  for (const [, obj] of dirty) for (const s of Object.keys(obj)) published.add(s);
  writeFileSync(join(CONTENT_DIR, "_published.json"), JSON.stringify([...published]));
  writeFileSync(join(CONTENT_DIR, "_images.json"), JSON.stringify([...withImage]));
  writeFileSync(join(SCRIPTS, ".batch-ar-map.json"), JSON.stringify({ symbolMap: Object.fromEntries(symbolMap), used: [...used] }));
  console.log(`دمج retry: ${ok} ناجح، ${bad} فشل. الكتالوج: ${catalog.length}.`);
}

const cmd = process.argv[2];
if (cmd === "submit") await submit();
else if (cmd === "fetch") await fetchResults();
else if (cmd === "retry") await retry();
else if (cmd === "retry-fetch") await retryFetch();
else if (cmd === "extra") await submitExtra();
else if (cmd === "extra-fetch") await retryFetch(".batch-ar-extra.json");
else { console.log("الاستخدام: node scripts/batch-ar.mjs [submit|fetch|retry|retry-fetch|extra|extra-fetch]"); process.exit(1); }
