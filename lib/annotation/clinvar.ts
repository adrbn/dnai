import { genotypeToString, isBase, matchAllele } from "../genotype";
import { ClinVarEntry, ClinVarFinding, GenotypeMap, Zygosity } from "../types";

export type ClinVarAnnotateOptions = {
  minReview?: number; // default 2: criteria provided, multiple submitters
  tryReverseStrand?: boolean; // default true
};

const ZYGOSITY_PRIO: Record<Zygosity, number> = {
  "alt/alt": 0,
  "ref/alt": 1,
  ambiguous: 2,
  "ref/ref": 3,
  nocall: 4,
};

export function annotateClinVar(
  genotypes: GenotypeMap,
  db: ClinVarEntry[],
  opts: ClinVarAnnotateOptions = {},
): ClinVarFinding[] {
  const minReview = opts.minReview ?? 2;
  const tryReverseStrand = opts.tryReverseStrand ?? true;

  const findings: ClinVarFinding[] = [];
  for (const entry of db) {
    if (entry.rev < minReview) continue;
    if (!isBase(entry.ref) || !isBase(entry.alt)) continue;
    const g = genotypes.get(entry.rs);
    if (!g) continue;
    const z = matchAllele(g, entry.ref, entry.alt, { tryReverseStrand });
    if (z === "ref/alt" || z === "alt/alt" || z === "ambiguous") {
      // We report ambiguous as such (rare) so user sees the data honestly
      if (z === "ambiguous") continue; // actually skip ambiguous to avoid noise
      findings.push({ entry, zygosity: z, observed: genotypeToString(g) });
    }
  }

  findings.sort((a, b) => {
    const pa = ZYGOSITY_PRIO[a.zygosity];
    const pb = ZYGOSITY_PRIO[b.zygosity];
    if (pa !== pb) return pa - pb;
    return a.entry.gene.localeCompare(b.entry.gene);
  });

  return findings;
}
