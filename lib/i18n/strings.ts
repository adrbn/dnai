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
    imputationSubtitleTpl: {
      fr: (n: number) => `${n} variant(s) reconstitué(s) via tag SNPs en LD serrée (r² ≥ 0.85)`,
      en: (n: number) => `${n} variant(s) reconstructed via tag SNPs in tight LD (r² ≥ 0.85)`,
    },
    imputationLead: {
      fr: "Certains variants absents de votre chip ont été imputés depuis un SNP voisin en déséquilibre de liaison (référence EUR). Approximation honnête — utile pour ne pas perdre un trait à cause d'une puce incomplète, mais moins fiable qu'un génotypage direct.",
      en: "Some variants missing from your chip were imputed from a neighbouring SNP in tight LD (EUR reference). An honest approximation — useful to avoid losing a trait to an incomplete array, but less reliable than direct genotyping.",
    },
    // File strip labels
    stripFile: { fr: "Fichier", en: "File" },
    stripBuild: { fr: "Build", en: "Build" },
    stripSnps: { fr: "SNPs", en: "SNPs" },
    stripCallRate: { fr: "Call rate", en: "Call rate" },
    stripParsed: { fr: "Parsé", en: "Parsed" },
    stripHash: { fr: "Empreinte", en: "Hash" },
    stripNocall: { fr: "nocall", en: "nocall" },
    // Overflow text on top cards
    othersTpl: {
      fr: (n: number) => `et ${n} autre${n > 1 ? "s" : ""}…`,
      en: (n: number) => `and ${n} other${n > 1 ? "s" : ""}…`,
    },
  },

  // ROHCard
  roh: {
    f_roh: { fr: "F_ROH", en: "F_ROH" },
    segments: { fr: "segments", en: "segments" },
    homozygous: { fr: "homozygotes", en: "homozygous" },
    thresholdTpl: {
      fr: (mb: number, snps: number) => `seuil ${mb} Mb / ${snps} SNPs`,
      en: (mb: number, snps: number) => `threshold ${mb} Mb / ${snps} SNPs`,
    },
    levelStandard: { fr: "Standard", en: "Standard" },
    levelStandardHint: {
      fr: "Valeur normale — rien à signaler. Aucun signe d'apparentement entre vos parents biologiques.",
      en: "Normal value — nothing to flag. No sign of relatedness between your biological parents.",
    },
    levelAncient: { fr: "Cousinage ancien", en: "Distant cousinage" },
    levelAncientHint: {
      fr: "Léger excès d'homozygotie, compatible avec des ancêtres communs lointains (fréquent).",
      en: "Mild excess of homozygosity, consistent with distant common ancestors (common).",
    },
    levelDistant: { fr: "Cousins éloignés", en: "Distant cousins" },
    levelDistantHint: {
      fr: "Homozygotie notable — équivalent à des cousins éloignés dans l'arbre généalogique.",
      en: "Notable homozygosity — equivalent to distant cousins in the family tree.",
    },
    levelClose: { fr: "Apparentement marqué", en: "Close relatedness" },
    levelCloseHint: {
      fr: "Consanguinité marquée — parents biologiques probablement apparentés au 1ᵉʳ ou 2ᵉ degré.",
      en: "Marked consanguinity — biological parents likely related at 1st or 2nd degree.",
    },
    explainerTitle: { fr: "Segments homozygotes (ROH)", en: "Runs of homozygosity (ROH)" },
    explainerBody: {
      fr: "régions où toutes les positions génotypées sont homozygotes. Leur longueur totale divisée par le génome autosomique (~2,88 Gb) donne un estimateur de consanguinité F_ROH. Signal brut : la plupart des segments proviennent simplement de déséquilibres de liaison dans la population, non d'un apparentement parental.",
      en: "regions where all genotyped positions are homozygous. Their total length divided by the autosomal genome (~2.88 Gb) gives an inbreeding estimator F_ROH. Raw signal: most segments simply come from linkage disequilibrium in the population, not parental relatedness.",
    },
  },

  // Density heatmap
  density: {
    legend: { fr: "Densité de SNPs par 1 Mb", en: "SNP density per 1 Mb" },
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
    emptyTitle: {
      fr: "Aucune variante cliniquement significative détectée",
      en: "No clinically significant variant detected",
    },
    emptySubtitle: {
      fr: "Parmi la base ClinVar curée (P/LP, review ≥ 2 étoiles). Absence ≠ garantie — la base v1 est limitée.",
      en: "From the curated ClinVar set (P/LP, review ≥ 2 stars). Absence ≠ guarantee — the v1 database is limited.",
    },
    emptyBody: {
      fr: "Votre génotype ne correspond à aucune des variantes pathogènes de la base seed. Une analyse étendue (ClinVar complète) est prévue en v2.",
      en: "Your genotype does not match any of the pathogenic variants in the seed database. An extended analysis (full ClinVar) is planned for v2.",
    },
    mustRead: { fr: "⚠ À lire impérativement", en: "⚠ Must read" },
    mustReadBody: {
      fr: "Ces variantes sont classées pathogènes ou probablement pathogènes par ClinVar, mais elles ne valent pas diagnostic. Un test génétique clinique est nécessaire pour confirmer. Consultez un professionnel.",
      en: "These variants are classified as pathogenic or likely pathogenic by ClinVar, but they are not a diagnosis. A clinical genetic test is required to confirm. Consult a professional.",
    },
    sigP: { fr: "Pathogène", en: "Pathogenic" },
    sigLP: { fr: "Probablement path.", en: "Likely pathogenic" },
    sigPLP: { fr: "P / LP", en: "P / LP" },
    zygHom: { fr: "Homozygote", en: "Homozygous" },
    zygHet: { fr: "Hétérozygote", en: "Heterozygous" },
    labelRsid: { fr: "rsID", en: "rsID" },
    labelObserved: { fr: "Génotype observé", en: "Observed genotype" },
    labelReview: { fr: "Qualité review", en: "Review quality" },
    refAltTpl: {
      fr: (ref: string, alt: string) => `(ref ${ref} / alt ${alt})`,
      en: (ref: string, alt: string) => `(ref ${ref} / alt ${alt})`,
    },
    linkClinvar: { fr: "→ Fiche ClinVar", en: "→ ClinVar record" },
    link3dOpen: { fr: "→ Structure 3D (AlphaFold)", en: "→ 3D structure (AlphaFold)" },
    link3dClose: { fr: "Masquer la structure 3D", en: "Hide the 3D structure" },
  },

  // Pharma
  pharma: {
    title: { fr: "Pharmacogénomique", en: "Pharmacogenomics" },
    emptySubtitle: {
      fr: "Aucune règle PGx déclenchée avec votre génotype",
      en: "No PGx rule triggered by your genotype",
    },
    emptyBody: {
      fr: "Votre génotype est 'référence' sur l'ensemble des variants PGx couverts. Cela n'exclut pas d'autres interactions non listées dans cette base v1.",
      en: "Your genotype is 'reference' across all covered PGx variants. This does not rule out other interactions not listed in this v1 database.",
    },
    radialTitle: { fr: "Vue radiale", en: "Radial view" },
    radialSubtitle: {
      fr: "Chaque secteur = un médicament affecté. Cliquez pour détailler.",
      en: "Each sector = an affected drug. Click for details.",
    },
    allDrugsTitle: { fr: "Tous les médicaments", en: "All drugs" },
    allDrugsSubtitleTpl: {
      fr: (n: number) => `${n} au total`,
      en: (n: number) => `${n} total`,
    },
    legendHigh: { fr: "Pertinence haute", en: "High relevance" },
    legendMed: { fr: "Pertinence modérée", en: "Moderate relevance" },
    legendLow: { fr: "Pertinence faible", en: "Low relevance" },
    sevLow: { fr: "Pertinence faible", en: "Low relevance" },
    sevMed: { fr: "Pertinence modérée", en: "Moderate relevance" },
    sevHigh: { fr: "Pertinence haute", en: "High relevance" },
    contributorsTitle: { fr: "Contributeurs génétiques", en: "Genetic contributors" },
    link3dOpen: { fr: "3D", en: "3D" },
    link3dClose: { fr: "Masquer 3D", en: "Hide 3D" },
    colDrug: { fr: "Médicament", en: "Drug" },
    colClass: { fr: "Classe", en: "Class" },
    colEffect: { fr: "Effet", en: "Effect" },
    colSeverity: { fr: "Gravité", en: "Severity" },
  },

  // PRS
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

  // SummaryHeader (top banner)
  summary: {
    yourFile: { fr: "Votre fichier", en: "Your file" },
    laypersonRead: { fr: "lecture par profane", en: "plain-language read" },
    headlineTalkToDoc: {
      fr: "Points à discuter avec un médecin",
      en: "Points to discuss with a doctor",
    },
    headlineWatch: { fr: "Quelques points d'attention", en: "A few things to watch" },
    headlineReassuring: { fr: "Bilan rassurant", en: "Reassuring picture" },
    toDo: { fr: "À faire :", en: "To do:" },
    fallbackOk: {
      fr: "Aucune variante pathogène, aucune alerte médicamenteuse, scores de risque dans la moyenne et pas de signe d'apparentement parental.",
      en: "No pathogenic variants, no medication alert, risk scores near the mean, and no sign of parental relatedness.",
    },
    ctaReassuring: {
      fr: "rien de particulier à signaler — continuez d'entretenir votre santé",
      en: "nothing particular to flag — keep looking after your health",
    },
    ctaGenetic: {
      fr: "consulter un généticien pour les variantes dominantes",
      en: "see a geneticist for the dominant variants",
    },
    ctaPharma: {
      fr: "montrer la liste pharmaco à votre médecin avant prescription",
      en: "show the pharma list to your doctor before any new prescription",
    },
    ctaRoh: { fr: "évoquer le F_ROH avec un médecin", en: "raise the F_ROH with a doctor" },
    ctaPrsHigh: {
      fr: "ouvrir l'onglet Risque : chaque carte rouge détaille ce qu'il faut surveiller au quotidien",
      en: "open the Risk tab: each red card details what to watch day-to-day",
    },
    ctaPharmaMild: {
      fr: "mentionner cette liste à votre pharmacien/médecin lors d'une prescription concernée",
      en: "mention this list to your pharmacist/doctor for any relevant prescription",
    },
    labelHealth: { fr: "Santé", en: "Health" },
    labelPharma: { fr: "Pharmaco", en: "Pharma" },
    labelRisk: { fr: "Risque", en: "Risk" },
    labelParente: { fr: "Parenté", en: "Relatedness" },
    labelTop10: { fr: "Top 10%", en: "Top 10%" },
    labelAboveAvg: { fr: "> moyenne", en: "> mean" },
    labelHighRel: { fr: "Pertinence haute", en: "High relevance" },
    labelLowRel: { fr: "Pertinence faible", en: "Low relevance" },
    labelTraits: { fr: "Traits", en: "Traits" },
    pathogenicTpl: {
      fr: (n: number) => `${n} variante${n > 1 ? "s" : ""} pathogène${n > 1 ? "s" : ""} —`,
      en: (n: number) => `${n} pathogenic variant${n > 1 ? "s" : ""} —`,
    },
    criticalReactionTo: {
      fr: "réaction critique à",
      en: "critical reaction to",
    },
    drugsCitedTpl: {
      fr: (n: number) => `${n} médicament${n > 1 ? "s" : ""} cité${n > 1 ? "s" : ""} dans la littérature`,
      en: (n: number) => `${n} drug${n > 1 ? "s" : ""} cited in the literature`,
    },
    prsVeryHighFor: {
      fr: "score polygénique très élevé pour",
      en: "very high polygenic score for",
    },
    prsMildFor: {
      fr: "légèrement au-dessus de la moyenne pour",
      en: "slightly above the mean for",
    },
    rohHighTpl: {
      fr: (v: string) => `parents probablement apparentés (F_ROH ${v})`,
      en: (v: string) => `parents likely related (F_ROH ${v})`,
    },
    rohMildTpl: {
      fr: (v: string) => `signal léger de cousinage dans la lignée (F_ROH ${v})`,
      en: (v: string) => `mild cousinage signal in the lineage (F_ROH ${v})`,
    },
    noneInCuratedDb: {
      fr: "aucune variante pathogène dans la base curée",
      en: "no pathogenic variant in the curated database",
    },
    noneCpicDpwg: {
      fr: "aucune alerte CPIC / DPWG",
      en: "no CPIC / DPWG alert",
    },
    documentedSensitivityTo: {
      fr: "sensibilité documentée à",
      en: "documented sensitivity to",
    },
    shareWithDoctor: {
      fr: "— information à partager avec votre médecin",
      en: "— share with your doctor",
    },
    prsInMeanTpl: {
      fr: (n: number) => `${n} scores dans la moyenne`,
      en: (n: number) => `${n} scores near the mean`,
    },
    prsHighRiskFor: { fr: "risque élevé pour", en: "elevated risk for" },
    prsMildHighFor: { fr: "légèrement élevé pour", en: "slightly elevated for" },
    traitsDeterminedTpl: {
      fr: (ok: number, total: number, nd: number) =>
        `${ok}/${total} déterminés${nd > 0 ? ` · ${nd} non-déterminés (SNPs absents de la puce)` : ""}`,
      en: (ok: number, total: number, nd: number) =>
        `${ok}/${total} determined${nd > 0 ? ` · ${nd} indeterminate (SNPs absent from the chip)` : ""}`,
    },
    // tile labels
    tileSnps: { fr: "SNPs", en: "SNPs" },
    tileCall: { fr: "call", en: "call" },
    tileHealth: { fr: "Santé (ClinVar)", en: "Health (ClinVar)" },
    tilePharma: { fr: "Pharmaco", en: "Pharma" },
    tilePharmaRules: { fr: "règles", en: "rules" },
    tileRiskHigh: { fr: "PRS élevés", en: "High PRS" },
    tileRiskEval: { fr: "évalués", en: "scored" },
    tileTraits: { fr: "Traits", en: "Traits" },
    tileTraitsDet: { fr: "déterminés", en: "determined" },
    tileRoh: { fr: "F_ROH", en: "F_ROH" },
    tileRohSegs: { fr: "segs", en: "segs" },
  },

  // Medical disclaimer banner (sticky top of /report and /story)
  banner: {
    lead: {
      fr: "Information issue de la littérature —",
      en: "Information drawn from the scientific literature —",
    },
    strong: { fr: "pas un diagnostic médical", en: "not a medical diagnosis" },
    tail: {
      fr: ", ne remplace pas une consultation ni un test clinique accrédité.",
      en: ", does not replace a consultation or an accredited clinical test.",
    },
    link: { fr: "Mentions légales", en: "Legal notice" },
    aria: {
      fr: "Avertissement — DNAI n'est pas un diagnostic médical",
      en: "Warning — DNAI is not a medical diagnosis",
    },
  },

  // File source primer (SummaryHeader top card)
  source: {
    labelWgs: { fr: "Séquençage génome complet (WGS)", en: "Whole-genome sequencing (WGS)" },
    labelUnknown: { fr: "Source inconnue", en: "Unknown source" },
    positions: { fr: "positions", en: "positions" },
    primerWgsTpl: {
      fr: (count: string) =>
        `Votre fichier provient d'un séquençage de génome complet (${count} variants lus). Contrairement aux puces ADN grand public qui ciblent quelques centaines de milliers de positions, un WGS lit chaque base de votre ADN. DNAI exploite ici une fraction très riche de ces variants pour l'analyse clinique, pharmacogénomique et les scores de risque.`,
      en: (count: string) =>
        `Your file comes from whole-genome sequencing (${count} variants read). Unlike consumer DNA microarrays which target a few hundred thousand positions, WGS reads every base of your DNA. DNAI leverages a rich fraction of these variants for clinical, pharmacogenomic and polygenic risk analysis.`,
    },
    primerChipTpl: {
      fr: (label: string, typical: string, count: string) =>
        `Une puce ADN type ${label} lit environ ${typical} positions précises sur votre génome — pas la totalité, mais les endroits les plus informatifs pour la santé, la pharmacologie et les traits. Votre fichier contient ${count} positions exploitables. C'est largement suffisant pour les analyses ci-dessous, avec une couverture très variable selon les gènes : certaines maladies rares ou variants très spécifiques peuvent ne pas être couverts.`,
      en: (label: string, typical: string, count: string) =>
        `A ${label}-style DNA microarray reads about ${typical} specific positions on your genome — not everything, but the most informative sites for health, pharmacology and traits. Your file contains ${count} usable positions. This is plenty for the analyses below, with coverage varying by gene: certain rare diseases or very specific variants may not be covered.`,
    },
    primerUnknownTpl: {
      fr: (count: string) =>
        `Votre fichier contient ${count} positions génétiques. La source n'a pas été identifiée automatiquement ; l'analyse reste possible mais la couverture précise de chaque gène ne peut pas être garantie.`,
      en: (count: string) =>
        `Your file contains ${count} genetic positions. The source was not automatically identified; analysis is still possible but the precise coverage of each gene cannot be guaranteed.`,
    },
    coverageWgs: {
      fr: "Votre séquençage complet couvre quasiment toutes les variations annotées dans nos bases.",
      en: "Your whole-genome sequence covers nearly every variation annotated in our databases.",
    },
    coverageChipTpl: {
      fr: (label: string) =>
        `Une puce ${label} ne couvre qu'une sélection de positions : certaines variantes cliniques ne sont pas lues et n'apparaissent donc ni comme présentes ni comme absentes.`,
      en: (label: string) =>
        `A ${label} microarray only covers a selection of positions: some clinical variants are not read and therefore appear neither as present nor absent.`,
    },
    coverageUnknown: {
      fr: "La couverture de votre fichier n'a pas pu être caractérisée précisément.",
      en: "The coverage of your file could not be characterised precisely.",
    },
  },

  // Polygenic risk section (PRSSection)
  prs: {
    radarTitle: { fr: "Vous, en un coup d'œil", en: "You, at a glance" },
    radarSubtitleTpl: {
      fr: (n: number) => `${n} scores — distance au centre = votre percentile vs population de référence`,
      en: (n: number) => `${n} scores — distance from center = your percentile vs the reference population`,
    },
    radarMedian: { fr: "médiane", en: "median" },
    disclaimerTitle: { fr: "Scores polygéniques — éducatif", en: "Polygenic scores — educational" },
    disclaimerBody: {
      fr: "Chaque score agrège un nombre limité de variants à effet connu. Ce n'est pas un test clinique : la variance expliquée est faible et les facteurs non-génétiques et environnementaux dominent pour la plupart de ces conditions.",
      en: "Each score combines a limited number of variants with known effect. It is not a clinical test: the variance explained is low, and non-genetic and environmental factors dominate for most of these conditions.",
    },
    disclaimerReference: {
      fr: "Les percentiles se lisent par rapport à une population de référence (HWE + fréquences alléliques européennes).",
      en: "Percentiles are read against a reference population (HWE + European allele frequencies).",
    },
    empty: { fr: "Aucun score polygénique calculé.", en: "No polygenic score computed." },
    categories: {
      metabolic: { fr: "Métabolique", en: "Metabolic" },
      cardio: { fr: "Cardio", en: "Cardio" },
      neuro: { fr: "Neuro", en: "Neuro" },
      cancer: { fr: "Cancer", en: "Cancer" },
      anthropometric: { fr: "Morpho", en: "Morpho" },
      longevity: { fr: "Longévité", en: "Longevity" },
    },
    bucketVeryHigh: { fr: "Très élevé", en: "Very high" },
    bucketAboveMean: { fr: "Au-dessus moy.", en: "Above avg." },
    bucketAverage: { fr: "Moyenne", en: "Average" },
    bucketBelowMean: { fr: "En dessous moy.", en: "Below avg." },
    bucketVeryLow: { fr: "Très bas", en: "Very low" },
    distCaption: {
      fr: "Courbe = distribution du score dans la population de référence. Votre position relative est marquée.",
      en: "Curve = score distribution in the reference population. Your relative position is marked.",
    },
    meansForYou: { fr: "Ce que ça veut dire pour vous", en: "What this means for you" },
    statPercentile: { fr: "Percentile", en: "Percentile" },
    statZ: { fr: "Z-score", en: "Z-score" },
    statCoverage: { fr: "Couverture", en: "Coverage" },
    techDetails: { fr: "Détails techniques", en: "Technical details" },
    lociMeasured: { fr: "Loci mesurés :", en: "Loci measured:" },
    sourceLabel: { fr: "Source :", en: "Source:" },
    unitsLabel: { fr: "Unités :", en: "Units:" },
    techExplain: {
      fr: "Le z-score = écart standardisé par rapport à la moyenne de la population ; le percentile traduit ce z en classement sur 100. La couverture = SNPs du score effectivement présents sur votre chip.",
      en: "The z-score = standardized distance from the population mean; the percentile maps that z onto a 0–100 ranking. Coverage = SNPs of the score actually present on your chip.",
    },
    showSnps: { fr: "+ Détail par SNP", en: "+ Per-SNP detail" },
    hideSnps: { fr: "− Masquer les SNPs", en: "− Hide SNPs" },
    snpRsid: { fr: "rsID", en: "rsID" },
    snpEffect: { fr: "Effet", en: "Effect" },
    snpWeight: { fr: "Poids", en: "Weight" },
    snpObserved: { fr: "Observé", en: "Observed" },
    snpDose: { fr: "Dose", en: "Dose" },
    snpContrib: { fr: "Contrib.", en: "Contrib." },
    distMean: { fr: "moyenne", en: "mean" },
    distYou: { fr: "Vous", en: "You" },
    percentileOrdinalTpl: {
      fr: (n: number) => `${n}ᵉ percentile`,
      en: (n: number) => `${n}${ordSuffixEn(n)} percentile`,
    },
    medianPopulation: { fr: "Médiane population", en: "Population median" },
  },
} as const;

function ordSuffixEn(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return "th";
  switch (n % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

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
