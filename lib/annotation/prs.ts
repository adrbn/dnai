import type {
  Base,
  GenotypeMap,
  PRSFinding,
  PRSRule,
  PRSRuleSNP,
} from "../types";
import { isNoCall } from "../types";
import { complement } from "../genotype";

/**
 * Polygenic Risk Score annotator.
 *
 * For each PRS rule we compute:
 *   score = Σ w_i × dosage_i   (dosage ∈ {0,1,2} copies of effect allele)
 * and assuming Hardy–Weinberg at each locus:
 *   popMean = Σ w_i × 2·p_i
 *   popVar  = Σ w_i² × 2·p_i·(1-p_i)
 * => z = (score - popMean) / sqrt(popVar)
 * Missing genotypes are imputed with the expected dosage 2·p_i so that the
 * score stays unbiased. Coverage is reported separately.
 */

function dosageOf(g: { a1: Base; a2: Base }, effect: Base): number {
  let d = 0;
  if (g.a1 === effect) d++;
  if (g.a2 === effect) d++;
  return d;
}

function tryBothStrands(
  g: { a1: Base; a2: Base },
  effect: Base,
): number | null {
  // direct
  if (g.a1 === effect || g.a2 === effect || bothMatchRef(g, effect)) {
    return dosageOf(g, effect);
  }
  // try complement — handles strand-flipped arrays
  const eff2 = complement(effect) as Base;
  if (g.a1 === eff2 || g.a2 === eff2) return dosageOf(g, eff2);
  // observed bases don't include either strand of effect allele at all →
  // treat as dosage 0 on the effect allele
  return 0;
}

function bothMatchRef(g: { a1: Base; a2: Base }, effect: Base): boolean {
  // if genotype is homozygous for something other than effect, dosage is 0
  return g.a1 === g.a2 && g.a1 !== effect;
}

function normalCdf(z: number): number {
  // Abramowitz–Stegun approximation for Φ(z)
  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z);
  const t = 1 / (1 + p * x);
  const phi = (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
  const cdf = 1 - phi * (b1 * t + b2 * t ** 2 + b3 * t ** 3 + b4 * t ** 4 + b5 * t ** 5);
  return 0.5 * (1 + sign * (2 * cdf - 1));
}

export function annotatePRS(genotypes: GenotypeMap, rules: PRSRule[]): PRSFinding[] {
  const out: PRSFinding[] = [];
  for (const rule of rules) {
    let score = 0;
    let popMean = 0;
    let popVar = 0;
    let matched = 0;
    const contributors: PRSFinding["contributors"] = [];

    for (const snp of rule.snps) {
      const expected = 2 * snp.af;
      const varTerm = snp.weight ** 2 * 2 * snp.af * (1 - snp.af);
      popMean += snp.weight * expected;
      popVar += varTerm;

      const g = genotypes.get(snp.rsid);
      let dosage: number | null = null;
      let observed: string | null = null;
      if (g && !isNoCall(g)) {
        const d = tryBothStrands(g, snp.effect);
        if (d !== null) {
          dosage = d;
          observed = `${g.a1}${g.a2}`;
          matched++;
        }
      }

      const dosageUsed = dosage ?? expected;
      const contribution = snp.weight * dosageUsed;
      score += contribution;
      contributors.push({
        rsid: snp.rsid,
        effect: snp.effect,
        weight: snp.weight,
        observed,
        dosage,
        contribution,
      });
    }

    const popSd = Math.sqrt(Math.max(popVar, 1e-12));
    const zScore = (score - popMean) / popSd;
    const percentile = normalCdf(zScore) * 100;
    const coverage = rule.snps.length > 0 ? matched / rule.snps.length : 0;

    out.push({
      rule,
      score,
      popMean,
      popSd,
      zScore,
      percentile,
      coverage,
      matched,
      total: rule.snps.length,
      contributors,
    });
  }
  // Sort so high-percentile findings surface first
  out.sort((a, b) => b.percentile - a.percentile);
  return out;
}
