import { ADS } from "@/lib/monetization";

// Ręczny slot reklamowy w treści. Gdy reklamy wyłączone — nie renderuje nic
// (zero pustych dziur w layoucie). Auto Ads (vignette, kotwica) dokłada Google
// samodzielnie przez skrypt w layoucie.
export default function AdSlot({
  slot,
  className = "",
}: {
  slot: keyof typeof ADS.slots;
  className?: string;
}) {
  if (!ADS.enabled || !ADS.client) return null;
  return (
    <div className={`my-6 min-h-[90px] text-center ${className}`} aria-hidden>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADS.client}
        data-ad-slot={ADS.slots[slot] || undefined}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
      <script
        dangerouslySetInnerHTML={{
          __html: "(adsbygoogle=window.adsbygoogle||[]).push({});",
        }}
      />
    </div>
  );
}
