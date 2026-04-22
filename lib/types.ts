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
  chr: string;
  pos: number;
  ref: Base;
  alt: Base;
  gene: string;
  sig: ClinicalSignificance;
  cond: string;
  rev: number; // review status stars 0-4
  cv: number; // clinvar variation ID
  ref_url?: string;
};

export type ClinVarFinding = {
  entry: ClinVarEntry;
  zygosity: Exclude<Zygosity, "nocall" | "ref/ref">;
};

export type Severity = "low" | "medium" | "high";

export type PGxImplication = {
  drug: string;
  drug_class?: string;
  effect: string;
  severity: Severity;
};

export type PGxCallOutcome = {
  phenotype: string;
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
  effect: string;
  severity: Severity;
  contributors: { gene: string; phenotype: string; zygosity: Zygosity }[];
};

export type TraitConfidence = "high" | "medium" | "low";

export type TraitCallRule = {
  when: Record<string, string>; // rsid -> genotype string like "AA" or "AG"
  result: { label: string; detail: string; emoji?: string };
};

export type TraitRule = {
  id: string;
  title: string;
  gene: string;
  rsids: string[];
  call_rules: TraitCallRule[];
  confidence: TraitConfidence;
  sources: string[];
  emoji?: string;
};

export type TraitFinding = {
  rule: TraitRule;
  result: { label: string; detail: string; emoji?: string } | null; // null = indeterminate
  genotypes_used: Record<string, string | null>;
};

export type AnalysisMeta = {
  totalSNPs: number;
  noCalls: number;
  build: string;
  filename: string;
  fileHash: string;
  parsedAt: string; // ISO
};

export type AnalysisResult = {
  meta: AnalysisMeta;
  clinvar: ClinVarFinding[];
  pharma: { findings: PharmaFinding[]; byDrug: PharmaByDrug[] };
  traits: TraitFinding[];
};

export type ProgressEvent =
  | { type: "progress"; phase: "parse" | "fetch" | "annotate"; percent: number; message?: string }
  | { type: "done"; result: AnalysisResult }
  | { type: "error"; error: string };
