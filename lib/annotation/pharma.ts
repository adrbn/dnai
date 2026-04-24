import { matchAllele } from "../genotype";
import {
  GenotypeMap,
  PGxRule,
  PharmaByDrug,
  PharmaFinding,
  Severity,
} from "../types";

const SEVERITY_RANK: Record<Severity, number> = { low: 1, medium: 2, high: 3 };

function maxSeverity(a: Severity, b: Severity): Severity {
  return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}

/**
 * SaMD compliance: reformulate imperative medical advice ("évitez",
 * "recommandée", "alternative indiquée") into descriptive literature
 * references ("la littérature associe…", "CPIC décrit…"). The app must
 * never appear to prescribe or recommend — only quote published
 * genotype-drug associations.
 */
function softenEffect(raw: string): string {
  if (!raw) return raw;
  let s = raw;
  // Imperative → descriptive
  s = s.replace(/\balternative\s+\(([^)]+)\)\s+(?:recommand[ée]e|indiqu[ée]e|préf[ée]rable)\b/gi, "des alternatives ($1) sont mentionnées");
  s = s.replace(/\balternative\s+([^;.]*?)\s+(?:recommand[ée]e|indiqu[ée]e|préf[ée]rable)\b/gi, "une alternative $1 est décrite");
  s = s.replace(/\balternative\s+(?:recommand[ée]e|indiqu[ée]e|préf[ée]rable)\b/gi, "une alternative est décrite");
  s = s.replace(/\b[Aa]dapter ou contre-indiquer\b/gi, "adaptation ou contre-indication mentionnée");
  s = s.replace(/\b[Cc]ontre-indiquer?\b/gi, "contre-indication décrite");
  s = s.replace(/\b[Aa]dapter la (?:dose|posologie)\b/gi, "une adaptation de posologie est décrite");
  s = s.replace(/\b[Aa]dapter\b/gi, "adaptation mentionnée");
  s = s.replace(/\b[Tt]oxicité sévère\b/gi, "toxicité sévère rapportée");
  s = s.replace(/\b[Dd]ébuter à demi-dose\b/gi, "un début à demi-dose est décrit");
  s = s.replace(/\b[Ee]nvisager\s+/gi, "la littérature mentionne ");
  s = s.replace(/\b(?:il est |est |)recommand[ée]e?\s+(?:de\s+|d'|)/gi, "la littérature décrit ");
  s = s.replace(/\bà éviter\b/gi, "signalée comme à risque dans la littérature");
  s = s.replace(/\b[Ée]viter après\b/gi, "consommation tardive signalée à risque après");
  s = s.replace(/\b[Ée]viter\b/gi, "association signalée à risque");
  s = s.replace(/\b[Rr]éduire la dose\b/gi, "une réduction de dose est décrite");
  s = s.replace(/\b[Rr]éduire la posologie\b/gi, "une réduction de posologie est décrite");
  s = s.replace(/\b[Aa]juster la dose\b/gi, "un ajustement de dose est mentionné");
  s = s.replace(/\bajustement de dose\b/gi, "un ajustement de dose est mentionné");
  s = s.replace(/\b[Ss]urveillance\s+(?:recommand[ée]e|indiqu[ée]e|conseill[ée]e|accrue|thérapeutique)\b/gi, "un suivi biologique est décrit");
  s = s.replace(/\b[Ss]urveillance thérapeutique\b/gi, "un suivi biologique est décrit");
  s = s.replace(/\b[Ss]urveiller\b/gi, "un suivi est mentionné");
  s = s.replace(/\b[Cc]hanger de molécule\b/gi, "un changement de molécule est mentionné");
  s = s.replace(/\b[Pp]référer\b/gi, "la littérature mentionne");
  s = s.replace(/\bdevrait être\b/gi, "est décrit comme");
  s = s.replace(/\bdosage guidé\b/gi, "un dosage guidé est décrit");
  // Tidy
  s = s.replace(/\s{2,}/g, " ").trim();
  // Strip trailing punctuation duplication
  s = s.replace(/\.\s*\.$/g, ".");
  if (!s.endsWith(".")) s += ".";
  return `${s} — Source : littérature CPIC/DPWG. Pour information, ne constitue pas une recommandation médicale.`;
}

export type PharmaAnnotateResult = {
  findings: PharmaFinding[];
  byDrug: PharmaByDrug[];
};

export function annotatePharma(
  genotypes: GenotypeMap,
  rules: PGxRule[],
  opts: { tryReverseStrand?: boolean } = {},
): PharmaAnnotateResult {
  const tryReverseStrand = opts.tryReverseStrand ?? true;
  const findings: PharmaFinding[] = [];

  for (const rule of rules) {
    const g = genotypes.get(rule.rsid);
    if (!g) continue;
    const z = matchAllele(g, rule.ref_allele, rule.alt_allele, { tryReverseStrand });
    const outcome =
      z === "ref/ref" || z === "ref/alt" || z === "alt/alt" ? rule.call[z] : null;
    findings.push({ rule, zygosity: z, outcome });
  }

  const byDrugMap = new Map<string, PharmaByDrug>();
  for (const f of findings) {
    if (!f.outcome) continue;
    for (const impl of f.rule.implications) {
      const key = impl.drug.toLowerCase();
      const existing = byDrugMap.get(key);
      if (existing) {
        existing.severity = maxSeverity(existing.severity, impl.severity);
        existing.contributors.push({
          gene: f.rule.gene,
          phenotype: f.outcome.phenotype,
          zygosity: f.zygosity,
        });
        if (existing.severity === impl.severity) {
          existing.effect = softenEffect(impl.effect);
        }
      } else {
        byDrugMap.set(key, {
          drug: impl.drug,
          drug_class: impl.drug_class,
          effect: softenEffect(impl.effect),
          severity: impl.severity,
          contributors: [
            {
              gene: f.rule.gene,
              phenotype: f.outcome.phenotype,
              zygosity: f.zygosity,
            },
          ],
        });
      }
    }
  }

  const byDrug = [...byDrugMap.values()].sort((a, b) => {
    const diff = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
    if (diff !== 0) return diff;
    return a.drug.localeCompare(b.drug);
  });

  return { findings, byDrug };
}
