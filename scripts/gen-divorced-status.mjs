// Dokłada byStatus.divorced (تفسير حلم X للمطلقة) do wszystkich opublikowanych symboli
// z istniejącym byStatus. Wznawialny (pomija wpisy, które już mają divorced).
//   node scripts/gen-divorced-status.mjs [--limit N]
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT_DIR = join(ROOT, "src", "data", "content");
const MODEL = "claude-sonnet-5";
const CONCURRENCY = 8;

for (const l of readFileSync(join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const H = { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" };

const CATALOG = JSON.parse(readFileSync(join(ROOT, "src/data/catalog.json"), "utf8"));
const phraseOf = new Map(CATALOG.map((e) => [e.slug, e.phrase]));

const SYSTEM = `أنت كاتب قاموس أحلام عربي (hulm.pro) وأخصائي نفسي. تكتب بعربية فصحى دافئة هادئة تجمع بين
علم النفس وتراث تعبير الرؤى (ابن سيرين، النابلسي) حين يناسب، دون أحكام فقهية ودون ترهيب أو تنبؤ قاطع،
ودون أي تنميط أو وصم للمطلقة؛ نبرة كريمة محترمة تفتح باب الأمل (بداية جديدة، استقلال، تعافٍ، رزق،
أبناء إن ناسب). ممنوع الشرطة الطويلة (—,–). أجب بالنص المطلوب فقط، بلا JSON وبلا مقدمات.`;

async function gen(phrase) {
  const body = JSON.stringify({
    model: MODEL, max_tokens: 500, system: SYSTEM,
    messages: [{ role: "user", content: `اكتب فقرة واحدة 45-75 كلمة تبدأ حرفيًا بـ«تفسير حلم ${phrase} للمطلقة» تشرح دلالة هذا الحلم لامرأة مطلقة، بمعنى خاص بحالها فعلًا (لا كلام عام).` }],
  });
  for (let a = 1; a <= 4; a++) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: H, body });
      if (res.ok) {
        const data = await res.json();
        const text = (data.content || []).map((b) => b.text ?? "").join("").trim().replace(/[–—]/g, " ").replace(/\s+/g, " ");
        if (text.length < 60) throw new Error("za krótkie");
        return text;
      }
      if (res.status >= 500 || res.status === 429) { await new Promise((r) => setTimeout(r, a * 5000)); continue; }
      throw new Error(`${res.status}`);
    } catch (e) { if (a === 4) throw e; await new Promise((r) => setTimeout(r, a * 4000)); }
  }
}

const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg >= 0 ? Number(process.argv[limitArg + 1]) : Infinity;

// zadania: [plik, slug] — wpisy z byStatus bez divorced
const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".json") && !f.startsWith("_"));
const jobs = [];
for (const f of files) {
  const j = JSON.parse(readFileSync(join(CONTENT_DIR, f), "utf8"));
  for (const slug of Object.keys(j)) {
    const e = j[slug];
    if (e && e.byStatus && e.byStatus.single && !e.byStatus.divorced) jobs.push({ f, slug });
  }
}
const todo = jobs.slice(0, LIMIT);
console.log(`byStatus bez divorced: ${jobs.length}, robię: ${todo.length}`);

// grupuj per plik żeby uniknąć wyścigów zapisu
const byFile = new Map();
for (const t of todo) (byFile.get(t.f) || byFile.set(t.f, []).get(t.f)).push(t.slug);
const fileQueue = [...byFile.entries()];
let ok = 0, fail = 0;
async function worker() {
  while (fileQueue.length) {
    const [f, slugs] = fileQueue.shift();
    const p = join(CONTENT_DIR, f);
    const j = JSON.parse(readFileSync(p, "utf8"));
    let touched = false;
    for (const slug of slugs) {
      const phrase = phraseOf.get(slug) || slug.replace(/-/g, " ");
      try {
        j[slug].byStatus.divorced = await gen(phrase);
        touched = true; ok++;
      } catch (e) { fail++; console.log("✗", slug, String(e.message).slice(0, 80)); }
      if ((ok + fail) % 200 === 0) console.log("progress", ok + fail, "/", todo.length, "fail:", fail, new Date().toISOString());
    }
    if (touched) writeFileSync(p, JSON.stringify(j));
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
console.log(`DONE ok:${ok} fail:${fail}`);
