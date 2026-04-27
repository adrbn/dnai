import type { Base, GenotypeMap, LocalizedString, NeanderthalResult } from "../types";
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
  note: LocalizedString;
};

const PANEL: PanelEntry[] = [
  { rsid: "rs3917862", gene: "STAT2", chr: "12", ref: "G", alt: "A", archaic: "A", note: { fr: "Variant immunitaire hérité des Néandertaliens (Mendez 2012).", en: "Immune variant inherited from Neanderthals (Mendez 2012)." } },
  { rsid: "rs35566421", gene: "BNC2", chr: "9", ref: "T", alt: "C", archaic: "C", note: { fr: "Pigmentation cutanée européenne d'origine archaïque.", en: "European skin pigmentation of archaic origin." } },
  { rsid: "rs16891982", gene: "SLC45A2", chr: "5", ref: "C", alt: "G", archaic: "G", note: { fr: "Clarté du teint (hérité partiellement d'archaïques).", en: "Skin lightness (partly inherited from archaics)." } },
  { rsid: "rs3811801", gene: "POU2F3", chr: "11", ref: "G", alt: "A", archaic: "A", note: { fr: "Perception du goût amer — haplotype archaïque.", en: "Bitter taste perception — archaic haplotype." } },
  { rsid: "rs4988235", gene: "MCM6", chr: "2", ref: "G", alt: "A", archaic: "G", note: { fr: "Allèle ancestral de la persistance lactase.", en: "Ancestral allele of lactase persistence." } },
  { rsid: "rs9302925", gene: "SLC6A11", chr: "3", ref: "A", alt: "G", archaic: "G", note: { fr: "Segment introgressé de 3p.", en: "Introgressed segment on 3p." } },
  { rsid: "rs12913832", gene: "HERC2", chr: "15", ref: "A", alt: "G", archaic: "A", note: { fr: "Iris foncé (allèle ancestral partagé).", en: "Dark iris (shared ancestral allele)." } },
  { rsid: "rs2395406", gene: "HLA-A", chr: "6", ref: "C", alt: "T", archaic: "T", note: { fr: "HLA hérité d'archaïques (Abi-Rached 2011).", en: "HLA inherited from archaics (Abi-Rached 2011)." } },
  { rsid: "rs10490924", gene: "ARMS2", chr: "10", ref: "G", alt: "T", archaic: "T", note: { fr: "Segment introgressé chr10q26.", en: "Introgressed segment chr10q26." } },
  { rsid: "rs1426654", gene: "SLC24A5", chr: "15", ref: "G", alt: "A", archaic: "G", note: { fr: "Pigmentation — allèle ancestral présent chez Néandertal.", en: "Pigmentation — ancestral allele present in Neanderthals." } },
  { rsid: "rs1800407", gene: "OCA2", chr: "15", ref: "G", alt: "A", archaic: "G", note: { fr: "Teinte des yeux — segment ancestral.", en: "Eye color — ancestral segment." } },
  { rsid: "rs174546", gene: "FADS1", chr: "11", ref: "C", alt: "T", archaic: "T", note: { fr: "Métabolisme des acides gras — haplotype archaïque.", en: "Fatty-acid metabolism — archaic haplotype." } },
  { rsid: "rs10811661", gene: "CDKN2A", chr: "9", ref: "T", alt: "C", archaic: "T", note: { fr: "Diabète T2 — haplotype ancestral.", en: "Type-2 diabetes — ancestral haplotype." } },
  { rsid: "rs17822931", gene: "ABCC11", chr: "16", ref: "C", alt: "T", archaic: "C", note: { fr: "Cérumen humide — allèle ancestral.", en: "Wet earwax — ancestral allele." } },
  { rsid: "rs4680", gene: "COMT", chr: "22", ref: "G", alt: "A", archaic: "G", note: { fr: "Traitement de la douleur (COMT Val).", en: "Pain processing (COMT Val)." } },
  { rsid: "rs2070074", gene: "FOXP2", chr: "7", ref: "G", alt: "A", archaic: "G", note: { fr: "Région linguistique partagée avec archaïques.", en: "Language-related region shared with archaics." } },
  { rsid: "rs6152", gene: "AR", chr: "X", ref: "G", alt: "A", archaic: "G", note: { fr: "Calvitie — haplotype partagé.", en: "Baldness — shared haplotype." } },
  { rsid: "rs1042713", gene: "ADRB2", chr: "5", ref: "A", alt: "G", archaic: "A", note: { fr: "Récepteur β2-adrénergique ancestral.", en: "Ancestral β2-adrenergic receptor." } },
  { rsid: "rs1800497", gene: "DRD2", chr: "11", ref: "C", alt: "T", archaic: "T", note: { fr: "Récepteur dopaminergique — haplotype ancestral.", en: "Dopamine receptor — ancestral haplotype." } },
  { rsid: "rs1815739", gene: "ACTN3", chr: "11", ref: "C", alt: "T", archaic: "C", note: { fr: "Fibre musculaire rapide — allèle ancestral.", en: "Fast-twitch muscle — ancestral allele." } },
  { rsid: "rs713598", gene: "TAS2R38", chr: "7", ref: "C", alt: "G", archaic: "G", note: { fr: "Goût amer PTC — allèle ancestral.", en: "PTC bitter taste — ancestral allele." } },
  { rsid: "rs2187668", gene: "HLA-DQ", chr: "6", ref: "G", alt: "A", archaic: "A", note: { fr: "HLA-DQ2 archaïque (risque cœliaque).", en: "Archaic HLA-DQ2 (celiac risk)." } },
  { rsid: "rs4988321", gene: "LRP5", chr: "11", ref: "G", alt: "A", archaic: "G", note: { fr: "Densité osseuse — haplotype partagé.", en: "Bone density — shared haplotype." } },
  { rsid: "rs7412", gene: "APOE", chr: "19", ref: "C", alt: "T", archaic: "C", note: { fr: "APOE — allèle ancestral commun avec Néandertal.", en: "APOE — ancestral allele shared with Neanderthals." } },
  { rsid: "rs1799971", gene: "OPRM1", chr: "6", ref: "A", alt: "G", archaic: "A", note: { fr: "Récepteur opioïde — allèle ancestral.", en: "Opioid receptor — ancestral allele." } },
  { rsid: "rs333", gene: "CCR5", chr: "3", ref: "A", alt: "T", archaic: "A", note: { fr: "CCR5 — segment ancestral.", en: "CCR5 — ancestral segment." } },
  { rsid: "rs1050828", gene: "G6PD", chr: "X", ref: "C", alt: "T", archaic: "C", note: { fr: "G6PD — allèle ancestral.", en: "G6PD — ancestral allele." } },
  { rsid: "rs7903146", gene: "TCF7L2", chr: "10", ref: "C", alt: "T", archaic: "C", note: { fr: "TCF7L2 — haplotype partagé avec archaïques.", en: "TCF7L2 — haplotype shared with archaics." } },
  { rsid: "rs1801133", gene: "MTHFR", chr: "1", ref: "C", alt: "T", archaic: "C", note: { fr: "MTHFR — allèle ancestral commun.", en: "MTHFR — common ancestral allele." } },
  { rsid: "rs6025", gene: "F5", chr: "1", ref: "C", alt: "T", archaic: "C", note: { fr: "Facteur V — allèle ancestral.", en: "Factor V — ancestral allele." } },
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
