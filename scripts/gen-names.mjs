// Generuje treść modułu imion (أسماء في المنام) z scripts/names-seed.json.
// → src/data/names-meta.json (metadane) + src/data/names.json (treść). Wznawialny.
//   node scripts/gen-names.mjs [--limit N]
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "src", "data");
const SEED = JSON.parse(readFileSync(join(ROOT, "scripts", "names-seed.json"), "utf8"));
const META_OUT = join(DATA, "names-meta.json");
const CONTENT_OUT = join(DATA, "names.json");
const MODEL = "claude-sonnet-5";
const CONCURRENCY = 6;

for (const l of readFileSync(join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const KEY = process.env.ANTHROPIC_API_KEY;
if (!KEY) throw new Error("Brak ANTHROPIC_API_KEY");
const H = { "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" };

// metadane (bez AI — z seedu, ale bez imagePrompt)
const meta = SEED.map(({ slug, name, translit, gender, origin, meaning }) => ({ slug, name, translit, gender, origin, meaning }));
writeFileSync(META_OUT, JSON.stringify(meta, null, 1));

const content = existsSync(CONTENT_OUT) ? JSON.parse(readFileSync(CONTENT_OUT, "utf8")) : {};

const SYS = `أنت كاتب موسوعة «أسماء في المنام» على موقع hulm.pro (تفسير الأحلام) بالعربية الفصحى، وخبير في تراث تعبير الرؤى.

الأساس الشرعي الصحيح الذي تبني عليه: القاعدة المتوارثة عند ابن سيرين والنابلسي أن «الأسماء في المنام تُؤوّل بمعانيها ومعانيها ومبانيها»، أي يُنظر إلى معنى الاسم لغةً وإلى ما يوحيه من تفاؤل أو تحذير. فمن رأى اسمًا معناه السلامة (سالم) قد يُبشَّر بالعافية، ومن رأى اسمًا معناه العلو (علي) قد يُقرأ رفعةً وشأنًا. هذا تأويل رمزي لطيف، لا حكم قاطع ولا فتوى ولا تنبؤ بالغيب.

قواعد صارمة:
- لا فتوى، لا تحليل ولا تحريم، لا وعد بالغيب. استخدم «قد/غالبًا/يُقرأ/يميل».
- لا تدّعِ أن رؤية الاسم تعني حتمًا شخصًا بعينه؛ فقد تكون إشارة إلى معنى الاسم في حياة الرائي.
- للأسماء المقترنة بأنبياء (يوسف، إبراهيم، آدم، نوح...) اذكر البُعد الكريم للاسم ومعناه بأدب، دون خوض في رؤية النبي نفسه (لها بابها الخاص). لا تنسب للنبي كلامًا ولا تجزم بغيب.
- لأسماء مثل محمد/أحمد: عظّم بركة الاسم ومعناه المحمود بأدب، ووضّح أن رؤية «اسم» مبارك تختلف عن رؤية النبي ﷺ نفسه.
- ممنوع الشرطة الطويلة (—,–). جمل قصيرة مريحة على الهاتف. عربية فصحى سليمة. بلا كليشيهات AI.
- لا تُرهب ولا تُيئّس؛ نبرة دافئة مطمئنة.

أعد المحتوى عبر الأداة فقط.`;

const TOOL = {
  name: "save_name",
  description: "احفظ محتوى صفحة الاسم.",
  input_schema: {
    type: "object",
    properties: {
      metaDescription: { type: "string", description: "120-165 حرفًا، يبدأ بـ«تفسير رؤية اسم …»" },
      quickAnswer: { type: "string", description: "45-70 كلمة، جواب مباشر عن معنى رؤية الاسم" },
      meaningLong: { type: "string", description: "فقرة 40-70 كلمة عن معنى الاسم لغةً وأصله ودلالته" },
      inDream: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3, description: "3 فقرات: (1) تأويل الاسم بمعناه في التراث، (2) كيف يتغيّر بحسب سياق الرؤيا والشعور، (3) دلالة سماع الاسم أو مناداة به أو كتابته" },
      forHer: { type: "string", description: "40-70 كلمة: دلالة رؤية هذا الاسم أو التسمّي به للمرأة/العزباء/الحامل حسب ما يناسب" },
      positive: { type: "string", description: "40-70 كلمة: الإشارات الطيبة" },
      advice: { type: "string", description: "35-60 كلمة: نصيحة لطيفة عملية" },
      faq: {
        type: "array", minItems: 4, maxItems: 4,
        items: { type: "object", properties: { q: { type: "string" }, a: { type: "string" } }, required: ["q", "a"] },
        description: "أسئلة بنمط «ما تفسير رؤية اسم X في المنام؟/هل …؟» وإجابات 40-70 كلمة",
      },
    },
    required: ["metaDescription", "quickAnswer", "meaningLong", "inDream", "forHer", "positive", "advice", "faq"],
  },
};

async function gen(item, attempt = 0) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: H,
    body: JSON.stringify({
      model: MODEL, max_tokens: 3000, thinking: { type: "disabled" },
      system: SYS, tools: [TOOL], tool_choice: { type: "tool", name: "save_name" },
      messages: [{ role: "user", content: `الاسم: «${item.name}» (${item.translit}). النوع: ${item.gender === "m" ? "ذكر" : "أنثى"}. الأصل: ${item.origin}. المعنى اللغوي: ${item.meaning}.` }],
    }),
  });
  if (r.status === 429 || r.status >= 500) { if (attempt > 5) throw new Error("retry"); await new Promise((res) => setTimeout(res, 4000 * (attempt + 1))); return gen(item, attempt + 1); }
  if (!r.ok) throw new Error(item.slug + " HTTP " + r.status + " " + (await r.text()).slice(0, 200));
  const d = await r.json();
  const tu = (d.content || []).find((b) => b.type === "tool_use");
  if (!tu) throw new Error(item.slug + " brak tool_use");
  const v = tu.input;
  // forced tool-use bywa zwraca tablice jako string z JSON (albo prozę) — odpakuj i zwaliduj
  const asArr = (x) => { if (Array.isArray(x)) return x; if (typeof x === "string") { try { const p = JSON.parse(x); if (Array.isArray(p)) return p; } catch {} } return null; };
  v.inDream = asArr(v.inDream);
  v.faq = asArr(v.faq);
  // fallback: inDream jako proza → podziel na 3 zbalansowane akapity po zdaniach
  if (!Array.isArray(v.inDream) && typeof tu.input.inDream === "string") {
    const sents = tu.input.inDream.split(/(?<=[.؟!])\s+/).filter((s) => s.trim().length > 0);
    if (sents.length >= 3) {
      const per = Math.ceil(sents.length / 3);
      v.inDream = [sents.slice(0, per).join(" "), sents.slice(per, per * 2).join(" "), sents.slice(per * 2).join(" ")].filter(Boolean);
    }
  }
  const okDream = Array.isArray(v.inDream) && v.inDream.length >= 3 && v.inDream.every((p) => typeof p === "string" && p.length >= 20);
  const okFaq = Array.isArray(v.faq) && v.faq.length >= 4 && v.faq.every((f) => f && f.q && f.a);
  if (!okDream || !okFaq) {
    if (attempt > 5) throw new Error(item.slug + " walidacja (inDream/faq) po retry");
    return gen(item, attempt + 1); // model stochastyczny — ponów po niepoprawnej strukturze
  }
  return v;
}

const todo = SEED.filter((it) => !content[it.slug]);
console.log(`imion: ${SEED.length}, treść mają: ${SEED.length - todo.length}, do zrobienia: ${todo.length}`);

let ok = 0, fail = 0, i = 0;
async function worker() {
  while (i < todo.length) {
    const it = todo[i++];
    try { content[it.slug] = await gen(it); ok++; }
    catch (e) { fail++; console.log("✗", it.slug, String(e).slice(0, 120)); }
    if ((ok + fail) % 10 === 0) { writeFileSync(CONTENT_OUT, JSON.stringify(content)); console.log("…", ok + fail, "/", todo.length); }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
writeFileSync(CONTENT_OUT, JSON.stringify(content));
console.log(`DONE ok:${ok} fail:${fail} | metadanych:${meta.length}`);
