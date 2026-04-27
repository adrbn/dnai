import { splitClinicalNote } from "@/lib/disclaimer-split";
import type { Lang } from "@/lib/i18n/lang";

interface ClinicalNoteProps {
  text: string | undefined | null;
  /** Optional override classes for the body paragraph. */
  bodyClassName?: string;
  /** Optional override classes for the warning callout container. */
  calloutClassName?: string;
  /** Render only the body, hiding the source/ack callout (e.g. in compact tables). */
  compact?: boolean;
  /** Language for the source/ack callout (body text stays as authored). */
  lang?: Lang;
}

/**
 * Renders a clinical note where the literature source + SaMD acknowledgement
 * appear as a separate amber warning callout below the descriptive body.
 */
export function ClinicalNote({
  text,
  bodyClassName,
  calloutClassName,
  compact,
  lang = "fr",
}: ClinicalNoteProps) {
  const { body, source, ack } = splitClinicalNote(text, lang);
  if (!body && !source && !ack) return null;

  return (
    <div className="space-y-3">
      {body && (
        <p className={bodyClassName ?? "text-sm text-fg-muted"}>{body}</p>
      )}
      {!compact && (source || ack) && (
        <div
          className={
            calloutClassName ??
            "rounded-lg border border-amber-300/60 bg-amber-50/80 px-3 py-2 text-[11px] leading-relaxed text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
          }
          role="note"
        >
          <span className="mr-1.5" aria-hidden>⚠️</span>
          {source && <span className="font-medium">{source}.</span>}
          {source && ack && " "}
          {ack && <span>{ack}</span>}
        </div>
      )}
    </div>
  );
}
