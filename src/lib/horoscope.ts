// حظ اليوم: اختيار حتمي لجُمل من مجموعة، مزروع بـ (البرج + التاريخ) — لكل برج نص
// مختلف يوميًا لكنه ثابت خلال اليوم. الأسلوب مختلف عمدًا عن طور القمر: علاقات/مال/طاقة.

export interface ZodiacSign {
  slug: string; // عربي — للمسار
  name: string;
  emoji: string;
  dates: string;
  img: string; // اسم ملف الصورة اللاتيني (public/zodiac/<img>.jpg) — إعادة استخدام صور PL
}

export const SIGNS: ZodiacSign[] = [
  { slug: "الحمل", name: "الحمل", emoji: "♈", dates: "21.03–19.04", img: "baran" },
  { slug: "الثور", name: "الثور", emoji: "♉", dates: "20.04–22.05", img: "byk" },
  { slug: "الجوزاء", name: "الجوزاء", emoji: "♊", dates: "23.05–21.06", img: "blizneta" },
  { slug: "السرطان", name: "السرطان", emoji: "♋", dates: "22.06–22.07", img: "rak" },
  { slug: "الاسد", name: "الأسد", emoji: "♌", dates: "23.07–23.08", img: "lew" },
  { slug: "العذراء", name: "العذراء", emoji: "♍", dates: "24.08–22.09", img: "panna" },
  { slug: "الميزان", name: "الميزان", emoji: "♎", dates: "23.09–22.10", img: "waga" },
  { slug: "العقرب", name: "العقرب", emoji: "♏", dates: "23.10–21.11", img: "skorpion" },
  { slug: "القوس", name: "القوس", emoji: "♐", dates: "22.11–21.12", img: "strzelec" },
  { slug: "الجدي", name: "الجدي", emoji: "♑", dates: "22.12–19.01", img: "koziorozec" },
  { slug: "الدلو", name: "الدلو", emoji: "♒", dates: "20.01–18.02", img: "wodnik" },
  { slug: "الحوت", name: "الحوت", emoji: "♓", dates: "19.02–20.03", img: "ryby" },
];

export const SIGN_BY_SLUG = new Map(SIGNS.map((s) => [s.slug, s]));

// برج تاريخ معيّن (اليوم افتراضيًا). الحدود مطابقة لـ SIGNS (md = mm*100+dd).
const SIGN_RANGES: { slug: string; from: number; to: number }[] = [
  { slug: "الجدي", from: 1222, to: 1231 },
  { slug: "الجدي", from: 101, to: 119 },
  { slug: "الدلو", from: 120, to: 218 },
  { slug: "الحوت", from: 219, to: 320 },
  { slug: "الحمل", from: 321, to: 419 },
  { slug: "الثور", from: 420, to: 522 },
  { slug: "الجوزاء", from: 523, to: 621 },
  { slug: "السرطان", from: 622, to: 722 },
  { slug: "الاسد", from: 723, to: 823 },
  { slug: "العذراء", from: 824, to: 922 },
  { slug: "الميزان", from: 923, to: 1022 },
  { slug: "العقرب", from: 1023, to: 1121 },
  { slug: "القوس", from: 1122, to: 1221 },
];
export function currentSign(date = new Date()): ZodiacSign {
  const md = (date.getMonth() + 1) * 100 + date.getDate();
  const r = SIGN_RANGES.find((x) => md >= x.from && md <= x.to);
  return SIGN_BY_SLUG.get(r?.slug ?? "الحمل")!;
}

const LOVE = [
  "لديك اليوم فرصة للتعرّف على شخص مثير للاهتمام، فلا تختبئ خلف هاتفك.",
  "شخص قريب ينتظر انتباهك. حديث قصير صادق يفعل أكثر من هدية.",
  "يوم مناسب لتوضيح سوء فهم صغير، فالطرف الآخر أكثر انفتاحًا مما تظن.",
  "جاذبيتك اليوم أقوى من المعتاد. استثمرها بلباقة.",
  "بدل التحليل، اسأل مباشرة. الصراحة اليوم تقرّب.",
  "لفتة لطيفة بلا مناسبة ستُذكر اليوم طويلًا.",
  "لا تقارن علاقتك بعلاقات غيرك، فالمظاهر اليوم خادعة.",
  "الوحدة أحيانًا رفيق طيب. افعل اليوم شيئًا لنفسك فقط.",
];

const MONEY = [
  "احذر النفقات الزائدة، فاندفاع الظهيرة قد تندم عليه مساءً.",
  "وقت مناسب لإنهاء مهمة عمل مؤجّلة. سيُقدَّر ذلك أسرع مما تتوقع.",
  "لا توقّع اليوم شيئًا على عجل. ليلة تفكير لا تكلّف شيئًا.",
  "عملك اليوم ملحوظ، فلا تقلّل من إنجازك.",
  "توفير صغير اليوم يعني راحة بعد شهر. تنازل عن نزوة واحدة.",
  "الفكرة التي تعود إليك منذ أسابيع تستحق أول ملاحظة.",
  "التعاون بدل المنافسة، اليوم ببساطة مُجدٍ.",
  "راجع اليوم أمرًا واحدًا في مالك تؤجّله. يستغرق عشر دقائق.",
];

const ENERGY = [
  "طاقتك جيدة، فخطّط لبعض الحركة، ولو نزهة قصيرة بعد الغروب.",
  "جسدك يطلب اليوم ماءً ونومًا، لا قهوة أخرى.",
  "التوتر يتجمّع في الرقبة، ودقيقتان من الإطالة ستحدثان فرقًا.",
  "يوم مناسب لترتيب درج واحد. عقلك سيشعر بذلك أيضًا.",
  "لا تحمّل نفسك كل شيء اليوم. «لا» واحدة تحمي أمسيتك كلها.",
  "تناول فطورك اليوم بلا عجلة، وسيمضي بقية اليوم بإيقاع أهدأ.",
  "قيلولة قصيرة أو لحظة صمت بعد الظهر ستعيد لك أمسيتك مضاعفة.",
  "الهواء الطلق سيحلّ اليوم أكثر مما تحلّه قهوة ثالثة.",
];

const ADVICE = [
  "ثِق بأول خاطر، فحدسك اليوم في حالة جيدة.",
  "ليس كل شيء يستحق ردّك. اختر معركة واحدة.",
  "ابتسامة لغريب ستعود إليك اليوم أسرع مما تظن.",
  "افعل اليوم شيئًا واحدًا ببطء لكن بإتقان.",
  "اطلب المساعدة، فهي علامة قوة لا ضعف.",
  "قليل من اللطف مع نفسك أفضل استثمار لهذا اليوم.",
  "ضع الهاتف جانبًا لساعة. العالم سينتظر وأنت سترتاح.",
  "أنهِ قبل أن تبدأ جديدًا، فشعور الإتمام يمنحك أجنحة.",
];

function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface DailyHoroscope {
  love: string;
  money: string;
  energy: string;
  advice: string;
}

export function dailyHoroscope(signSlug: string, date: Date): DailyHoroscope {
  const day = date.toISOString().slice(0, 10);
  const rnd = mulberry32(hashSeed(`${signSlug}:${day}`));
  const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
  return {
    love: pick(LOVE),
    money: pick(MONEY),
    energy: pick(ENERGY),
    advice: pick(ADVICE),
  };
}
