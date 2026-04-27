import type { DnaSource } from "./types";
import { S, tr, trTpl } from "./i18n/strings";
import type { Lang } from "./i18n/lang";

type SourceDescriptor = {
  label: { fr: string; en: string };
  kind: "chip" | "wgs" | "unknown";
  typicalSnps: string;
};

const SOURCE_INFO: Record<DnaSource, SourceDescriptor> = {
  myheritage: { label: { fr: "MyHeritage", en: "MyHeritage" }, kind: "chip", typicalSnps: "~700 000" },
  "23andme": { label: { fr: "23andMe", en: "23andMe" }, kind: "chip", typicalSnps: "~600 000" },
  ancestrydna: { label: { fr: "AncestryDNA", en: "AncestryDNA" }, kind: "chip", typicalSnps: "~700 000" },
  livingdna: { label: { fr: "Living DNA", en: "Living DNA" }, kind: "chip", typicalSnps: "~650 000" },
  ftdna: { label: { fr: "FamilyTreeDNA", en: "FamilyTreeDNA" }, kind: "chip", typicalSnps: "~700 000" },
  genesforgood: { label: { fr: "Genes for Good", en: "Genes for Good" }, kind: "chip", typicalSnps: "~600 000" },
  nebula: { label: { fr: "Nebula Genomics (WGS)", en: "Nebula Genomics (WGS)" }, kind: "wgs", typicalSnps: "3–5 M" },
  wgs: {
    label: { fr: "Séquençage génome complet (WGS)", en: "Whole-genome sequencing (WGS)" },
    kind: "wgs",
    typicalSnps: "3–5 M",
  },
  unknown: {
    label: { fr: "Source inconnue", en: "Unknown source" },
    kind: "unknown",
    typicalSnps: "—",
  },
};

export function sourceLabel(source: DnaSource, lang: Lang = "fr"): string {
  return SOURCE_INFO[source].label[lang];
}

export function sourceKind(source: DnaSource): "chip" | "wgs" | "unknown" {
  return SOURCE_INFO[source].kind;
}

function formatK(n: number, lang: Lang): string {
  if (n >= 1_000_000) {
    const v = (n / 1_000_000).toFixed(n >= 5_000_000 ? 0 : 1);
    return lang === "en" ? `${v}M` : `${v} M`;
  }
  if (n >= 1_000) {
    const thousands = Math.round(n / 1000);
    return lang === "en" ? `${thousands},000` : `${thousands} 000`;
  }
  return `${n}`;
}

/**
 * Primer paragraph adapting to the detected source and SNP count.
 * Shown on the cover page and in the overview.
 */
export function sourcePrimer(source: DnaSource, totalSNPs: number, lang: Lang = "fr"): string {
  const count = formatK(totalSNPs, lang);
  const info = SOURCE_INFO[source];
  const label = info.label[lang];

  if (info.kind === "wgs") return trTpl(S.source.primerWgsTpl, lang, count);
  if (info.kind === "chip") return S.source.primerChipTpl[lang](label, info.typicalSnps, count);
  return trTpl(S.source.primerUnknownTpl, lang, count);
}

/**
 * One-line chip shown in header / summary.
 */
export function sourceBadge(source: DnaSource, totalSNPs: number, lang: Lang = "fr"): string {
  const label = SOURCE_INFO[source].label[lang];
  const count = formatK(totalSNPs, lang);
  const positions = tr(S.source.positions, lang);
  if (source === "unknown") return `${count} ${positions}`;
  return `${label} · ${count} ${positions}`;
}

/**
 * Adaptive note about what's covered. Used in section intros.
 */
export function coverageNote(source: DnaSource, lang: Lang = "fr"): string {
  const info = SOURCE_INFO[source];
  if (info.kind === "wgs") return tr(S.source.coverageWgs, lang);
  if (info.kind === "chip") return trTpl(S.source.coverageChipTpl, lang, info.label[lang]);
  return tr(S.source.coverageUnknown, lang);
}
