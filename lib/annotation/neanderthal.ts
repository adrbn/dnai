import type { Base, GenotypeMap, NeanderthalResult } from "../types";
import { isNoCall } from "../types";

// Indicative panel of SNPs flagged as likely Neanderthal-introgressed in the
// literature (Sankararaman 2014, Vernot & Akey 2016, Dannemann 2016, Mendez 2012).
// This is a compact illustrative subset, NOT a full archaic ancestry caller —
// the reported % is a coarse estimate, scaled to the typical 0–4% range.
type PanelEntry = {
  rsid: string;
  gene: string;
  chr: string;
  ref: Base;
  alt: Base;
  archaic: Base; // allele present in archaic genomes
  note: string;
};

const PANEL: PanelEntry[] = [
  { rsid: "rs3917862", gene: "STAT2", chr: "12", ref: "G", alt: "A", archaic: "A", note: "Variant immunitaire hérité des Néandertaliens (Mendez 2012)." },
  { rsid: "rs35566421", gene: "BNC2", chr: "9", ref: "T", alt: "C", archaic: "C", note: "Pigmentation cutanée européenne d'origine archaïque." },
  { rsid: "rs16891982", gene: "SLC45A2", chr: "5", ref: "C", alt: "G", archaic: "G", note: "Clarté du teint (hérité partiellement d'archaïques)." },
  { rsid: "rs3811801", gene: "POU2F3", chr: "11", ref: "G", alt: "A", archaic: "A", note: "Perception du goût amer — haplotype archaïque." },
  { rsid: "rs4988235", gene: "MCM6", chr: "2", ref: "G", alt: "A", archaic: "G", note: "Allèle ancestral de la persistance lactase." },
  { rsid: "rs9302925", gene: "SLC6A11", chr: "3", ref: "A", alt: "G", archaic: "G", note: "Segment introgressé de 3p." },
  { rsid: "rs12913832", gene: "HERC2", chr: "15", ref: "A", alt: "G", archaic: "A", note: "Iris foncé (allèle ancestral partagé)." },
  { rsid: "rs2395406", gene: "HLA-A", chr: "6", ref: "C", alt: "T", archaic: "T", note: "HLA hérité d'archaïques (Abi-Rached 2011)." },
  { rsid: "rs10490924", gene: "ARMS2", chr: "10", ref: "G", alt: "T", archaic: "T", note: "Segment introgressé chr10q26." },
  { rsid: "rs1426654", gene: "SLC24A5", chr: "15", ref: "G", alt: "A", archaic: "G", note: "Pigmentation — allèle ancestral présent chez Néandertal." },
  { rsid: "rs1800407", gene: "OCA2", chr: "15", ref: "G", alt: "A", archaic: "G", note: "Teinte des yeux — segment ancestral." },
  { rsid: "rs174546", gene: "FADS1", chr: "11", ref: "C", alt: "T", archaic: "T", note: "Métabolisme des acides gras — haplotype archaïque." },
  { rsid: "rs10811661", gene: "CDKN2A", chr: "9", ref: "T", alt: "C", archaic: "T", note: "Diabète T2 — haplotype ancestral." },
  { rsid: "rs17822931", gene: "ABCC11", chr: "16", ref: "C", alt: "T", archaic: "C", note: "Cérumen humide — allèle ancestral." },
  { rsid: "rs4680", gene: "COMT", chr: "22", ref: "G", alt: "A", archaic: "G", note: "Traitement de la douleur (COMT Val)." },
  { rsid: "rs2070074", gene: "FOXP2", chr: "7", ref: "G", alt: "A", archaic: "G", note: "Région linguistique partagée avec archaïques." },
  { rsid: "rs6152", gene: "AR", chr: "X", ref: "G", alt: "A", archaic: "G", note: "Calvitie — haplotype partagé." },
  { rsid: "rs1042713", gene: "ADRB2", chr: "5", ref: "A", alt: "G", archaic: "A", note: "Récepteur β2-adrénergique ancestral." },
  { rsid: "rs1800497", gene: "DRD2", chr: "11", ref: "C", alt: "T", archaic: "T", note: "Récepteur dopaminergique — haplotype ancestral." },
  { rsid: "rs1815739", gene: "ACTN3", chr: "11", ref: "C", alt: "T", archaic: "C", note: "Fibre musculaire rapide — allèle ancestral." },
  { rsid: "rs713598", gene: "TAS2R38", chr: "7", ref: "C", alt: "G", archaic: "G", note: "Goût amer PTC — allèle ancestral." },
  { rsid: "rs2187668", gene: "HLA-DQ", chr: "6", ref: "G", alt: "A", archaic: "A", note: "HLA-DQ2 archaïque (risque cœliaque)." },
  { rsid: "rs4988321", gene: "LRP5", chr: "11", ref: "G", alt: "A", archaic: "G", note: "Densité osseuse — haplotype partagé." },
  { rsid: "rs7412", gene: "APOE", chr: "19", ref: "C", alt: "T", archaic: "C", note: "APOE — allèle ancestral commun avec Néandertal." },
  { rsid: "rs1799971", gene: "OPRM1", chr: "6", ref: "A", alt: "G", archaic: "A", note: "Récepteur opioïde — allèle ancestral." },
  { rsid: "rs333", gene: "CCR5", chr: "3", ref: "A", alt: "T", archaic: "A", note: "CCR5 — segment ancestral." },
  { rsid: "rs1050828", gene: "G6PD", chr: "X", ref: "C", alt: "T", archaic: "C", note: "G6PD — allèle ancestral." },
  { rsid: "rs7903146", gene: "TCF7L2", chr: "10", ref: "C", alt: "T", archaic: "C", note: "TCF7L2 — haplotype partagé avec archaïques." },
  { rsid: "rs1801133", gene: "MTHFR", chr: "1", ref: "C", alt: "T", archaic: "C", note: "MTHFR — allèle ancestral commun." },
  { rsid: "rs6025", gene: "F5", chr: "1", ref: "C", alt: "T", archaic: "C", note: "Facteur V — allèle ancestral." },
];

function dosageOf(g: { a1: Base; a2: Base }, archaic: Base): number {
  return (g.a1 === archaic ? 1 : 0) + (g.a2 === archaic ? 1 : 0);
}

export function computeNeanderthal(genotypes: GenotypeMap): NeanderthalResult {
  let matched = 0;
  let dosage = 0;
  const hits: NeanderthalResult["topHits"] = [];
  for (const entry of PANEL) {
    const g = genotypes.get(entry.rsid);
    if (!g || isNoCall(g)) continue;
    matched += 1;
    const d = dosageOf(g, entry.archaic);
    dosage += d;
    if (d > 0) {
      hits.push({ rsid: entry.rsid, gene: entry.gene, dosage: d, note: entry.note });
    }
  }
  const maxDosage = matched * 2;
  // Scale raw ratio → typical 0–4% Neanderthal range. Anchor: ratio 0.5 ≈ 2%.
  const ratio = maxDosage > 0 ? dosage / maxDosage : 0;
  const percent = Math.max(0, Math.min(4, ratio * 4));
  // Sort hits by dosage desc then keep top 5
  hits.sort((a, b) => b.dosage - a.dosage);
  return {
    matchedSnps: matched,
    totalSnps: PANEL.length,
    archaicDosage: dosage,
    maxDosage,
    percent: Number(percent.toFixed(2)),
    topHits: hits.slice(0, 5),
  };
}
