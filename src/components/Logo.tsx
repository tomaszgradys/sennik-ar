import Link from "next/link";

// Logo marki sennik.tv: znak (księżyc + gwiazda + chmura) + wordmark odtworzony
// w HTML, żeby dostosowywał się do trybu jasny/ciemny (navy/krem) i używał
// markowych kolorów. Font display = Cormorant (zgodny ze stylem brandu).
export default function Logo() {
  return (
    <Link href="/" aria-label="sennik.tv — strona główna" className="flex items-center gap-2.5 no-underline">
      {/* eslint-disable-next-line @next/next/no-img-element -- statyczny znak marki */}
      <img
        src="/brand/sennik-tv-mark.svg"
        alt="sennik.tv"
        width={38}
        height={38}
        className="h-9 w-9 shrink-0"
      />
      <span
        className="font-display text-xl font-semibold leading-none tracking-tight sm:text-2xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        <span style={{ color: "var(--text)" }}>sennik</span>
        <span style={{ color: "var(--gold)" }}>.</span>
        <span style={{ color: "var(--accent)" }}>tv</span>
      </span>
    </Link>
  );
}
