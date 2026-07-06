// Buduje katalog haseł z master-CSV → src/data/catalog.json (jedna tablica,
// lekka: slug/phrase/parent/category/priority/type). To „uniwersum" stron;
// treść (ciężka) trzymamy osobno, dzielona na pliki per rodzic.
// Uruchom: node scripts/build-catalog.mjs "C:/.../sennik_tv.csv"

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CSV = process.argv[2] || "C:/Users/Administrator/Downloads/sennik_tv.csv";
const OUT = join(ROOT, "src", "data", "catalog.json");

const PL = { ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z" };
function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (c) => PL[c] ?? c)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const raw = readFileSync(CSV, "utf8").replace(/^﻿/, "");
const lines = raw.split(/\r?\n/).filter((l) => l.trim());
const header = lines[0].split(";");
const col = (name) => header.indexOf(name);
const iTyp = col("typ"),
  iGl = col("fraza_glowna"),
  iFraza = col("fraza"),
  iKat = col("kategoria"),
  iSlug = col("slug"),
  iPrio = col("priorytet_seo");

const entries = [];
const seen = new Set();
let dupes = 0;
for (let i = 1; i < lines.length; i++) {
  const c = lines[i].split(";");
  if (c.length < header.length) continue;
  const bareSlug = c[iSlug].replace(/^\/sen\//, "").replace(/\/$/, "").trim();
  if (!bareSlug) continue;
  if (seen.has(bareSlug)) {
    dupes++;
    continue;
  }
  seen.add(bareSlug);
  entries.push({
    slug: bareSlug,
    phrase: c[iFraza].trim(),
    parent: slugify(c[iGl].trim()),
    category: c[iKat].trim(),
    priority: Number(c[iPrio]) || 3,
    type: c[iTyp].trim() === "fraza główna" ? "symbol" : "combo",
  });
}

// Walidacja: czy każdy rodzic (parent) ma własny wpis symbolu w katalogu?
const bySlug = new Map(entries.map((e) => [e.slug, e]));
const parents = new Set(entries.map((e) => e.parent));
const orphanParents = [...parents].filter((p) => !bySlug.has(p));

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(entries));
console.log(`Katalog: ${entries.length} haseł, ${parents.size} rodziców, ${dupes} duplikatów pominięto.`);
console.log(`Rodzice bez własnej strony symbolu: ${orphanParents.length}`);
if (orphanParents.length) console.log("  np.:", orphanParents.slice(0, 10).join(", "));
console.log(`Zapisano: ${OUT} (${Math.round(readFileSync(OUT).length / 1024)} KB)`);
