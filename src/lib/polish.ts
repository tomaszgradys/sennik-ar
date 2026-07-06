import type { Gender } from "./types";

// Uproszczona odmiana przymiotnika/imiesłowu przez rodzaj.
// Reguła: forma męska kończy się na -y/-i; ucinamy końcówkę i doklejamy:
//   żeński -> -a, nijaki -> -e, mnogi (niemęskoosobowy) -> -e.
// Przykłady: czarny -> czarna/czarne, duży -> duża/duże,
//            szczekający -> szczekająca/szczekające, zły -> zła/złe.
export function agreeAdj(masc: string, gender: Gender): string {
  if (gender === "m") return masc;
  const stem = masc.replace(/[yi]$/, "");
  if (gender === "f") return stem + "a";
  return stem + "e"; // n oraz pl
}

// Miejscownik przymiotnika po "o" (do H1 "znaczenie snu o czarnym kocie"):
// czarny -> czarnym (m/n) / czarnej (f) / czarnych (pl); tani -> tanim/taniej/tanich.
export function locAdj(masc: string, gender: Gender): string {
  const soft = masc.endsWith("i");
  const stem = masc.replace(/[yi]$/, "");
  if (gender === "f") return stem + (soft ? "iej" : "ej");
  if (gender === "pl") return stem + (soft ? "ich" : "ych");
  return stem + (soft ? "im" : "ym");
}

// "pojawił się" uzgodnione z rodzajem — do meta description wg wzorca
// "W Twoim śnie pojawił się kot?".
export function appearedVerb(gender: Gender): string {
  return { m: "pojawił się", f: "pojawiła się", n: "pojawiło się", pl: "pojawiły się" }[
    gender
  ];
}

// "Śnił ci się" uzgodnione z rodzajem — do tytułu social (OG).
export function dreamedVerb(gender: Gender): string {
  return { m: "Śnił ci się", f: "Śniła ci się", n: "Śniło ci się", pl: "Śniły ci się" }[
    gender
  ];
}

// تحويل العبارة إلى slug صالح للمسار. عربي: نزيل التشكيل والتطويل، نوحّد
// (آ أ إ -> ا، ة -> ه، ى -> ي)، ونبقي الحروف العربية + اللاتينية + الأرقام.
// يجب أن تطابق هذه الدالة slugify في scripts/batch-ar.mjs.
export function slugify(input: string): string {
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

// الحرف الأول (لا وجود لأحرف كبيرة بالعربية، فتبقى العبارة كما هي).
export function capitalize(input: string): string {
  return input.charAt(0).toUpperCase() + input.slice(1);
}

// فك ترميز param المسار. Next 16 (Turbopack) قد يمرّر slug مُرمَّزًا بالنسبة المئوية
// (%D9%83…) دون فك، فلا يطابق سلاگ الكتالوج العربي. آمن على السلاگ اللاتيني/المفكوك.
export function decodeSlug(s: string): string {
  try {
    return s.includes("%") ? decodeURIComponent(s).normalize("NFC") : s;
  } catch {
    return s;
  }
}
