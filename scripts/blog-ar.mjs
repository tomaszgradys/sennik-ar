// ترجمة مقالات المدونة الثلاثة PL -> AR عبر نداءات messages مباشرة، مع slug عربي.
// يحافظ على البنية؛ sources تبقى كما هي (استشهادات)، related يُستبدل بروابط عربية صالحة.
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BLOG = join(ROOT, "src", "data", "blog");
const MODEL = "claude-sonnet-5";

for (const l of readFileSync(join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const H = { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" };

const CATEGORY_AR = "تفسير الأحلام";
const POSTS = [
  {
    pl: "sny-o-bylym-partnerze",
    slug: "الحلم-بالحبيب-السابق",
    img: "الحلم-بالحبيب-السابق",
    related: [
      { href: "/sny/%D9%86%D8%A7%D8%B3-%D9%88%D8%B9%D9%84%D8%A7%D9%82%D8%A7%D8%AA/", label: "أحلام عن الناس والعلاقات" },
      { href: "/", label: "تفسير الأحلام" },
    ],
  },
  {
    pl: "dlaczego-snia-nam-sie-zmarli",
    slug: "لماذا-نحلم-بالاموات",
    img: "لماذا-نحلم-بالاموات",
    related: [
      { href: "/sny/%D9%85%D8%AE%D8%A7%D8%B7%D8%B1-%D9%88%D9%85%D8%B4%D8%A7%D8%B9%D8%B1-%D9%88%D8%A3%D8%AD%D8%AF%D8%A7%D8%AB/", label: "أحلام عن المخاطر والمشاعر" },
      { href: "/", label: "تفسير الأحلام" },
    ],
  },
  {
    pl: "dlaczego-zapominamy-sny",
    slug: "لماذا-ننسي-الاحلام",
    img: "لماذا-ننسي-الاحلام",
    related: [
      { href: "/blog/", label: "المدونة" },
      { href: "/", label: "تفسير الأحلام" },
    ],
  },
];

const SYSTEM = `أنت مترجم ومحرّر مدونة لموقع تفسير أحلام عربي (hulm.pro). تترجم مقالًا من البولندية إلى
العربية الفصحى الطبيعية، بنبرة هادئة دافئة تجمع بين علم نفس النوم وتراث تعبير الرؤى، بلا ترهيب
وبلا أحكام قاطعة. حافظ التام على بنية JSON وأسماء الحقول وأطوال المصفوفات. ممنوع الشرطات
الطويلة داخل الجمل. أعِد JSON صالحًا فقط بلا markdown وبلا أسطر خام داخل السلاسل وبلا علامات
اقتباس مستقيمة داخل القيم (استخدم «» أو ').`;

function userPrompt(obj) {
  return `ترجم حقول هذا المقال إلى العربية. أعِد JSON بالحقول نفسها تحديدًا:
{ "title": "...", "h1": "...", "metaDescription": "...", "excerpt": "...", "intro": "...",
  "sections": [{"h2":"...","paragraphs":["..."]}], "takeaways": ["..."], "faq": [{"q":"...","a":"..."}] }
حافظ على عدد الفقرات وعناصر المصفوفات كما في الأصل. metaDescription بين 140 و165 حرفًا.

الأصل (بولندي):
${JSON.stringify({ title: obj.title, h1: obj.h1, metaDescription: obj.metaDescription, excerpt: obj.excerpt, intro: obj.intro, sections: obj.sections, takeaways: obj.takeaways, faq: obj.faq })}`;
}

function parseDirect(data) {
  const text = (data.content || []).map((b) => b.text ?? "").join("");
  let s = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  s = s.replace(/[\u2013\u2014]/g, " ").replace(/[\u0000-\u001f]+/g, " ");
  return JSON.parse(s);
}

async function translate(obj) {
  const body = JSON.stringify({ model: MODEL, max_tokens: 8000, system: SYSTEM, messages: [{ role: "user", content: userPrompt(obj) }] });
  for (let a = 1; a <= 4; a++) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: H, body });
      if (res.ok) return parseDirect(await res.json());
      if (res.status >= 500 || res.status === 429) { await new Promise((r) => setTimeout(r, a * 5000)); continue; }
      throw new Error(`${res.status}: ${(await res.text()).slice(0, 150)}`);
    } catch (e) { if (a === 4) throw e; await new Promise((r) => setTimeout(r, a * 5000)); }
  }
}

const index = [];
for (const p of POSTS) {
  const src = JSON.parse(readFileSync(join(BLOG, `${p.pl}.json`), "utf8"));
  console.log(`ترجمة: ${p.pl} -> ${p.slug}…`);
  const tr = await translate(src);
  const post = {
    slug: p.slug,
    title: tr.title,
    h1: tr.h1,
    metaDescription: tr.metaDescription,
    excerpt: tr.excerpt,
    date: src.date,
    category: CATEGORY_AR,
    readMinutes: src.readMinutes,
    hero: true,
    img: p.img,
    intro: tr.intro,
    sections: tr.sections,
    takeaways: tr.takeaways,
    faq: tr.faq,
    sources: src.sources || [],
    related: p.related,
  };
  writeFileSync(join(BLOG, `${p.slug}.json`), JSON.stringify(post));
  index.push({ slug: p.slug, title: post.title, excerpt: post.excerpt, date: post.date, category: CATEGORY_AR, readMinutes: post.readMinutes, hero: true, img: p.img });
  console.log(`  تم (${tr.sections?.length} أقسام، ${tr.faq?.length} أسئلة).`);
}

// ترتيب حسب التاريخ تنازليًا
index.sort((a, b) => (a.date < b.date ? 1 : -1));
writeFileSync(join(BLOG, "_index.json"), JSON.stringify(index));

// حذف ملفات PL القديمة
for (const p of POSTS) { const f = join(BLOG, `${p.pl}.json`); if (existsSync(f)) unlinkSync(f); }
console.log(`تم بناء _index.json (${index.length} مقالات) وحذف ملفات PL.`);
