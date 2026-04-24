import Link from "next/link";

/**
 * Persistent, non-dismissible banner shown at the top of /story and /report.
 * Reminds the user that DNAI is informational only and not a medical device.
 * SaMD compliance: this banner must remain visible even when the user
 * scrolls through clinical content.
 */
export function MedicalDisclaimerBanner({
  tone = "paper",
}: {
  tone?: "paper" | "ink";
}) {
  const isInk = tone === "ink";
  return (
    <div
      className={
        isInk
          ? "sticky top-0 z-30 border-b border-paper/15 bg-[#1a1613] px-4 py-2 text-[11px] text-paper/70 backdrop-blur"
          : "sticky top-0 z-30 border-b border-ink/10 bg-paper/95 px-4 py-2 text-[11px] text-ink/65 backdrop-blur"
      }
      role="note"
      aria-label="Avertissement — DNAI n'est pas un diagnostic médical"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center leading-relaxed">
        <span className="font-medium tracking-wide">
          <span className={isInk ? "text-oxblood" : "text-oxblood"}>●</span> Information issue de la littérature —{" "}
          <strong>pas un diagnostic médical</strong>, ne remplace pas une consultation ni un test clinique
          accrédité.
        </span>
        <Link
          href="/legal/notice"
          className={isInk ? "underline underline-offset-2 hover:text-paper" : "underline underline-offset-2 hover:text-ink"}
        >
          Mentions légales
        </Link>
      </div>
    </div>
  );
}
