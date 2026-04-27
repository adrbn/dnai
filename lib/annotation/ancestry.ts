import type { AncestryComponent, AncestryResult, Base, GenotypeMap } from "../types";
import { isNoCall } from "../types";

// Panel of AIMs (Ancestry Informative Markers) — compact illustrative set.
// freq = effect-allele frequency per continental group.
// Values are approximated from 1000 Genomes / ALFA / Kidd AISNP panels.
type AIM = {
  rsid: string;
  ref: Base;
  alt: Base;
  freq: { AFR: number; EUR: number; EAS: number; SAS: number; AMR: number };
};

const PANEL: AIM[] = [
  { rsid: "rs3827760", ref: "T", alt: "C", freq: { AFR: 0.0, EUR: 0.02, EAS: 0.93, SAS: 0.05, AMR: 0.45 } }, // EDAR
  { rsid: "rs1426654", ref: "G", alt: "A", freq: { AFR: 0.07, EUR: 1.0, EAS: 0.52, SAS: 0.58, AMR: 0.62 } }, // SLC24A5
  { rsid: "rs16891982", ref: "C", alt: "G", freq: { AFR: 0.0, EUR: 0.98, EAS: 0.01, SAS: 0.08, AMR: 0.35 } }, // SLC45A2
  { rsid: "rs12913832", ref: "A", alt: "G", freq: { AFR: 0.02, EUR: 0.64, EAS: 0.0, SAS: 0.02, AMR: 0.12 } }, // HERC2 blue eyes
  { rsid: "rs1800414", ref: "T", alt: "C", freq: { AFR: 0.0, EUR: 0.0, EAS: 0.6, SAS: 0.02, AMR: 0.05 } }, // OCA2 EAS
  { rsid: "rs4988235", ref: "G", alt: "A", freq: { AFR: 0.03, EUR: 0.58, EAS: 0.0, SAS: 0.15, AMR: 0.3 } }, // LCT
  { rsid: "rs671", ref: "G", alt: "A", freq: { AFR: 0.0, EUR: 0.0, EAS: 0.3, SAS: 0.01, AMR: 0.02 } }, // ALDH2
  { rsid: "rs174546", ref: "C", alt: "T", freq: { AFR: 0.87, EUR: 0.34, EAS: 0.47, SAS: 0.5, AMR: 0.45 } }, // FADS1
  { rsid: "rs1229984", ref: "C", alt: "T", freq: { AFR: 0.0, EUR: 0.03, EAS: 0.7, SAS: 0.15, AMR: 0.04 } }, // ADH1B
  { rsid: "rs17822931", ref: "C", alt: "T", freq: { AFR: 0.0, EUR: 0.17, EAS: 0.88, SAS: 0.05, AMR: 0.3 } }, // ABCC11
  { rsid: "rs1042602", ref: "C", alt: "A", freq: { AFR: 0.0, EUR: 0.42, EAS: 0.01, SAS: 0.12, AMR: 0.15 } }, // TYR
  { rsid: "rs1800407", ref: "G", alt: "A", freq: { AFR: 0.0, EUR: 0.07, EAS: 0.0, SAS: 0.01, AMR: 0.02 } }, // OCA2
  { rsid: "rs2814778", ref: "T", alt: "C", freq: { AFR: 0.92, EUR: 0.01, EAS: 0.0, SAS: 0.01, AMR: 0.1 } }, // DARC (Duffy null)
  { rsid: "rs7495174", ref: "A", alt: "G", freq: { AFR: 0.0, EUR: 0.77, EAS: 0.01, SAS: 0.08, AMR: 0.25 } }, // OCA2 blue eyes
  { rsid: "rs885479", ref: "G", alt: "A", freq: { AFR: 0.04, EUR: 0.08, EAS: 0.45, SAS: 0.07, AMR: 0.35 } }, // MC1R
  { rsid: "rs1800401", ref: "G", alt: "A", freq: { AFR: 0.0, EUR: 0.03, EAS: 0.08, SAS: 0.02, AMR: 0.02 } }, // OCA2
  { rsid: "rs3811799", ref: "G", alt: "A", freq: { AFR: 0.02, EUR: 0.35, EAS: 0.72, SAS: 0.5, AMR: 0.45 } },
  { rsid: "rs2470102", ref: "A", alt: "G", freq: { AFR: 0.0, EUR: 0.07, EAS: 0.93, SAS: 0.3, AMR: 0.55 } },
  { rsid: "rs2302212", ref: "A", alt: "G", freq: { AFR: 0.05, EUR: 0.5, EAS: 0.1, SAS: 0.35, AMR: 0.22 } },
  { rsid: "rs6058017", ref: "A", alt: "G", freq: { AFR: 0.01, EUR: 0.18, EAS: 0.8, SAS: 0.4, AMR: 0.32 } },
  { rsid: "rs7554936", ref: "C", alt: "T", freq: { AFR: 0.1, EUR: 0.78, EAS: 0.55, SAS: 0.4, AMR: 0.48 } },
  { rsid: "rs10497191", ref: "C", alt: "T", freq: { AFR: 0.03, EUR: 0.55, EAS: 0.0, SAS: 0.12, AMR: 0.3 } },
  { rsid: "rs7251928", ref: "G", alt: "A", freq: { AFR: 0.96, EUR: 0.08, EAS: 0.12, SAS: 0.15, AMR: 0.2 } },
  { rsid: "rs1871534", ref: "G", alt: "T", freq: { AFR: 0.22, EUR: 0.0, EAS: 0.0, SAS: 0.01, AMR: 0.05 } }, // SLC30A9 AFR
  { rsid: "rs260690", ref: "T", alt: "C", freq: { AFR: 0.05, EUR: 0.12, EAS: 0.78, SAS: 0.3, AMR: 0.35 } },
  { rsid: "rs4833103", ref: "C", alt: "A", freq: { AFR: 0.8, EUR: 0.1, EAS: 0.02, SAS: 0.05, AMR: 0.08 } },
  { rsid: "rs1800498", ref: "A", alt: "G", freq: { AFR: 0.3, EUR: 0.55, EAS: 0.4, SAS: 0.45, AMR: 0.48 } },
  { rsid: "rs1498444", ref: "C", alt: "T", freq: { AFR: 0.02, EUR: 0.33, EAS: 0.01, SAS: 0.1, AMR: 0.22 } },
  { rsid: "rs12203592", ref: "C", alt: "T", freq: { AFR: 0.0, EUR: 0.14, EAS: 0.0, SAS: 0.02, AMR: 0.05 } }, // IRF4 freckles EUR
  { rsid: "rs1834640", ref: "A", alt: "G", freq: { AFR: 0.03, EUR: 0.99, EAS: 0.45, SAS: 0.5, AMR: 0.6 } }, // SLC24A5 linked
];

const REGION_LABEL: Record<AncestryComponent["region"], string> = {
  AFR: "Afrique sub-saharienne",
  EUR: "Europe",
  EAS: "Asie de l'Est",
  SAS: "Asie du Sud",
  AMR: "Amériques",
};

export const REGION_LABEL_I18N: Record<AncestryComponent["region"], { fr: string; en: string }> = {
  AFR: { fr: "Afrique sub-saharienne", en: "Sub-Saharan Africa" },
  EUR: { fr: "Europe", en: "Europe" },
  EAS: { fr: "Asie de l'Est", en: "East Asia" },
  SAS: { fr: "Asie du Sud", en: "South Asia" },
  AMR: { fr: "Amériques", en: "Americas" },
};

export function regionLabel(region: AncestryComponent["region"], lang: "fr" | "en"): string {
  return REGION_LABEL_I18N[region][lang];
}

function dosage(a1: Base, a2: Base, alt: Base): number {
  return (a1 === alt ? 1 : 0) + (a2 === alt ? 1 : 0);
}

// Binomial log-likelihood of observed dosage given allele freq p
function logL(d: number, p: number): number {
  // Clamp p to avoid log(0)
  const q = Math.min(0.999, Math.max(0.001, p));
  // P(d | p) for diploid: d=0 → (1-q)^2, d=1 → 2q(1-q), d=2 → q^2
  if (d === 0) return 2 * Math.log(1 - q);
  if (d === 1) return Math.log(2) + Math.log(q) + Math.log(1 - q);
  return 2 * Math.log(q);
}

export function computeAncestry(genotypes: GenotypeMap): AncestryResult {
  const regions: AncestryComponent["region"][] = ["AFR", "EUR", "EAS", "SAS", "AMR"];
  const logs: Record<string, number> = { AFR: 0, EUR: 0, EAS: 0, SAS: 0, AMR: 0 };
  let matched = 0;
  for (const aim of PANEL) {
    const g = genotypes.get(aim.rsid);
    if (!g || isNoCall(g)) continue;
    const d = dosage(g.a1, g.a2, aim.alt);
    if (![0, 1, 2].includes(d)) continue;
    matched += 1;
    for (const r of regions) {
      logs[r] += logL(d, aim.freq[r]);
    }
  }
  // Normalize via softmax
  const maxLog = Math.max(...regions.map((r) => logs[r]));
  const exps = regions.map((r) => Math.exp(logs[r] - maxLog));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  const components: AncestryComponent[] = regions.map((r, i) => ({
    region: r,
    label: REGION_LABEL[r],
    percent: Number(((exps[i] / sum) * 100).toFixed(1)),
  }));
  components.sort((a, b) => b.percent - a.percent);
  return {
    components,
    topRegion: components[0],
    coverage: PANEL.length > 0 ? matched / PANEL.length : 0,
    matched,
    total: PANEL.length,
  };
}
