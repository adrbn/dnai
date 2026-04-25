import type { Lang } from "@/lib/i18n/lang";

type Kind = "health" | "pharma" | "prs" | "compare";

const COPY: Record<Lang, Record<Kind, string>> = {
  fr: {
    health: "Variants issus de la littérature ClinVar. Certaines associations restent incertaines — aucune décision clinique ne doit être prise sans un professionnel de santé et une confirmation par un laboratoire agréé.",
    pharma: "Associations CPIC / DPWG. L'effet clinique dépend aussi de l'âge, du poids, de la fonction hépatique / rénale et des interactions. N'ajustez jamais un traitement sans votre médecin ou pharmacien.",
    prs: "Scores polygéniques éducatifs, dérivés d'études majoritairement européennes. Ne sont pas des diagnostics : ils ne prédisent ni la survenue ni l'âge d'une maladie. Précision réduite hors ascendance européenne.",
    compare: "Comparer deux profils illustre les variations individuelles. Aucune relation ne peut être inférée d'un fichier de génotypage — seul un laboratoire peut confirmer une parenté.",
  },
  en: {
    health: "Variants curated from ClinVar literature. Some associations remain uncertain — do not make clinical decisions without a healthcare professional and confirmation by an accredited lab.",
    pharma: "Associations from CPIC / DPWG. Clinical effect also depends on age, weight, hepatic/renal function and drug interactions. Never adjust a treatment without your physician or pharmacist.",
    prs: "Educational polygenic scores, derived from studies predominantly in European ancestry cohorts. Not diagnostics: they neither predict onset nor age of disease. Reduced accuracy outside European ancestry.",
    compare: "Comparing two profiles illustrates individual variation. No relationship can be inferred from a genotyping file — only an accredited lab can confirm kinship.",
  },
};

export function SectionDisclaimer({ kind, lang = "fr" }: { kind: Kind; lang?: Lang }) {
  return (
    <aside
      role="note"
      className="mb-4 rounded-lg border border-border bg-surface-2/40 px-3 py-2 text-[11px] leading-relaxed text-fg-muted"
    >
      {COPY[lang][kind]}
    </aside>
  );
}
