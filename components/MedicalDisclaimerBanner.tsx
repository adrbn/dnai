import Link from "next/link";
import { S, tr } from "@/lib/i18n/strings";
import type { Lang } from "@/lib/i18n/lang";

/**
 * Persistent, non-dismissible banner shown at the top of /story and /report.
 * Reminds the user that DNAI is informational only and not a medical device.
 * SaMD compliance: this banner must remain visible even when the user
 * scrolls through clinical content.
 */
export function MedicalDisclaimerBanner({
  tone = "paper",
  lang = "fr",
}: {
  tone?: "paper" | "ink";
  lang?: Lang;
}) {
  const isInk = tone === "ink";
  // The banner must sit above EVERY other sticky/fixed element on the
  // dependent pages (report nav at z-30, story header fixed at z-30).
  // We use z-[60] + an explicit relative z-[60] on the link itself so even
  // if a downstream element creates an unexpected stacking context, the
  // "Legal notice" link remains pointer-event eligible.
  const noticeHref = lang === "en" ? "/legal/en/notice" : "/legal/notice";
  return (
    <div
      className={
        isInk
          ? "sticky top-0 z-[60] border-b border-paper/15 bg-[#1a1613] px-4 py-2 text-[11px] text-paper/70 backdrop-blur"
          : "sticky top-0 z-[60] border-b border-ink/10 bg-paper/95 px-4 py-2 text-[11px] text-ink/65 backdrop-blur"
      }
      role="note"
      aria-label={tr(S.banner.aria, lang)}
    >
      <div className="relative z-[60] mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center leading-relaxed">
        <span className="font-medium tracking-wide">
          <span className="text-oxblood">●</span> {tr(S.banner.lead, lang)}{" "}
          <strong>{tr(S.banner.strong, lang)}</strong>
          {tr(S.banner.tail, lang)}
        </span>
        <Link
          href={noticeHref}
          className={
            isInk
              ? "relative z-[60] underline underline-offset-2 hover:text-paper"
              : "relative z-[60] underline underline-offset-2 hover:text-ink"
          }
        >
          {tr(S.banner.link, lang)}
        </Link>
      </div>
    </div>
  );
}
