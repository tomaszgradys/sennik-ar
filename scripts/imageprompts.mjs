// Generuje ANGIELSKIE opisy scen do ilustracji dla wszystkich 769 symboli
// (FLUX nie rozumie polskiego -> stąd błędne obrazki). Zapis: _imageprompts.json.
// Uruchom: node scripts/imageprompts.mjs

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src", "data", "content", "_imageprompts.json");
const CATALOG = JSON.parse(readFileSync(join(ROOT, "src", "data", "catalog.json"), "utf8"));
const MODEL = "claude-sonnet-5";
const CHUNK = 50;
const CONCURRENCY = 4;

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
if (!KEY) throw new Error("Brak ANTHROPIC_API_KEY");

const symbols = CATALOG.filter((e) => e.type === "symbol");
const existing = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
const todo = symbols.filter((s) => !existing[s.slug]);
console.log(`Opisy do wygenerowania: ${todo.length}/${symbols.length}`);

function chunks(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

const SYSTEM = `You translate Polish dream-symbol words into short ENGLISH image scene
descriptions for an illustrator. For each item give a concrete, recognizable scene of
6-12 words (a clear subject). For abstract concepts (emotions, ideas) invent a simple
symbolic scene. No style words. Return ONLY valid JSON, an object mapping the given id
to the English scene. No markdown.`;

async function doChunk(list) {
  const items = list.map((s) => `${s.slug}: ${s.phrase}`).join("\n");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Polish dream symbols (id: phrase). Return JSON {id: "english scene"} for each:\n${items}`,
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`${res.status}: ${(await res.text()).slice(0, 150)}`);
  const data = await res.json();
  const text = data.content.map((b) => b.text ?? "").join("");
  const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
  let n = 0;
  for (const s of list) if (json[s.slug]) (existing[s.slug] = json[s.slug]), n++;
  return n;
}

const groups = chunks(todo, CHUNK);
let done = 0;
async function pool() {
  while (groups.length) {
    const g = groups.shift();
    try {
      const n = await doChunk(g);
      done += n;
      writeFileSync(OUT, JSON.stringify(existing));
      console.log(`  …${done}/${todo.length}`);
    } catch (e) {
      console.log(`  ✗ chunk: ${e.message}`);
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, pool));
console.log(`Gotowe: ${Object.keys(existing).length} opisów. Teraz: images.mjs --force`);
