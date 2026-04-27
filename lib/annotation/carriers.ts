import type { Base, CarrierFinding, GenotypeMap } from "../types";
import { genotypeToString, matchAllele } from "../genotype";
import { isNoCall } from "../types";

type CarrierRule = {
  condition: string;
  condition_en: string;
  gene: string;
  rsid: string;
  ref: Base;
  alt: Base;
  inheritance: "AR" | "XLR";
  carrierNote: string;
  carrierNote_en: string;
  affectedNote: string;
  affectedNote_en: string;
};

// Compact carrier-screening panel (ACMG-aligned). Only SNV-representable rules.
// Many carrier conditions are indels (e.g. CFTR ΔF508) — we defer those to
// ClinVar. This module covers the SNV subset that genotyping chips tend to
// include, giving an explicit carrier-status readout.
const PANEL: CarrierRule[] = [
  {
    condition: "Drépanocytose",
    condition_en: "Sickle cell disease",
    gene: "HBB",
    rsid: "rs334",
    ref: "T",
    alt: "A",
    inheritance: "AR",
    carrierNote: "Porteur du trait drépanocytaire — sans symptôme mais transmission possible.",
    carrierNote_en: "Sickle cell trait carrier — asymptomatic but transmissible.",
    affectedNote: "Génotype compatible avec la drépanocytose — consultation spécialisée recommandée.",
    affectedNote_en: "Genotype compatible with sickle cell disease — specialist follow-up is described in the literature.",
  },
  {
    condition: "Phénylcétonurie (PKU)",
    condition_en: "Phenylketonuria (PKU)",
    gene: "PAH",
    rsid: "rs5030858",
    ref: "C",
    alt: "T",
    inheritance: "AR",
    carrierNote: "Porteur d'un variant PAH — sans symptôme.",
    carrierNote_en: "PAH variant carrier — asymptomatic.",
    affectedNote: "Deux copies du variant PKU — compatible avec un diagnostic.",
    affectedNote_en: "Two copies of the PKU variant — compatible with a diagnosis.",
  },
  {
    condition: "Tay-Sachs",
    condition_en: "Tay-Sachs disease",
    gene: "HEXA",
    rsid: "rs387906309",
    ref: "C",
    alt: "T",
    inheritance: "AR",
    carrierNote: "Porteur d'un variant HEXA (fréquent en population ashkénaze).",
    carrierNote_en: "HEXA variant carrier (common in Ashkenazi population).",
    affectedNote: "Génotype compatible avec une maladie de Tay-Sachs.",
    affectedNote_en: "Genotype compatible with Tay-Sachs disease.",
  },
  {
    condition: "Gaucher",
    condition_en: "Gaucher disease",
    gene: "GBA",
    rsid: "rs76763715",
    ref: "T",
    alt: "C",
    inheritance: "AR",
    carrierNote: "Porteur d'un variant GBA (N370S) — sans symptôme.",
    carrierNote_en: "GBA (N370S) variant carrier — asymptomatic.",
    affectedNote: "Génotype compatible avec la maladie de Gaucher.",
    affectedNote_en: "Genotype compatible with Gaucher disease.",
  },
  {
    condition: "Fibrose kystique (variant chip)",
    condition_en: "Cystic fibrosis (chip variant)",
    gene: "CFTR",
    rsid: "rs113993960",
    ref: "C",
    alt: "T",
    inheritance: "AR",
    carrierNote: "Porteur d'un variant CFTR — détection partielle (ΔF508 non captée ici).",
    carrierNote_en: "CFTR variant carrier — partial detection (ΔF508 not captured here).",
    affectedNote: "Deux copies — génotype compatible avec une mucoviscidose.",
    affectedNote_en: "Two copies — genotype compatible with cystic fibrosis.",
  },
  {
    condition: "Déficit en α1-antitrypsine",
    condition_en: "Alpha-1 antitrypsin deficiency",
    gene: "SERPINA1",
    rsid: "rs17580",
    ref: "A",
    alt: "T",
    inheritance: "AR",
    carrierNote: "Porteur d'un variant Z SERPINA1 — risque pulmonaire/hépatique accru à l'état homozygote.",
    carrierNote_en: "SERPINA1 Z variant carrier — increased pulmonary/hepatic risk in homozygous state.",
    affectedNote: "Homozygote — risque fort d'emphysème/maladie hépatique.",
    affectedNote_en: "Homozygous — high risk of emphysema/liver disease.",
  },
  {
    condition: "Maladie de Wilson",
    condition_en: "Wilson disease",
    gene: "ATP7B",
    rsid: "rs76151636",
    ref: "G",
    alt: "A",
    inheritance: "AR",
    carrierNote: "Porteur d'un variant ATP7B — sans symptôme.",
    carrierNote_en: "ATP7B variant carrier — asymptomatic.",
    affectedNote: "Génotype compatible avec la maladie de Wilson.",
    affectedNote_en: "Genotype compatible with Wilson disease.",
  },
  {
    condition: "Amyotrophie spinale (proxy)",
    condition_en: "Spinal muscular atrophy (proxy)",
    gene: "SMN1",
    rsid: "rs62621690",
    ref: "T",
    alt: "C",
    inheritance: "AR",
    carrierNote: "Marqueur lié à des délétions SMN1 — à confirmer par test MLPA dédié.",
    carrierNote_en: "Marker linked to SMN1 deletions — confirmation by dedicated MLPA testing is described.",
    affectedNote: "Signal fort — test SMN1 MLPA recommandé.",
    affectedNote_en: "Strong signal — SMN1 MLPA testing is described in the literature.",
  },
];

export function computeCarriers(genotypes: GenotypeMap): CarrierFinding[] {
  const findings: CarrierFinding[] = [];
  for (const rule of PANEL) {
    const g = genotypes.get(rule.rsid);
    if (!g || isNoCall(g)) continue;
    const z = matchAllele(g, rule.ref, rule.alt, { tryReverseStrand: true });
    if (z === "nocall" || z === "ambiguous" || z === "ref/ref") continue;
    const status: CarrierFinding["status"] =
      z === "alt/alt" ? "affected" : "carrier";
    const note = status === "affected" ? rule.affectedNote : rule.carrierNote;
    const note_en =
      status === "affected" ? rule.affectedNote_en : rule.carrierNote_en;
    findings.push({
      condition: rule.condition,
      condition_en: rule.condition_en,
      gene: rule.gene,
      rsid: rule.rsid,
      zygosity: z,
      status,
      inheritance: rule.inheritance,
      note,
      note_en,
    });
  }
  return findings;
}
