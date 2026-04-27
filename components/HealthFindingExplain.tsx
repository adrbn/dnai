import { explainClinVarFinding } from "@/lib/annotation/clinvar-explain";
import type { ClinVarFinding } from "@/lib/types";
import type { Lang } from "@/lib/i18n/lang";

interface Props {
  finding: ClinVarFinding;
  lang: Lang;
}

/**
 * "En clair" panel for a ClinVar finding.
 *
 * Three blocks:
 *   1. What — what the gene/condition does in lay language
 *   2. Pour vous — what the zygosity means given inheritance
 *   3. Caveat (warn callout) — false-positive risk + non-prescriptive next step
 *
 * Block 3 reuses the same amber palette as the ClinicalNote SaMD callout
 * to stay visually consistent with the rest of the report.
 */
export function HealthFindingExplain({ finding, lang }: Props) {
  const { what, zygosity, caveat } = explainClinVarFinding(finding, lang);
  const labels = LABELS[lang];
  return (
    <div className="mt-4 space-y-3 rounded-lg border border-accent/30 bg-accent/[0.04] p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-accent">
        {labels.heading}
      </div>
      <Block title={labels.what}>{what}</Block>
      <Block title={labels.zygosity}>{zygosity}</Block>
      <div
        className="rounded-md border border-amber-300/60 bg-amber-50/80 px-3 py-2 text-[11.5px] leading-relaxed text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
        role="note"
      >
        <span className="mr-1.5" aria-hidden>⚠️</span>
        <span className="font-medium">{labels.caveat} </span>
        <span>{caveat}</span>
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-fg-muted">
        {title}
      </div>
      <p className="mt-1 text-sm leading-relaxed text-fg">{children}</p>
    </div>
  );
}

const LABELS: Record<Lang, { heading: string; what: string; zygosity: string; caveat: string }> = {
  fr: {
    heading: "En clair",
    what: "Le gène et la maladie",
    zygosity: "Ce que votre génotype signifie",
    caveat: "Précaution :",
  },
  en: {
    heading: "In plain language",
    what: "The gene and the disease",
    zygosity: "What your genotype means",
    caveat: "Caveat:",
  },
};
