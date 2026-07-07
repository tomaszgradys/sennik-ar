// ترجمة وحدات «الألوان» و«الأرقام» من PL إلى AR عبر Anthropic Batch API.
// كل طلب يترجم مدخلًا كاملًا (مع الحفاظ على بنية JSON وأسماء الحقول) إلى العربية الفصحى
// بنفس النبرة الهادئة الهجينة. الألوان تحصل على slug/اسم عربي؛ الأرقام تبقى أرقامًا.
//
//   node scripts/batch-modules-ar.mjs submit
//   node scripts/batch-modules-ar.mjs fetch
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPTS = join(ROOT, "scripts");
const DATA = join(ROOT, "src", "data");
const STATE = join(SCRIPTS, ".batch-modules-ar.json");
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

// خريطة الألوان PL -> AR (slug مطبّع بلا همزة ليطابق slugify، والاسم للعرض).
const COLOR_AR = {
  czerwony: { slug: "احمر", name: "أحمر" },
  niebieski: { slug: "ازرق", name: "أزرق" },
  zielony: { slug: "اخضر", name: "أخضر" },
  zolty: { slug: "اصفر", name: "أصفر" },
  bialy: { slug: "ابيض", name: "أبيض" },
  fioletowy: { slug: "بنفسجي", name: "بنفسجي" },
  rozowy: { slug: "وردي", name: "وردي" },
  pomaranczowy: { slug: "برتقالي", name: "برتقالي" },
  szary: { slug: "رمادي", name: "رمادي" },
  brazowy: { slug: "بني", name: "بني" },
  zloty: { slug: "ذهبي", name: "ذهبي" },
  czarny: { slug: "اسود", name: "أسود" },
  srebrny: { slug: "فضي", name: "فضي" },
};

const SYSTEM = `أنت مترجم ومحرّر لموقع تفسير أحلام عربي (hulm.pro). تتلقّى مدخلًا بصيغة JSON من نسخة
بولندية (وحدة «ألوان» أو «أرقام»)، فتعيد الكائن نفسه مترجمًا إلى العربية الفصحى الطبيعية،
مع الحفاظ التام على أسماء الحقول وبنية JSON وأطوال المصفوفات. النبرة هادئة ودافئة، بلا ترهيب
وبلا أحكام قاطعة، وتضفّر بلطف إشارات من تراث تعبير الرؤى العربي حين يكون ذلك طبيعيًا.
قواعد: بلا شرطات طويلة (—) داخل الجمل؛ عربية فصحى سليمة؛ في حقل faq اجعل الأسئلة كما يبحث عنها
عربي في جوجل. أعِد JSON صالحًا فقط بلا markdown وبلا أسطر خام داخل السلاسل وبلا علامات اقتباس
مستقيمة داخل القيم (استخدم «» أو ').`;

function userPrompt(kind, label, obj) {
  const ctx = kind === "color"
    ? `هذا مدخل لون اسمه بالعربية «${label}». ترجم كل القيم النصية إلى العربية، وليكن اللون في السياق هو «${label}».`
    : `هذا مدخل للرقم ${label}. ترجم كل القيم النصية إلى العربية مع الإبقاء على الرقم ${label} كما هو.`;
  return `${ctx}
أعِد كائن JSON بنفس الحقول تمامًا: ${Object.keys(obj).join(", ")}.
حافظ على البنية (المصفوفات تبقى مصفوفات بنفس عدد العناصر، وحقل faq مصفوفة كائنات {q,a}).

المدخل (بولندي):
${JSON.stringify(obj)}`;
}

async function postBatch(requests) {
  const body = JSON.stringify({ requests });
  for (let a = 1; a <= 5; a++) {
    try {
      const res = await fetch(API, { method: "POST", headers: H, body });
      if (res.ok) return await res.json();
      const t = (await res.text()).slice(0, 200);
      if (res.status >= 500 || res.status === 429) { console.log(`محاولة ${a} (${res.status})…`); await new Promise((r) => setTimeout(r, a * 8000)); continue; }
      throw new Error(`submit ${res.status}: ${t}`);
    } catch (e) { console.log(`محاولة ${a} خطأ`); await new Promise((r) => setTimeout(r, a * 8000)); }
  }
  throw new Error("فشل الإرسال بعد عدة محاولات");
}

function buildTasks() {
  const colors = JSON.parse(readFileSync(join(DATA, "colors.json"), "utf8"));
  const numbers = JSON.parse(readFileSync(join(DATA, "numbers.json"), "utf8"));
  const tasks = [];
  for (const [plSlug, obj] of Object.entries(colors)) {
    const ar = COLOR_AR[plSlug];
    tasks.push({ kind: "color", plSlug, arSlug: ar?.slug || plSlug, label: ar?.name || plSlug, obj });
  }
  for (const [num, obj] of Object.entries(numbers)) {
    tasks.push({ kind: "number", plSlug: num, arSlug: num, label: num, obj });
  }
  return tasks;
}

async function submit() {
  const tasks = buildTasks();
  const requests = tasks.map((t, i) => ({
    custom_id: `r${i}`,
    params: { model: MODEL, max_tokens: 6000, system: SYSTEM, messages: [{ role: "user", content: userPrompt(t.kind, t.label, t.obj) }] },
  }));
  console.log(`إرسال دفعة الوحدات: ${requests.length} (ألوان + أرقام)…`);
  const data = await postBatch(requests);
  const meta = tasks.map((t) => ({ kind: t.kind, plSlug: t.plSlug, arSlug: t.arSlug, label: t.label }));
  writeFileSync(STATE, JSON.stringify({ id: data.id, meta }));
  console.log(`تم. id: ${data.id}. ثم: node scripts/batch-modules-ar.mjs fetch`);
}

function parseContent(r) {
  const text = r.result.message.content.map((b) => b.text ?? "").join("");
  let s = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  s = s.replace(/[\u2013\u2014]/g, " ").replace(/[\u0000-\u001f]+/g, " ");
  return JSON.parse(s);
}

async function fetchResults() {
  if (!existsSync(STATE)) throw new Error("شغّل submit أولًا.");
  const { id, meta } = JSON.parse(readFileSync(STATE, "utf8"));
  const st = await (await fetch(`${API}/${id}`, { headers: H })).json();
  console.log(`الحالة: ${st.processing_status}`, st.request_counts);
  if (st.processing_status !== "ended") { console.log("لا يزال قيد المعالجة."); return; }
  const raw = await (await fetch(st.results_url, { headers: H })).text();
  const byIndex = new Map();
  for (const line of raw.split(/\r?\n/).filter(Boolean)) { const r = JSON.parse(line); byIndex.set(Number(r.custom_id.slice(1)), r); }

  const colors = {}, numbers = {};
  let ok = 0, bad = 0;
  for (let i = 0; i < meta.length; i++) {
    const r = byIndex.get(i);
    if (r?.result?.type !== "succeeded") { bad++; continue; }
    let j; try { j = parseContent(r); } catch { bad++; continue; }
    if (meta[i].kind === "color") colors[meta[i].arSlug] = j;
    else numbers[meta[i].arSlug] = j;
    ok++;
  }
  if (Object.keys(colors).length) writeFileSync(join(DATA, "colors.json"), JSON.stringify(colors));
  if (Object.keys(numbers).length) writeFileSync(join(DATA, "numbers.json"), JSON.stringify(numbers));
  console.log(`بُني: ${ok} ناجح، ${bad} فشل. ألوان: ${Object.keys(colors).length}، أرقام: ${Object.keys(numbers).length}.`);
}

// وضع متزامن: نداءات messages مباشرة (بلا batch) بتزامن محدود — فوري لعدد صغير.
function parseDirect(data) {
  const text = (data.content || []).map((b) => b.text ?? "").join("");
  let s = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  s = s.replace(/[\u2013\u2014]/g, " ").replace(/[\u0000-\u001f]+/g, " ");
  return JSON.parse(s);
}
async function callOne(t) {
  const body = JSON.stringify({ model: MODEL, max_tokens: 6000, system: SYSTEM, messages: [{ role: "user", content: userPrompt(t.kind, t.label, t.obj) }] });
  for (let a = 1; a <= 4; a++) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: H, body });
      if (res.ok) return parseDirect(await res.json());
      if (res.status >= 500 || res.status === 429) { await new Promise((r) => setTimeout(r, a * 4000)); continue; }
      throw new Error(`${res.status}`);
    } catch { await new Promise((r) => setTimeout(r, a * 4000)); }
  }
  return null;
}
async function syncRun() {
  const tasks = buildTasks();
  const colors = {}, numbers = {};
  let ok = 0, bad = 0, done = 0;
  const CONC = 6;
  for (let i = 0; i < tasks.length; i += CONC) {
    const chunk = tasks.slice(i, i + CONC);
    const results = await Promise.all(chunk.map((t) => callOne(t)));
    for (let k = 0; k < chunk.length; k++) {
      const t = chunk[k], j = results[k];
      if (j && j.quickAnswer) { (t.kind === "color" ? colors : numbers)[t.arSlug] = j; ok++; }
      else bad++;
    }
    done += chunk.length;
    console.log(`${done}/${tasks.length} (نجاح ${ok}، فشل ${bad})`);
  }
  if (Object.keys(colors).length) writeFileSync(join(DATA, "colors.json"), JSON.stringify(colors));
  if (Object.keys(numbers).length) writeFileSync(join(DATA, "numbers.json"), JSON.stringify(numbers));
  console.log(`تم: ألوان ${Object.keys(colors).length}، أرقام ${Object.keys(numbers).length}.`);
}

const cmd = process.argv[2];
if (cmd === "submit") await submit();
else if (cmd === "fetch") await fetchResults();
else if (cmd === "sync") await syncRun();
else { console.log("الاستخدام: node scripts/batch-modules-ar.mjs [submit|fetch|sync]"); process.exit(1); }
