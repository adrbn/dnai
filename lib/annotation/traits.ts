import { normalize, genotypeToString } from "../genotype";
import { GenotypeMap, TraitFinding, TraitRule } from "../types";

function canonical(genoStr: string): string {
  const g = normalize(genoStr);
  return genotypeToString(g);
}

export function annotateTraits(
  genotypes: GenotypeMap,
  rules: TraitRule[],
): TraitFinding[] {
  const findings: TraitFinding[] = [];
  for (const rule of rules) {
    const genotypes_used: Record<string, string | null> = {};
    for (const rsid of rule.rsids) {
      const g = genotypes.get(rsid);
      genotypes_used[rsid] = g ? genotypeToString(g) : null;
    }

    let result: TraitFinding["result"] = null;
    for (const callRule of rule.call_rules) {
      let allMatch = true;
      for (const [rsid, expected] of Object.entries(callRule.when)) {
        const actual = genotypes_used[rsid];
        if (!actual || actual === "--") {
          allMatch = false;
          break;
        }
        if (actual !== canonical(expected)) {
          allMatch = false;
          break;
        }
      }
      if (allMatch) {
        result = callRule.result;
        break;
      }
    }

    findings.push({ rule, result, genotypes_used });
  }
  return findings;
}
