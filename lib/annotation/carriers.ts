import type { Base, CarrierFinding, GenotypeMap } from "../types";
import { genotypeToString, matchAllele } from "../genotype";
import { isNoCall } from "../types";

type CarrierRule = {
  condition: string;
  gene: string;
  rsid: string;
  ref: Base;
  alt: Base;
  inheritance: "AR" | "XLR";
  carrierNote: string;
  affectedNote: string;
};

// Compact carrier-screening panel (ACMG-aligned). Only SNV-representable rules.
// Many carrier conditions are indels (e.g. CFTR ΔF508) — we defer those to
// ClinVar. This module covers the SNV subset that genotyping chips tend to
// include, giving an explicit carrier-status readout.
const PANEL: CarrierRule[] = [
  {
    condition: "Drépanocytose",
    gene: "HBB",
    rsid: "rs334",
    ref: "T",
    alt: "A",
    inheritance: "AR",
    carrierNote: "Porteur du trait drépanocytaire — sans symptôme mais transmission possible.",
    affectedNote: "Génotype compatible avec la drépanocytose — consultation spécialisée recommandée.",
  },
  {
    condition: "Phénylcétonurie (PKU)",
    gene: "PAH",
    rsid: "rs5030858",
    ref: "C",
    alt: "T",
    inheritance: "AR",
    carrierNote: "Porteur d'un variant PAH — sans symptôme.",
    affectedNote: "Deux copies du variant PKU — compatible avec un diagnostic.",
  },
  {
    condition: "Tay-Sachs",
    gene: "HEXA",
    rsid: "rs387906309",
    ref: "C",
    alt: "T",
    inheritance: "AR",
    carrierNote: "Porteur d'un variant HEXA (fréquent en population ashkénaze).",
    affectedNote: "Génotype compatible avec une maladie de Tay-Sachs.",
  },
  {
    condition: "Gaucher",
    gene: "GBA",
    rsid: "rs76763715",
    ref: "T",
    alt: "C",
    inheritance: "AR",
    carrierNote: "Porteur d'un variant GBA (N370S) — sans symptôme.",
    affectedNote: "Génotype compatible avec la maladie de Gaucher.",
  },
  {
    condition: "Fibrose kystique (variant chip)",
    gene: "CFTR",
    rsid: "rs113993960",
    ref: "C",
    alt: "T",
    inheritance: "AR",
    carrierNote: "Porteur d'un variant CFTR — détection partielle (ΔF508 non captée ici).",
    affectedNote: "Deux copies — génotype compatible avec une mucoviscidose.",
  },
  {
    condition: "Déficit en α1-antitrypsine",
    gene: "SERPINA1",
    rsid: "rs17580",
    ref: "A",
    alt: "T",
    inheritance: "AR",
    carrierNote: "Porteur d'un variant Z SERPINA1 — risque pulmonaire/hépatique accru à l'état homozygote.",
    affectedNote: "Homozygote — risque fort d'emphysème/maladie hépatique.",
  },
  {
    condition: "Maladie de Wilson",
    gene: "ATP7B",
    rsid: "rs76151636",
    ref: "G",
    alt: "A",
    inheritance: "AR",
    carrierNote: "Porteur d'un variant ATP7B — sans symptôme.",
    affectedNote: "Génotype compatible avec la maladie de Wilson.",
  },
  {
    condition: "Amyotrophie spinale (proxy)",
    gene: "SMN1",
    rsid: "rs62621690",
    ref: "T",
    alt: "C",
    inheritance: "AR",
    carrierNote: "Marqueur lié à des délétions SMN1 — à confirmer par test MLPA dédié.",
    affectedNote: "Signal fort — test SMN1 MLPA recommandé.",
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
    findings.push({
      condition: rule.condition,
      gene: rule.gene,
      rsid: rule.rsid,
      zygosity: z,
      status,
      inheritance: rule.inheritance,
      note,
    });
  }
  return findings;
}
