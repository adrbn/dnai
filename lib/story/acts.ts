import type {
  ActionableFinding,
  AnalysisResult,
  AncestryResult,
  CarrierFinding,
  ClinVarFinding,
  FunResult,
  HaplogroupResult,
  NeanderthalResult,
  PRSFinding,
  PharmaByDrug,
  PositionIndex,
  TraitFinding,
} from "../types";

export type ActKind =
  | "intro"
  | "ancestry"
  | "haplogroup-y"
  | "haplogroup-mt"
  | "neanderthal"
  | "health-intro"
  | "clinvar"
  | "actionable"
  | "carriers"
  | "pharma-intro"
  | "pharma"
  | "prs-intro"
  | "prs"
  | "traits"
  | "roh"
  | "fun"
  | "outro";

export interface BaseAct {
  id: string;
  kind: ActKind;
  title: string;
}

export interface IntroAct extends BaseAct {
  kind: "intro";
  filename: string;
  sourceLabel: string;
  totalSNPs: number;
  primer: { fr: string; en: string };
}

export interface HealthIntroAct extends BaseAct {
  kind: "health-intro";
  count: number;
}

export interface ClinVarAct extends BaseAct {
  kind: "clinvar";
  finding: ClinVarFinding;
  locus?: { chr: string; pos: number };
  rank: number;
  totalRanked: number;
}

export interface PharmaIntroAct extends BaseAct {
  kind: "pharma-intro";
  drugCount: number;
}

export interface PharmaAct extends BaseAct {
  kind: "pharma";
  drug: PharmaByDrug;
  loci: { chr: string; pos: number; gene: string }[];
  rank: number;
}

export interface PRSIntroAct extends BaseAct {
  kind: "prs-intro";
  count: number;
}

export interface PRSAct extends BaseAct {
  kind: "prs";
  finding: PRSFinding;
  rank: number;
}

export interface TraitsAct extends BaseAct {
  kind: "traits";
  traits: TraitFinding[];
}

export interface ROHAct extends BaseAct {
  kind: "roh";
  fRoh: number;
  segments: number;
  interpretation: { fr: string; en: string };
}

export interface OutroAct extends BaseAct {
  kind: "outro";
  clinvarTotal: number;
  pharmaTotal: number;
  prsTotal: number;
  traitsTotal: number;
}

export interface AncestryAct extends BaseAct {
  kind: "ancestry";
  ancestry: AncestryResult;
}

export interface HaplogroupYAct extends BaseAct {
  kind: "haplogroup-y";
  hap: HaplogroupResult;
}

export interface HaplogroupMtAct extends BaseAct {
  kind: "haplogroup-mt";
  hap: HaplogroupResult;
}

export interface NeanderthalAct extends BaseAct {
  kind: "neanderthal";
  neanderthal: NeanderthalResult;
}

export interface ActionableAct extends BaseAct {
  kind: "actionable";
  findings: ActionableFinding[];
}

export interface CarriersAct extends BaseAct {
  kind: "carriers";
  findings: CarrierFinding[];
}

export interface FunAct extends BaseAct {
  kind: "fun";
  fun: FunResult;
}

export type Act =
  | IntroAct
  | AncestryAct
  | HaplogroupYAct
  | HaplogroupMtAct
  | NeanderthalAct
  | HealthIntroAct
  | ClinVarAct
  | ActionableAct
  | CarriersAct
  | PharmaIntroAct
  | PharmaAct
  | PRSIntroAct
  | PRSAct
  | TraitsAct
  | ROHAct
  | FunAct
  | OutroAct;

function rankClinVar(a: ClinVarFinding, b: ClinVarFinding): number {
  const sigRank = (s: string) => (s === "P" ? 0 : s === "P/LP" ? 1 : 2);
  const d = sigRank(a.entry.sig) - sigRank(b.entry.sig);
  if (d !== 0) return d;
  const aHas = a.entry.condition ? 0 : 1;
  const bHas = b.entry.condition ? 0 : 1;
  return aHas - bHas;
}

function severityRank(s: "high" | "medium" | "low"): number {
  return s === "high" ? 0 : s === "medium" ? 1 : 2;
}

function interpretFRoh(fRoh: number): { fr: string; en: string } {
  // Thresholds aligned with ROHCard: <1.56% = standard, <3.125% = cousinage
  // ancien, <6.25% = cousins éloignés, sinon parents apparentés au 1er/2e degré.
  if (fRoh < 0.0156)
    return {
      fr: "Niveau standard — attendu dans toute population humaine, rien à signaler.",
      en: "Standard level — expected in any human population, nothing to flag.",
    };
  if (fRoh < 0.03125)
    return {
      fr: "Léger excès d'homozygotie, compatible avec des ancêtres communs lointains (cousinage ancien, fréquent).",
      en: "Slight excess of homozygosity, consistent with distant common ancestors (ancient cousinage, common).",
    };
  if (fRoh < 0.0625)
    return {
      fr: "Homozygotie notable — équivalent à des cousins éloignés dans la généalogie.",
      en: "Notable homozygosity — comparable to distant cousins in the family tree.",
    };
  return {
    fr: "Consanguinité marquée — parents biologiques probablement apparentés au 1ᵉʳ ou 2ᵉ degré.",
    en: "Marked consanguinity — biological parents are likely 1st- or 2nd-degree relatives.",
  };
}

function sourceLabel(source: string, totalSNPs: number): string {
  if (source === "myheritage") return "MyHeritage";
  if (source === "23andme") return "23andMe";
  if (source === "ancestrydna") return "AncestryDNA";
  if (source === "livingdna") return "Living DNA";
  if (source === "ftdna") return "FamilyTreeDNA";
  if (source === "wgs") return "VCF (séquençage complet)";
  return totalSNPs > 2_000_000 ? "VCF (WGS)" : "Puce ADN";
}

function sourcePrimer(source: string, totalSNPs: number): { fr: string; en: string } {
  const fmtFr = totalSNPs.toLocaleString("fr-FR");
  const fmtEn = totalSNPs.toLocaleString("en-US");
  if (source === "wgs" || totalSNPs > 2_000_000) {
    return {
      fr: `${fmtFr} variants lus sur votre génome complet.`,
      en: `${fmtEn} variants read across your full genome.`,
    };
  }
  return {
    fr: `${fmtFr} positions précises lues sur votre génome.`,
    en: `${fmtEn} precise positions read across your genome.`,
  };
}

export interface BuildStoryOptions {
  /**
   * When false (default), the APOE ε4 Alzheimer finding is stripped from the
   * story timeline. APOE is a highly predictive genotype with significant
   * psychosocial impact — NSGC (2019) recommends explicit opt-in before
   * surfacing it to consumers. Set to true only after the user has acknowledged
   * a dedicated APOE consent modal.
   */
  apoeOptIn?: boolean;
}

export function buildStory(
  result: AnalysisResult,
  positions: PositionIndex | null | undefined,
  options: BuildStoryOptions = {},
): Act[] {
  const { apoeOptIn = false } = options;
  const acts: Act[] = [];
  const pos = positions ?? {};

  acts.push({
    id: "intro",
    kind: "intro",
    title: "Votre génome",
    filename: result.meta.filename,
    sourceLabel: sourceLabel(result.meta.source, result.meta.totalSNPs),
    totalSNPs: result.meta.totalSNPs,
    primer: sourcePrimer(result.meta.source, result.meta.totalSNPs),
  });

  if (result.ancestry && result.ancestry.matched > 0) {
    acts.push({
      id: "ancestry",
      kind: "ancestry",
      title: "Origines",
      ancestry: result.ancestry,
    });
  }

  if (result.yHaplogroup?.available && result.yHaplogroup.path.length > 0) {
    acts.push({
      id: "haplogroup-y",
      kind: "haplogroup-y",
      title: `Lignée paternelle ${result.yHaplogroup.assigned}`,
      hap: result.yHaplogroup,
    });
  }

  if (result.mtHaplogroup?.available && result.mtHaplogroup.path.length > 0) {
    acts.push({
      id: "haplogroup-mt",
      kind: "haplogroup-mt",
      title: `Lignée maternelle ${result.mtHaplogroup.assigned}`,
      hap: result.mtHaplogroup,
    });
  }

  if (result.neanderthal && result.neanderthal.matchedSnps > 0) {
    acts.push({
      id: "neanderthal",
      kind: "neanderthal",
      title: "Néandertal",
      neanderthal: result.neanderthal,
    });
  }

  const clinvar = [...result.clinvar].sort(rankClinVar).slice(0, 3);
  if (clinvar.length > 0) {
    acts.push({
      id: "health-intro",
      kind: "health-intro",
      title: "Santé",
      count: result.clinvar.length,
    });
    clinvar.forEach((f, i) => {
      const loc = pos[f.entry.rs];
      acts.push({
        id: `clinvar-${f.entry.rs}`,
        kind: "clinvar",
        title: f.entry.gene,
        finding: f,
        locus: loc ? { chr: loc.chr, pos: loc.pos } : undefined,
        rank: i + 1,
        totalRanked: clinvar.length,
      });
    });
  }

  if (result.actionable && result.actionable.length > 0) {
    const gated = apoeOptIn
      ? result.actionable
      : result.actionable.filter((a) => a.id !== "apoe");
    const interesting = gated.filter((a) => a.risk !== "neutral");
    if (interesting.length > 0) {
      acts.push({
        id: "actionable",
        kind: "actionable",
        title: "Variants documentés",
        findings: interesting,
      });
    }
  }

  if (result.carriers && result.carriers.length > 0) {
    acts.push({
      id: "carriers",
      kind: "carriers",
      title: "Dépistage de porteurs",
      findings: result.carriers,
    });
  }

  const pharma = [...result.pharma.byDrug]
    .sort((a, b) => severityRank(a.severity) - severityRank(b.severity))
    .slice(0, 3);
  if (pharma.length > 0) {
    acts.push({
      id: "pharma-intro",
      kind: "pharma-intro",
      title: "Pharmacogénomique",
      drugCount: result.pharma.byDrug.length,
    });
    pharma.forEach((d, i) => {
      const loci: { chr: string; pos: number; gene: string }[] = [];
      for (const c of d.contributors) {
        const rule = result.pharma.findings.find(
          (f) => f.rule.gene === c.gene && f.zygosity === c.zygosity,
        );
        if (!rule) continue;
        const loc = pos[rule.rule.rsid];
        if (loc) loci.push({ chr: loc.chr, pos: loc.pos, gene: c.gene });
      }
      acts.push({
        id: `pharma-${d.drug}`,
        kind: "pharma",
        title: d.drug,
        drug: d,
        loci,
        rank: i + 1,
      });
    });
  }

  const prs = [...result.prs]
    .sort((a, b) => Math.abs(b.percentile - 50) - Math.abs(a.percentile - 50))
    .slice(0, 3);
  if (prs.length > 0) {
    acts.push({
      id: "prs-intro",
      kind: "prs-intro",
      title: "Risque polygénique",
      count: result.prs.length,
    });
    prs.forEach((p, i) => {
      acts.push({
        id: `prs-${p.rule.id}`,
        kind: "prs",
        title: p.rule.trait,
        finding: p,
        rank: i + 1,
      });
    });
  }

  const traits = result.traits.filter((t) => t.result !== null).slice(0, 5);
  if (traits.length > 0) {
    acts.push({
      id: "traits",
      kind: "traits",
      title: "Traits",
      traits,
    });
  }

  if (result.roh.totalSegments > 0) {
    acts.push({
      id: "roh",
      kind: "roh",
      title: "Homozygotie",
      fRoh: result.roh.fRoh,
      segments: result.roh.totalSegments,
      interpretation: interpretFRoh(result.roh.fRoh),
    });
  }

  if (result.fun) {
    acts.push({
      id: "fun",
      kind: "fun",
      title: "Votre ADN créatif",
      fun: result.fun,
    });
  }

  acts.push({
    id: "outro",
    kind: "outro",
    title: "Et la suite",
    clinvarTotal: result.clinvar.length,
    pharmaTotal: result.pharma.byDrug.length,
    prsTotal: result.prs.length,
    traitsTotal: result.traits.filter((t) => t.result !== null).length,
  });

  return acts;
}
