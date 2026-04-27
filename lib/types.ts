export type Base = "A" | "C" | "G" | "T";

export type Genotype = {
  a1: Base;
  a2: Base;
};

export type NoCall = { nocall: true };

export function isNoCall(g: Genotype | NoCall): g is NoCall {
  return (g as NoCall).nocall === true;
}

export const NOCALL: NoCall = { nocall: true };

export type GenotypeMap = Map<string, Genotype | NoCall>;

export type Zygosity = "ref/ref" | "ref/alt" | "alt/alt" | "nocall" | "ambiguous";

export type ClinicalSignificance = "P" | "LP" | "P/LP";

export type ClinVarEntry = {
  rs: string;
  gene: string;
  condition: string;
  /** Optional English condition name (falls back to `condition` if absent). */
  condition_en?: string;
  sig: ClinicalSignificance;
  ref: string; // allows SNVs and indels
  alt: string;
  rev: number; // review status stars 0-4
  href?: string;
  note?: string;
  /** Optional English curated note (falls back to `note` if absent). */
  note_en?: string;
};

export type ClinVarFinding = {
  entry: ClinVarEntry;
  zygosity: Exclude<Zygosity, "nocall" | "ref/ref">;
  observed: string; // actual genotype from user's file, e.g. "GG", "AG"
};

export type Severity = "low" | "medium" | "high";

export type PGxImplication = {
  drug: string;
  drug_class?: string;
  /** Optional English drug class label (falls back to `drug_class`). */
  drug_class_en?: string;
  effect: string;
  /** Optional English effect text (falls back to `effect`). Pre-softened. */
  effect_en?: string;
  severity: Severity;
};

export type PGxCallOutcome = {
  phenotype: string;
  /** Optional English phenotype label (falls back to `phenotype`). */
  phenotype_en?: string;
  star?: string;
};

export type PGxRule = {
  id: string;
  gene: string;
  rsid: string;
  ref_allele: Base;
  alt_allele: Base;
  cpic_ref?: string;
  call: {
    "ref/ref": PGxCallOutcome;
    "ref/alt": PGxCallOutcome;
    "alt/alt": PGxCallOutcome;
  };
  implications: PGxImplication[];
};

export type PharmaFinding = {
  rule: PGxRule;
  zygosity: Zygosity;
  outcome: PGxCallOutcome | null; // null if nocall/ambiguous
};

export type PharmaByDrug = {
  drug: string;
  drug_class?: string;
  drug_class_en?: string;
  effect: string;
  /** Pre-softened English effect text with EN source/ack tail. */
  effect_en?: string;
  severity: Severity;
  contributors: {
    gene: string;
    phenotype: string;
    phenotype_en?: string;
    zygosity: Zygosity;
  }[];
};

export type TraitConfidence = "high" | "medium" | "low";

export type TraitCallRule = {
  when: Record<string, string>; // rsid -> genotype string like "AA" or "AG"
  result: {
    label: string;
    label_en?: string;
    detail: string;
    detail_en?: string;
    emoji?: string;
  };
};

export type TraitRule = {
  id: string;
  title: string;
  /** Optional English title (falls back to `title`). */
  title_en?: string;
  gene: string;
  rsids: string[];
  call_rules: TraitCallRule[];
  confidence: TraitConfidence;
  sources: string[];
  emoji?: string;
};

export type TraitFinding = {
  rule: TraitRule;
  result: {
    label: string;
    label_en?: string;
    detail: string;
    detail_en?: string;
    emoji?: string;
  } | null; // null = indeterminate
  genotypes_used: Record<string, string | null>;
};

export type DnaSource =
  | "myheritage"
  | "23andme"
  | "ancestrydna"
  | "livingdna"
  | "ftdna"
  | "wgs"
  | "unknown";

export type AnalysisMeta = {
  totalSNPs: number;
  noCalls: number;
  build: string;
  filename: string;
  fileHash: string;
  parsedAt: string; // ISO
  source: DnaSource;
};

export type DensityMap = Record<string, number[]>;
export type PositionIndex = Record<string, { chr: string; pos: number }>;

export type PRSRuleSNP = {
  rsid: string;
  effect: Base;
  weight: number;
  af: number; // effect-allele frequency (EUR/global), used for z-score normalization
};

export type PRSRule = {
  id: string;
  trait: string;
  /** Optional English trait name (falls back to `trait` if absent). */
  traitEn?: string;
  category: "metabolic" | "cardio" | "neuro" | "cancer" | "anthropometric" | "longevity";
  description: string;
  /** Optional English description (falls back to `description` if absent). */
  descriptionEn?: string;
  source: string;
  units: string; // "log-OR" or "effect size (SD)"
  emoji?: string;
  snps: PRSRuleSNP[];
};

export type PRSFinding = {
  rule: PRSRule;
  score: number; // raw weighted sum
  popMean: number;
  popSd: number;
  zScore: number;
  percentile: number; // 0..100
  coverage: number; // 0..1, fraction of SNPs matched
  matched: number;
  total: number;
  contributors: {
    rsid: string;
    effect: Base;
    weight: number;
    observed: string | null; // "AG", "AA", etc. or null if nocall/missing
    dosage: number | null; // 0, 1, or 2 copies of effect allele
    contribution: number;
  }[];
};

export type ROHSegment = {
  chr: string;
  startPos: number;
  endPos: number;
  lengthBp: number;
  snpCount: number;
};

export type ROHResult = {
  segments: ROHSegment[];
  totalBp: number;
  totalSegments: number;
  fRoh: number; // inbreeding coefficient estimate
  autosomalBp: number;
};

export type NeanderthalResult = {
  matchedSnps: number;
  totalSnps: number;
  archaicDosage: number; // sum of archaic allele copies
  maxDosage: number; // 2 * matchedSnps
  percent: number; // estimated % Neanderthal-like in genome (0..4)
  topHits: { rsid: string; gene: string; dosage: number; note: LocalizedString }[];
};

export type AncestryComponent = {
  region: "AFR" | "EUR" | "EAS" | "SAS" | "AMR";
  label: string;
  percent: number;
};

export type AncestryResult = {
  components: AncestryComponent[];
  topRegion: AncestryComponent;
  coverage: number; // fraction of AIMs matched
  matched: number;
  total: number;
};

export type HaplogroupBranch = {
  id: string; // e.g. "R1b-M269"
  depth: number;
  rsid: string;
  derived: string;
};

export type HaplogroupResult = {
  available: boolean; // false if no Y/mt data
  assigned: string; // deepest assigned haplogroup
  path: HaplogroupBranch[];
  description: string;
  migration: string;
};

export type CarrierFinding = {
  condition: string;
  condition_en?: string;
  gene: string;
  rsid: string;
  zygosity: Zygosity;
  status: "carrier" | "affected" | "clear";
  inheritance: "AR" | "XLR";
  note: string;
  note_en?: string;
};

export type ActionableFinding = {
  id: string;
  gene: string;
  name: string;
  name_en?: string;
  call: string; // e.g., "ε3/ε4", "heterozygote"
  call_en?: string;
  risk: "high" | "moderate" | "low" | "neutral";
  note: string;
  note_en?: string;
  rsids: string[];
  genotypes: Record<string, string | null>;
};

export type LocalizedString = { fr: string; en: string };

export type FunResult = {
  music: { notes: number[]; tempo: number; key: LocalizedString }; // MIDI notes 0..87
  art: { seed: string; palette: string[]; shapes: string }; // svg path string
  twins: { name: LocalizedString; similarity: number; era: LocalizedString; note: LocalizedString }[];
};

export type AnalysisResult = {
  meta: AnalysisMeta;
  density: DensityMap;
  clinvar: ClinVarFinding[];
  pharma: { findings: PharmaFinding[]; byDrug: PharmaByDrug[] };
  traits: TraitFinding[];
  prs: PRSFinding[];
  roh: ROHResult;
  neanderthal?: NeanderthalResult;
  ancestry?: AncestryResult;
  yHaplogroup?: HaplogroupResult;
  mtHaplogroup?: HaplogroupResult;
  carriers?: CarrierFinding[];
  actionable?: ActionableFinding[];
  fun?: FunResult;
  imputation?: {
    attempted: number;
    imputed: number;
    skippedAlreadyPresent: number;
    skippedProxyMissing: number;
    skippedProxyUnmapped: number;
    entries: Array<{
      target: string;
      proxy: string;
      r2: number;
      source: "imputed" | "skipped";
      reason?: string;
      proxyObserved?: string;
      imputedAs?: string;
    }>;
  };
};

export type AnalysisData = {
  result: AnalysisResult;
  genotypes: GenotypeMap;
  positions: PositionIndex;
};

export type ProgressEvent =
  | { type: "progress"; phase: "parse" | "fetch" | "annotate"; percent: number; message?: string }
  | { type: "done"; result: AnalysisResult; genotypes: GenotypeMap; positions: PositionIndex }
  | { type: "error"; error: string };
