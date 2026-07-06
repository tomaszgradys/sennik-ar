import Link from "next/link";

// شعار hulm.pro: العلامة (هلال ذهبي فوق سحابة لافندر) + wordmark بأحرف صغيرة
// «hulm.pro» مُعاد في HTML ليتكيّف مع الوضع نهار/ليل ويستخدم ألوان العلامة.
export default function Logo() {
  return (
    <Link href="/" aria-label="hulm.pro — الصفحة الرئيسية" className="flex items-center gap-2.5 no-underline">
      {/* eslint-disable-next-line @next/next/no-img-element -- علامة ثابتة للعلامة التجارية */}
      <img
        src="/brand/hulm-mark.svg"
        alt="hulm.pro"
        width={38}
        height={38}
        className="h-9 w-9 shrink-0"
      />
      <span
        dir="ltr"
        className="text-xl font-extrabold leading-none tracking-tight sm:text-2xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        <span style={{ color: "var(--text)" }}>hulm</span>
        <span style={{ color: "var(--gold)" }}>.</span>
        <span style={{ color: "var(--accent)" }}>pro</span>
      </span>
    </Link>
  );
}
