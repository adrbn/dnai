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
          existing.effect = impl.effect;
        }
      } else {
        byDrugMap.set(key, {
          drug: impl.drug,
          drug_class: impl.drug_class,
          effect: impl.effect,
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
