import type { Lang } from "./lang";

/**
 * Report-level UI strings. Not a full translation of the app — keeps the card
 * headers, section titles, legends, and most-visible labels in sync. Body
 * copy (explanatory paragraphs, SNP detail tables, scientific notes) stays
 * French for now; the partial-translation banner warns users who pick EN.
 */

export const S = {
  partialTranslation: {
    fr: "",
    en: "Report chrome is translated; deeper explanations remain in French for now.",
  },

  // OverviewSection
  overview: {
    healthTitle: { fr: "Santé", en: "Health" },
    healthTotalLabel: { fr: "variantes P/LP", en: "P/LP variants" },
    healthEmpty: {
      fr: "Aucune variante pathogène détectée sur les gènes curés.",
      en: "No pathogenic variants detected on curated genes.",
    },
    pharmaTitle: { fr: "Pharmaco", en: "Pharma" },
    pharmaTotalLabel: { fr: "médicaments concernés", en: "drugs affected" },
    pharmaEmpty: {
      fr: "Pas d'alerte CPIC / DPWG pour les SNPs lus.",
      en: "No CPIC / DPWG alert for the genotyped SNPs.",
    },
    prsTitle: { fr: "Risque polygénique", en: "Polygenic risk" },
    prsTotalLabel: { fr: "scores calculés", en: "scores computed" },
    prsEmpty: {
      fr: "Aucun score polygénique à afficher.",
      en: "No polygenic score to display.",
    },
    karyogramTitle: { fr: "Karyogramme", en: "Karyogram" },
    karyogramSubtitle: {
      fr: "Cartographie des chromosomes (GRCh37) · rouge = ClinVar P/LP · orange = pharmaco",
      en: "Chromosome map (GRCh37) · red = ClinVar P/LP · orange = pharmacogenomics",
    },
    densityTitle: { fr: "Densité de SNPs", en: "SNP density" },
    densitySubtitle: {
      fr: "Couverture par chromosome · bins 1 Mb, échelle log",
      en: "Coverage per chromosome · 1 Mb bins, log scale",
    },
    rohTitle: { fr: "Segments homozygotes", en: "Homozygous segments" },
    rohSubtitle: {
      fr: "Estimateur F_ROH de consanguinité · segments ≥ 1 Mb",
      en: "F_ROH inbreeding estimator · segments ≥ 1 Mb",
    },
    imputationTitle: { fr: "Imputation LD (proxies)", en: "LD-proxy imputation" },
    imputationLead: {
      fr: "Certains variants absents de votre chip ont été imputés depuis un SNP voisin en déséquilibre de liaison (référence EUR). Approximation honnête — utile pour ne pas perdre un trait à cause d'une puce incomplète, mais moins fiable qu'un génotypage direct.",
      en: "Some variants missing from your chip were imputed from a neighbouring SNP in tight LD (EUR reference). An honest approximation — useful to avoid losing a trait to an incomplete array, but less reliable than direct genotyping.",
    },
  },

  // Health
  health: {
    title: { fr: "Santé", en: "Health" },
    subtitle: {
      fr: "Variantes ClinVar P/LP repérées sur votre chip. Information, pas diagnostic.",
      en: "ClinVar P/LP variants detected on your chip. Information, not diagnosis.",
    },
    none: {
      fr: "Aucune variante pathogène détectée.",
      en: "No pathogenic variants detected.",
    },
  },

  // Pharma
  pharma: {
    title: { fr: "Pharmacogénomique", en: "Pharmacogenomics" },
    radialTitle: { fr: "Vue radiale", en: "Radial view" },
    radialSubtitle: {
      fr: "Chaque secteur = un médicament affecté. Cliquez pour détailler.",
      en: "Each sector = an affected drug. Click for details.",
    },
    allDrugsTitle: { fr: "Tous les médicaments", en: "All drugs" },
    legendHigh: { fr: "Pertinence haute", en: "High relevance" },
    legendMed: { fr: "Pertinence modérée", en: "Moderate relevance" },
    legendLow: { fr: "Pertinence faible", en: "Low relevance" },
  },

  // PRS
  prs: {
    radarTitle: { fr: "Vous, d'un seul coup d'œil", en: "You, at a glance" },
    radarSubtitleTpl: {
      fr: (n: number) => `${n} scores — distance au centre = votre percentile vs la population de référence`,
      en: (n: number) => `${n} scores — distance from center = your percentile vs the reference population`,
    },
    disclaimerTitle: { fr: "Scores polygéniques éducatifs", en: "Polygenic scores — educational" },
    disclaimerBody: {
      fr: "Chaque score combine un nombre limité de variants à effet connu. Il ne constitue pas un test clinique : la variance expliquée est faible, et des facteurs environnementaux non-génétiques dominent pour la plupart de ces conditions.",
      en: "Each score combines a limited number of variants with known effect. It is not a clinical test: the variance explained is low, and non-genetic environmental factors dominate for most of these conditions.",
    },
    meaning: {
      fr: "Ce que ça veut dire pour vous",
      en: "What it means for you",
    },
    distributionCaption: {
      fr: "Courbe = distribution du score dans la population de référence. Votre position relative est marquée.",
      en: "Curve = score distribution in the reference population. Your relative position is marked.",
    },
  },

  // Traits
  traits: {
    avatarTitle: { fr: "Votre avatar", en: "Your avatar" },
    avatarSubtitle: {
      fr: "Cartoon dérivé de vos variants morphologiques — caricatural, pas un portrait.",
      en: "Cartoon derived from your morphological variants — caricatural, not a portrait.",
    },
    appearance: { fr: "Apparence", en: "Appearance" },
    nutrition: { fr: "Nutrition & métabolisme", en: "Nutrition & metabolism" },
    other: { fr: "Autres traits", en: "Other traits" },
    variants: { fr: "variants", en: "variants" },
    indeterminateTpl: {
      fr: (n: number) => `${n} trait(s) indéterminé(s) — rsID manquant ou génotype non reconnu`,
      en: (n: number) => `${n} indeterminate trait(s) — rsID missing or genotype not recognised`,
    },
  },

  // Lookup
  lookup: {
    title: { fr: "Recherche libre", en: "Free lookup" },
    placeholder: { fr: "rsID (ex: rs1815739)", en: "rsID (e.g. rs1815739)" },
    notFound: { fr: "Non trouvé dans votre fichier", en: "Not found in your file" },
  },

  // Compare
  compare: {
    title: { fr: "Comparer", en: "Compare" },
    subtitle: {
      fr: "Chargez un second fichier pour voir les différences génotype par génotype.",
      en: "Load a second file to see the genotype-by-genotype differences.",
    },
  },
} as const;

/** Lookup helper — picks the language-matched variant of a leaf entry. */
export function tr<T extends { fr: string; en: string }>(entry: T, lang: Lang): string {
  return entry[lang];
}

/** Template helper — for entries that take an argument. */
export function trTpl<T>(
  entry: { fr: (x: T) => string; en: (x: T) => string },
  lang: Lang,
  arg: T,
): string {
  return entry[lang](arg);
}
