// Warianty statusu śniącego (للعزباء/للمتزوجة/للحامل/للرجل) dla symboli priorytetu 1.
// Największa luka long-tail arabskiego SEO: „تفسير حلم X للعزباء" itd. (Audyt 05).
// Kombinacje dziedziczą obrazek + rodzica; treść generowana od zera po arabsku
// (nie ma źródła w PL). Model: Sonnet 5, thinking WYŁĄCZONY (feedback: adaptive przepala).
//
//   node scripts/batch-modifiers-ar.mjs pilot <arSlug>       # 4 warianty na żywo (API), do wglądu
//   node scripts/batch-modifiers-ar.mjs submit               # pełny batch (585 p1 × 4)
//   node scripts/batch-modifiers-ar.mjs rebuild-state <id>   # odtwórz state (meta z buildTasks) dla istniejącego batcha
//   node scripts/batch-modifiers-ar.mjs fetch                # scala wyniki do shardów + katalog
//
// buildTasks() jest DETERMINISTYCZNE (te same p1 symbole × modyfikatory, ta sama kolejność),
// więc meta można odtworzyć jeśli state file zginie — pod warunkiem że katalog niezmieniony.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPTS = join(ROOT, "scripts");
const DATA = join(ROOT, "src", "data");
const CONTENT_DIR = join(DATA, "content");
const CATALOG = JSON.parse(readFileSync(join(DATA, "catalog.json"), "utf8"));
const STATE = join(SCRIPTS, ".batch-modifiers-ar.json");
const MODEL = "claude-sonnet-5";
const MSG_API = "https://api.anthropic.com/v1/messages";
const BATCH_API = "https://api.anthropic.com/v1/messages/batches";

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

const MODIFIERS = [
  { key: "للعزباء", label: "للعزباء", who: "امرأة عزباء (غير متزوجة)" },
  { key: "للمتزوجه", label: "للمتزوجة", who: "امرأة متزوجة" },
  { key: "للحامل", label: "للحامل", who: "امرأة حامل" },
  { key: "للرجل", label: "للرجل", who: "رجل" },
];

const SYSTEM = `أنت كاتب قاموس أحلام عربي بعنوان «معنى الحلم» (تفسير الأحلام) وأخصائي نفسي في آن واحد.
تكتب تفسيرًا لرمز حلم بحسب حالة الحالم (عزباء، متزوجة، حامل، رجل)، لأن التراث العربي في تعبير
الرؤى (ابن سيرين، النابلسي) كثيرًا ما يخصّ الدلالة بحال الرائي.

المنهج: طبقة نفسية دافئة هادئة (بلا ترهيب) مضفورة بإشارات من التراث حين تكون طبيعية وذات صلة،
باحترام ودون إصدار أحكام فقهية (حلال/حرام) ودون وعد بحظ أو أرقام. لكل حالة زاوية مختلفة فعلًا:
- العزباء: غالبًا يُقرأ الرمز في سياق المستقبل والنصيب والقبول والطمأنينة الشخصية (دون جزم بزواج قريب).
- المتزوجة: البيت والعلاقة والاستقرار والأولاد والتوازن.
- الحامل: برقّة شديدة، حول الطمأنينة والاستعداد والأمل؛ لا تنبؤات طبية ولا تخويف على الجنين إطلاقًا.
- الرجل: العمل والمسؤولية والرزق والمكانة والعلاقات.

الأجواء: كتاب أحلام قديم، هدوء من يقرأ على ضوء مصباح ليلًا. ثلاث طبقات: (1) ما معناه لهذه الحالة،
(2) كيف يغيّره شعور الحلم، (3) نصيحة لطيفة.

قواعد صارمة:
- ممنوع منعًا باتًا استخدام الشرطة الطويلة (—,–) داخل الجمل. استخدم جملًا منفصلة أو فواصل.
- ادخل في الملموس من الجملة الأولى، بلا حشو. فقرات قصيرة مريحة على الهاتف.
- ممنوعة كليشيهات الذكاء الاصطناعي: «في يومنا هذا»، «جدير بالذكر»، «ليس فقط... بل أيضًا»، «باختصار».
- لا تُرهب. لا تنبؤات قاطعة ولا نصائح طبية كأنها يقين. عربية فصحى صحيحة سليمة.
- لا تنفِ صدق الرؤيا ولا تصفها بالخرافة؛ اقرأها بلطف.

أجب بـ JSON صالح فقط (بلا markdown). داخل القيم لا أسطر جديدة خام ولا علامات اقتباس مستقيمة (")؛
للاقتباس استخدم «القوسين».`;

function userPrompt(symbolPhrase, mod, parentQuick) {
  return `الرمز الأصل: "${symbolPhrase}". حالة الحالم: ${mod.who} (${mod.label}).
للسياق فقط (لا تكرّره حرفيًا) هذا ملخص الرمز العام: "${(parentQuick || "").slice(0, 220)}"

اكتب تفسير حلم "${symbolPhrase} ${mod.label}" خاصًا بهذه الحالة. أعد JSON بهذه الحقول تحديدًا:
{
  "phrase": "عنوان طبيعي للصفحة بالعربية الفصحى يجمع الرمز والحالة (مثال: 'الكلب للعزباء' أو 'رؤية الكلب للعزباء')، دون نقطة نهائية",
  "metaDescription": "135-160 حرفًا، فريد، يحوي 'تفسير حلم' + الرمز + ${mod.label}",
  "quickAnswer": "45-75 كلمة: إجابة مباشرة عمّا يعنيه هذا الحلم لهذه الحالة تحديدًا",
  "intro": "35-55 كلمة، مقدمة جاذبة تخصّ ${mod.who}",
  "paragraphs": ["3-4 فقرات قصيرة خاصة بهذه الحالة"],
  "positive": "إشارات طيبة لهذه الحالة: 45-70 كلمة",
  "negative": "ما ينبغي الانتباه له: 45-70 كلمة، برقّة",
  "advice": "نصيحة لطيفة: 40-65 كلمة",
  "faq": [{"q":"سؤال حقيقي من جوجل يحوي '${mod.label}'","a":"40-70 كلمة"}]
}
faq: من 4 إلى 5 أسئلة تخصّ هذه الحالة.`;
}

function extractJson(text) {
  text = (text || "").replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
  const a = text.indexOf("{"), b = text.lastIndexOf("}");
  if (a >= 0 && b > a) text = text.slice(a, b + 1);
  return JSON.parse(text);
}

async function callOne(symbolPhrase, mod, parentQuick) {
  const body = JSON.stringify({
    model: MODEL, max_tokens: 5200, thinking: { type: "disabled" }, system: SYSTEM,
    messages: [{ role: "user", content: userPrompt(symbolPhrase, mod, parentQuick) }],
  });
  const res = await fetch(MSG_API, { method: "POST", headers: H, body });
  if (!res.ok) throw new Error(`${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const text = data.content.find((b) => b.type === "text")?.text || "";
  return { json: extractJson(text), usage: data.usage };
}

async function pilot(arSlug) {
  const sym = CATALOG.find((e) => e.slug === arSlug && e.type === "symbol");
  if (!sym) throw new Error(`لا رمز بهذا slug: ${arSlug}`);
  const shard = JSON.parse(readFileSync(join(CONTENT_DIR, `${sym.parent}.json`), "utf8"));
  const parentQuick = shard[sym.slug]?.quickAnswer || "";
  console.log(`\n=== PILOT: ${sym.phrase} (${sym.slug}) ===\n`);
  for (const mod of MODIFIERS) {
    const { json } = await callOne(sym.phrase, mod, parentQuick);
    console.log(`\n──────── ${sym.phrase} ${mod.label} ────────`);
    console.log(JSON.stringify(json, null, 2));
  }
}

async function postBatch(requests) {
  const body = JSON.stringify({ requests });
  let lastErr;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetch(BATCH_API, { method: "POST", headers: H, body });
      if (res.ok) return await res.json();
      const txt = (await res.text()).slice(0, 200);
      if (res.status >= 500 || res.status === 429) { lastErr = new Error(`${res.status}: ${txt}`); await new Promise((r) => setTimeout(r, attempt * 8000)); continue; }
      throw new Error(`Batch submit ${res.status}: ${txt}`);
    } catch (e) { lastErr = e; await new Promise((r) => setTimeout(r, attempt * 8000)); }
  }
  throw lastErr;
}

// DETERMINISTYCZNA lista zadań: p1 symbole × 4 modyfikatory. custom_id m{index}.
function buildTasks() {
  const p1 = CATALOG.filter((e) => e.type === "symbol" && e.priority === 1);
  const catSlugs = new Set(CATALOG.map((e) => e.slug));
  const shardCache = {};
  const load = (p) => (p in shardCache ? shardCache[p] : (shardCache[p] = (() => {
    try { return JSON.parse(readFileSync(join(CONTENT_DIR, `${p}.json`), "utf8")); } catch { return null; }
  })()));
  const tasks = [];
  for (const sym of p1) {
    const shard = load(sym.parent);
    const c = shard?.[sym.slug];
    if (!c) continue;
    for (const mod of MODIFIERS) {
      const newSlug = `${sym.slug}-${mod.key}`;
      if (catSlugs.has(newSlug)) continue;
      tasks.push({ parentSlug: sym.parent, parentPhrase: sym.phrase, gender: c.gender, category: sym.category, mod, newSlug, parentQuick: c.quickAnswer || "" });
    }
  }
  return tasks;
}

const metaOf = (tasks) => tasks.map((t) => ({ parentSlug: t.parentSlug, parentPhrase: t.parentPhrase, gender: t.gender, category: t.category, modLabel: t.mod.label, newSlug: t.newSlug }));

async function submit() {
  const tasks = buildTasks();
  const requests = tasks.map((t, i) => ({ custom_id: `m${i}`, params: { model: MODEL, max_tokens: 5200, thinking: { type: "disabled" }, system: SYSTEM, messages: [{ role: "user", content: userPrompt(t.parentPhrase, t.mod, t.parentQuick) }] } }));
  console.log(`إرسال دفعة المعدِّلات: ${requests.length} مدخلًا…`);
  const data = await postBatch(requests);
  writeFileSync(STATE, JSON.stringify({ id: data.id, meta: metaOf(tasks) }));
  console.log(`✓ batch id: ${data.id} (${requests.length}). حالة: ${data.processing_status}`);
}

// Odtwarza state file dla istniejącego batcha (gdy zniknął): meta z buildTasks().
function rebuildState(id) {
  if (!id) throw new Error("podaj batch id: rebuild-state <id>");
  const tasks = buildTasks();
  writeFileSync(STATE, JSON.stringify({ id, meta: metaOf(tasks) }));
  console.log(`✓ odtworzono state: ${STATE} | id ${id} | ${tasks.length} zadań`);
}

async function fetchBatch() {
  if (!existsSync(STATE)) throw new Error("لا state — شغّل rebuild-state <id> أولًا.");
  const { id, meta } = JSON.parse(readFileSync(STATE, "utf8"));
  const info = await (await fetch(`${BATCH_API}/${id}`, { headers: H })).json();
  console.log(`حالة الدفعة: ${info.processing_status} | ${JSON.stringify(info.request_counts)}`);
  if (info.processing_status !== "ended") { console.log("لم تنتهِ بعد."); return; }

  const res = await fetch(info.results_url, { headers: H });
  const byId = new Map();
  for (const line of (await res.text()).split("\n")) { if (!line.trim()) continue; const r = JSON.parse(line); byId.set(r.custom_id, r); }

  const catalog = JSON.parse(readFileSync(join(DATA, "catalog.json"), "utf8"));
  const catSlugs = new Set(catalog.map((e) => e.slug));
  const published = new Set(JSON.parse(readFileSync(join(CONTENT_DIR, "_published.json"), "utf8")));
  const shardCache = {};
  const load = (p) => (p in shardCache ? shardCache[p] : (shardCache[p] = JSON.parse(readFileSync(join(CONTENT_DIR, `${p}.json`), "utf8"))));

  let ok = 0, bad = 0; const failures = []; const touched = new Set();
  for (let i = 0; i < meta.length; i++) {
    const m = meta[i]; const r = byId.get(`m${i}`);
    if (r?.result?.type !== "succeeded") { bad++; failures.push(m.newSlug); continue; }
    let j; try { j = extractJson(r.result.message.content.find((b) => b.type === "text")?.text); } catch { bad++; failures.push(m.newSlug); continue; }
    const paras = Array.isArray(j.paragraphs) ? j.paragraphs.filter((p) => (p || "").trim().length >= 40) : [];
    const faq = Array.isArray(j.faq) ? j.faq.filter((f) => f && (f.q || "").trim() && (f.a || "").trim()) : [];
    if (!j.phrase || paras.length < 3 || faq.length < 1 || !(j.quickAnswer || "").trim()) { bad++; failures.push(m.newSlug); continue; }
    if (catSlugs.has(m.newSlug)) { bad++; continue; }
    const content = { gender: m.gender, locative: `${m.parentPhrase} ${m.modLabel}`, metaDescription: j.metaDescription, quickAnswer: j.quickAnswer, intro: j.intro, paragraphs: paras, positive: j.positive, negative: j.negative, advice: j.advice, faq };
    load(m.parentSlug)[m.newSlug] = content;
    catalog.push({ slug: m.newSlug, phrase: j.phrase, parent: m.parentSlug, category: m.category, priority: 2, type: "combo" });
    catSlugs.add(m.newSlug); published.add(m.newSlug); touched.add(m.parentSlug); ok++;
  }
  for (const p of touched) writeFileSync(join(CONTENT_DIR, `${p}.json`), JSON.stringify(shardCache[p]));
  writeFileSync(join(DATA, "catalog.json"), JSON.stringify(catalog));
  writeFileSync(join(CONTENT_DIR, "_published.json"), JSON.stringify([...published]));
  writeFileSync(join(SCRIPTS, ".batch-modifiers-ar-failures.json"), JSON.stringify(failures));
  console.log(`دُمج: ${ok} ناجح، ${bad} فشل. الكتالوج: ${catalog.length}. إخفاقات: ${failures.length}.`);
}

const cmd = process.argv[2], arg = process.argv[3];
if (cmd === "pilot") pilot(arg || "كلب").catch((e) => { console.error(e); process.exit(1); });
else if (cmd === "submit") submit().catch((e) => { console.error(e); process.exit(1); });
else if (cmd === "rebuild-state") { try { rebuildState(arg); } catch (e) { console.error(e); process.exit(1); } }
else if (cmd === "fetch") fetchBatch().catch((e) => { console.error(e); process.exit(1); });
else console.log("Użycie: pilot <slug> | submit | rebuild-state <id> | fetch");
