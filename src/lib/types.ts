// Rodzaj gramatyczny — do odmiany czasownika w tytule social (Śnił/Śniła/Śniło).
export type Gender = "m" | "f" | "n" | "pl";

// Wpis katalogu (z CSV) — lekki, samo „co istnieje i gdzie".
export interface CatalogEntry {
  slug: string; // np. "czarny-kot", "taksowka-pod-woda"
  phrase: string; // np. "czarny kot", "taksówka pod wodą"
  parent: string; // slug rodzica (fraza_glowna), np. "kot", "taksowka"
  category: string;
  priority: number; // 1 = najważniejsze, 3 = długi ogon
  type: "symbol" | "combo"; // symbol główny vs podfraza
}

// Treść strony (pisana raz przez AI, trzymana w pliku rodzica). Tylko tekst +
// gramatyka; ZERO stylów/HTML (rozdzielenie treści od wyglądu).
export interface FaqItem {
  q: string;
  a: string;
}
// Interpretacje wg „حال الرائي" (stanu śniącego) — dominujący wzorzec long-tail
// arabskiego SEO: „تفسير حلم X للعزباء/للمتزوجة/للحامل/للرجل". Opcjonalne (gł. prio 1).
export interface StatusVariants {
  single: string; // للعزباء (niezamężna)
  married: string; // للمتزوجة (mężatka)
  pregnant: string; // للحامل (ciężarna)
  divorced?: string; // للمطلقة (rozwódka) — warstwa dogenerowana w audycie kulturowym 2026-07-10
  man: string; // للرجل (mężczyzna)
}
export interface Content {
  gender: Gender; // rodzaj frazy (do „Śnił/Śniła ci się")
  locative: string; // fraza po „o": kocie / czarnym kocie / taksówce pod wodą
  metaDescription: string;
  quickAnswer: string;
  intro: string;
  paragraphs: string[];
  positive: string;
  negative: string;
  advice: string;
  faq: FaqItem[];
  byStatus?: StatusVariants; // warstwa modyfikatorów statusu (A05)
  ibnSirin?: string; // pasaż na منهج ابن سيرين — pod dominujący modyfikator „لابن سيرين"
}

// Rozwiązane hasło = katalog + treść.
export interface DreamEntry extends CatalogEntry {
  kind: "symbol" | "combo";
  parentPhrase: string;
  content: Content;
}
