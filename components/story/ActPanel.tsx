"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { Act } from "@/lib/story/acts";
import { WorldAncestryMap } from "./WorldAncestryMap";
import { HaplogroupTree } from "./HaplogroupTree";
import { AncestryTree3D } from "./AncestryTree3D";
import { ClinicalNote } from "@/components/ClinicalNote";
import { explainClinVarFinding, prettyCondition } from "@/lib/annotation/clinvar-explain";
import { regionLabel } from "@/lib/annotation/ancestry";
import type { Lang } from "@/lib/i18n/lang";

import { drugName } from "@/lib/drug-label";

const SEV_COLOR = {
  high: "text-oxblood border-oxblood/40 bg-oxblood/8",
  medium: "text-amber border-amber/40 bg-amber/10",
  low: "text-sage border-sage/40 bg-sage/10",
};

const SIG_LABEL: Record<Lang, Record<string, string>> = {
  fr: {
    P: "Pathogène",
    LP: "Probablement pathogène",
    "P/LP": "Pathogène / probablement pathogène",
  },
  en: {
    P: "Pathogenic",
    LP: "Likely pathogenic",
    "P/LP": "Pathogenic / likely pathogenic",
  },
};

const SEV_LABEL: Record<Lang, { high: string; medium: string; low: string }> = {
  fr: { high: "Pertinence haute", medium: "Pertinence modérée", low: "Pertinence faible" },
  en: { high: "High relevance", medium: "Moderate relevance", low: "Low relevance" },
};

const COPY = {
  chapter: {
    fr: {
      intro: "Chapitre 1 — Le code",
      ancestry: "Chapitre 2 — Origines",
      "haplogroup-y": "Lignée paternelle",
      "haplogroup-mt": "Lignée maternelle",
      neanderthal: "Néandertal",
      "health-intro": "Chapitre 3 — Santé",
      clinvar: "Santé",
      actionable: "Variants documentés",
      carriers: "Dépistage de porteurs",
      "pharma-intro": "Chapitre 4 — Pharmaco",
      pharma: "Pharmaco",
      "prs-intro": "Chapitre 5 — Risque",
      prs: "Risque",
      traits: "Chapitre 6 — Traits",
      roh: "Chapitre 7 — Homozygotie",
      fun: "ADN créatif",
      outro: "Épilogue",
    },
    en: {
      intro: "Chapter 1 — The code",
      ancestry: "Chapter 2 — Origins",
      "haplogroup-y": "Paternal line",
      "haplogroup-mt": "Maternal line",
      neanderthal: "Neanderthal",
      "health-intro": "Chapter 3 — Health",
      clinvar: "Health",
      actionable: "Documented variants",
      carriers: "Carrier screening",
      "pharma-intro": "Chapter 4 — Pharma",
      pharma: "Pharma",
      "prs-intro": "Chapter 5 — Risk",
      prs: "Risk",
      traits: "Chapter 6 — Traits",
      roh: "Chapter 7 — Homozygosity",
      fun: "Creative DNA",
      outro: "Epilogue",
    },
  } satisfies Record<Lang, Record<Act["kind"], string>>,
  intro: {
    fr: {
      titleA: "Votre génome,",
      titleB: "lu comme une histoire.",
      body: "Nous allons vous emmener sur les variants qui comptent, chromosome par chromosome.",
      scroll: "Faites défiler pour commencer",
    },
    en: {
      titleA: "Your genome,",
      titleB: "read as a story.",
      body: "We'll walk you through the variants that matter, chromosome by chromosome.",
      scroll: "Scroll to begin",
    },
  },
  health: {
    fr: {
      title: "Santé",
      none: "Aucune variante pathogène détectée dans les bases cliniques (ClinVar P/LP).",
      one: "Une variante pathogène a été trouvée dans les bases cliniques.",
      manyTpl: (n: number) => `${n} variantes pathogènes ou probablement pathogènes ont été trouvées.`,
      foot: "Nous allons nous arrêter sur les plus importantes.",
    },
    en: {
      title: "Health",
      none: "No pathogenic variant found in clinical databases (ClinVar P/LP).",
      one: "One pathogenic variant was found in clinical databases.",
      manyTpl: (n: number) => `${n} pathogenic or likely pathogenic variants were found.`,
      foot: "We'll focus on the most relevant ones.",
    },
  },
  pharmaIntro: {
    fr: {
      title: "Pharmacogénomique",
      none: "Aucune règle CPIC/DPWG déclenchée avec votre génotype.",
      manyTpl: (n: number) => `${n} médicaments sont potentiellement affectés par vos variants.`,
      foot: "Nous allons regarder les plus cliniquement pertinents.",
    },
    en: {
      title: "Pharmacogenomics",
      none: "No CPIC/DPWG rule triggered by your genotype.",
      manyTpl: (n: number) => `${n} drugs are potentially affected by your variants.`,
      foot: "We'll look at the most clinically relevant.",
    },
  },
  pharma: {
    fr: {
      rankTpl: (n: number) => `Rang ${n}`,
      whatHappens: "Ce qui se passe.",
      whyMatters: "Pourquoi c'est utile.",
      whyMattersBody: "Vos variants pharmacogénomiques sont stables : ils restent valables pour toute prescription future. Mentionnez-les à votre médecin avant un nouveau traitement.",
      contributors: "Variants impliqués",
    },
    en: {
      rankTpl: (n: number) => `Rank ${n}`,
      whatHappens: "What happens.",
      whyMatters: "Why it's useful.",
      whyMattersBody: "Your pharmacogenomic variants are stable — they hold for any future prescription. Mention them to your doctor before starting new medication.",
      contributors: "Variants involved",
    },
  },
  prsIntro: {
    fr: {
      title: "Scores polygéniques",
      bodyTpl: (count: number) =>
        `Additionner des milliers de petites variations pour positionner votre risque par rapport à la population. ${count} traits évalués.`,
    },
    en: {
      title: "Polygenic scores",
      bodyTpl: (count: number) =>
        `Adding up thousands of small variations to position your risk relative to the population. ${count} traits evaluated.`,
    },
  },
  prs: {
    fr: {
      percentileTpl: (p: number) => `Percentile ${p.toFixed(0)}`,
      median: "50 (médiane)",
      aboveTpl: (d: number) => `Au-dessus de la médiane (+${d.toFixed(0)} points).`,
      belowTpl: (d: number) => `En-dessous de la médiane (-${d.toFixed(0)} points).`,
      coverageTpl: (pct: number, m: number, t: number) => `Couverture ${pct}% (${m}/${t} SNPs).`,
      meaningHeading: "Ce que ça signifie",
      // Plain-language percentile explanations. The PRS is a relative ranking
      // versus the population, NOT a probability of disease — we frame it that
      // way explicitly so users don't read a 90th-percentile score as a 90%
      // chance of getting the disease.
      meaningTpl: (p: number) => {
        if (p >= 90) return `Sur 100 personnes, ~${(100 - p).toFixed(0)} ont un score génétique plus élevé que vous, et ~${p.toFixed(0)} en ont un plus bas. C'est un classement relatif : vous êtes parmi les plus exposés génétiquement, mais cela ne dit rien d'une probabilité absolue de développer la maladie. L'environnement, l'âge et le mode de vie restent dominants.`;
        if (p >= 75) return `Sur 100 personnes, ~${(100 - p).toFixed(0)} ont un score plus élevé que vous, et ~${p.toFixed(0)} en ont un plus bas. Vous êtes au-dessus de la médiane, sans pour autant être dans le quintile à plus haut risque. C'est un classement relatif, pas une probabilité absolue.`;
        if (p >= 25) return `Sur 100 personnes, ~${(100 - p).toFixed(0)} ont un score plus élevé que vous, et ~${p.toFixed(0)} en ont un plus bas. Vous êtes proche du milieu de la population — un score modéré qui ne pèse pas particulièrement dans un sens ou dans l'autre.`;
        return `Sur 100 personnes, ~${(100 - p).toFixed(0)} ont un score plus élevé que vous, et ~${p.toFixed(0)} en ont un plus bas. Vous êtes parmi les profils génétiquement les moins exposés — un facteur favorable, mais qui n'élimine pas l'effet de l'âge, du mode de vie et de l'environnement.`;
      },
      caveat: "Un PRS est un classement génétique vs population, pas une probabilité de maladie. Pour information, ne constitue pas une recommandation médicale.",
    },
    en: {
      percentileTpl: (p: number) => `Percentile ${p.toFixed(0)}`,
      median: "50 (median)",
      aboveTpl: (d: number) => `Above median (+${d.toFixed(0)} points).`,
      belowTpl: (d: number) => `Below median (-${d.toFixed(0)} points).`,
      coverageTpl: (pct: number, m: number, t: number) => `Coverage ${pct}% (${m}/${t} SNPs).`,
      meaningHeading: "What this means",
      meaningTpl: (p: number) => {
        if (p >= 90) return `Out of 100 people, about ~${(100 - p).toFixed(0)} have a higher genetic score than you, and ~${p.toFixed(0)} have a lower one. This is a relative ranking — you sit among the more genetically exposed, but it does not give an absolute probability of developing the disease. Environment, age and lifestyle remain dominant drivers.`;
        if (p >= 75) return `Out of 100 people, about ~${(100 - p).toFixed(0)} have a higher score than you, and ~${p.toFixed(0)} have a lower one. You are above the median, without being in the top-risk quintile. It's a relative ranking, not an absolute probability.`;
        if (p >= 25) return `Out of 100 people, about ~${(100 - p).toFixed(0)} have a higher score than you, and ~${p.toFixed(0)} have a lower one. You're close to the middle of the population — a moderate score that doesn't tilt strongly either way.`;
        return `Out of 100 people, about ~${(100 - p).toFixed(0)} have a higher score than you, and ~${p.toFixed(0)} have a lower one. You're among the least genetically exposed — a favourable factor, but one that does not erase the effect of age, lifestyle and environment.`;
      },
      caveat: "A PRS is a genetic ranking vs the population, not a probability of disease. For information only; does not constitute medical advice.",
    },
  },
  traits: {
    fr: {
      title: "Vos traits",
      body: "Quelques signatures observables portées par votre génome.",
    },
    en: {
      title: "Your traits",
      body: "A few observable signatures carried by your genome.",
    },
  },
  roh: {
    fr: { title: "Homozygotie", segmentsTpl: (n: number) => `${n} segment${n > 1 ? "s" : ""}` },
    en: { title: "Homozygosity", segmentsTpl: (n: number) => `${n} segment${n > 1 ? "s" : ""}` },
  },
  outro: {
    fr: {
      title: "C'est votre génome.",
      summaryTpl: (cv: number, ph: number, pr: number, tr: number) =>
        `${cv} alerte${cv > 1 ? "s" : ""} santé · ${ph} médicament${ph > 1 ? "s" : ""} · ${pr} score${pr > 1 ? "s" : ""} · ${tr} trait${tr > 1 ? "s" : ""}.`,
      foot: "Pour une vue détaillée, chaque variant et chaque règle est explorable dans le rapport complet.",
      cta: "Voir le rapport détaillé →",
    },
    en: {
      title: "This is your genome.",
      summaryTpl: (cv: number, ph: number, pr: number, tr: number) =>
        `${cv} health alert${cv > 1 ? "s" : ""} · ${ph} drug${ph > 1 ? "s" : ""} · ${pr} score${pr > 1 ? "s" : ""} · ${tr} trait${tr > 1 ? "s" : ""}.`,
      foot: "For a detailed view, every variant and rule is explorable in the full report.",
      cta: "View the detailed report →",
    },
  },
  ancestry: {
    fr: {
      title: "Vos origines",
      bodyTpl: (total: number, matched: number, coveragePct: string, label: string, percent: string) =>
        `Votre ADN a été projeté sur un panel de ${total} marqueurs continentaux (AIMs). ${matched}/${total} ont pu être lus dans votre fichier (${coveragePct}% de couverture). La composante dominante est`,
      bodyTail: (label: string, percent: string) => ` à ${percent}%.`,
      howTitle: "Comment c'est calculé",
      howBody:
        "Pour chaque marqueur, on compare vos deux allèles aux fréquences observées dans cinq groupes continentaux (1000 Genomes, ALFA, panels Kidd AISNP). Un maximum de vraisemblance déterminant la composition la plus probable, puis une normalisation softmax donne les pourcentages ci-dessous.",
      secondaryLabel: "Composantes secondaires significatives :",
      secondaryNote:
        "Cela peut refléter une ascendance mixte récente ou un partage ancien de fréquences alléliques entre régions.",
      tl: {
        a: { y: "70k", t: "ans — sortie d'Afrique" },
        b: { y: "45k", t: "ans — peuplement de l'Eurasie" },
        c: { y: "15k", t: "ans — arrivée aux Amériques" },
      },
      caveat:
        "Estimation indicative, pour information — les panels cliniques d'ascendance utilisent des milliers de marqueurs et ne peuvent résoudre des différences sub-continentales fines.",
    },
    en: {
      title: "Your origins",
      bodyTpl: (total: number, matched: number, coveragePct: string, label: string, percent: string) =>
        `Your DNA was projected onto a panel of ${total} continental markers (AIMs). ${matched}/${total} could be read from your file (${coveragePct}% coverage). The dominant component is`,
      bodyTail: (label: string, percent: string) => ` at ${percent}%.`,
      howTitle: "How it's computed",
      howBody:
        "For each marker we compare your two alleles to allele frequencies observed in five continental groups (1000 Genomes, ALFA, Kidd AISNP panels). A maximum-likelihood estimate determines the most probable composition; a softmax normalization yields the percentages below.",
      secondaryLabel: "Significant secondary components:",
      secondaryNote:
        "This can reflect recent admixture or ancient sharing of allele frequencies between regions.",
      tl: {
        a: { y: "70k", t: "years — out of Africa" },
        b: { y: "45k", t: "years — Eurasian peopling" },
        c: { y: "15k", t: "years — arrival in the Americas" },
      },
      caveat:
        "Indicative estimate, for information only — clinical ancestry panels use thousands of markers and cannot resolve fine sub-continental differences.",
    },
  },
  haplogroup: {
    fr: {
      yTitle: "Votre lignée paternelle",
      ySub: "Chromosome Y hérité de père en fils.",
      mtTitle: "Votre lignée maternelle",
      mtSub: "ADN mitochondrial hérité de mère en fille.",
    },
    en: {
      yTitle: "Your paternal line",
      ySub: "Y chromosome inherited father to son.",
      mtTitle: "Your maternal line",
      mtSub: "Mitochondrial DNA inherited mother to daughter.",
    },
  },
  neanderthal: {
    fr: {
      title: "Héritage néandertalien",
      copiesTpl: (a: number, m: number) => `${a}/${m} copies archaïques`,
      body:
        "Il y a ~50 000 ans, vos ancêtres ont croisé des Néandertaliens. Ces fragments persistent : souvent ~2% pour les Eurasiens, plus élevés à l'Est.",
      traces: "Traces détectées",
      hom: "hom.",
      het: "hét.",
      caveatTpl: (m: number, t: number) =>
        `Panel illustratif (${m}/${t}). Les estimations cliniques utilisent plus de 100k SNPs.`,
    },
    en: {
      title: "Neanderthal heritage",
      copiesTpl: (a: number, m: number) => `${a}/${m} archaic copies`,
      body:
        "~50,000 years ago, your ancestors crossed paths with Neanderthals. These fragments persist: typically ~2% for Eurasians, higher in East Asia.",
      traces: "Detected traces",
      hom: "hom.",
      het: "het.",
      caveatTpl: (m: number, t: number) =>
        `Illustrative panel (${m}/${t}). Clinical estimates use more than 100k SNPs.`,
    },
  },
  actionable: {
    fr: { title: "Variants documentés", body: "Variants simples associés à une signification clinique dans la littérature." },
    en: { title: "Documented variants", body: "Single variants associated with clinical significance in the literature." },
  },
  carriers: {
    fr: { title: "Dépistage de porteurs", body: "Variants récessifs sans symptôme chez vous mais transmissibles.", affected: "Atteint", carrier: "Porteur" },
    en: { title: "Carrier screening", body: "Recessive variants — no symptoms in you, but transmissible.", affected: "Affected", carrier: "Carrier" },
  },
  fun: {
    fr: {
      title: "Votre ADN créatif",
      body:
        "Trois signatures — sonore, visuelle, culturelle — dérivées du hash SHA-256 de votre fichier. Déterministes : mêmes octets = mêmes sorties ; un seul bit changé = trois œuvres différentes. Aucun lien avec un phénotype, partageable sans trahir vos variants.",
      twins: "Jumeaux historiques",
      twinsCaveat: "Fictif — clin d'œil ludique",
      melody: "Votre mélodie",
      sigil: "Sigil",
      play: "Écouter",
      stop: "Stop",
      playAria: (playing: boolean) => (playing ? "Arrêter la mélodie" : "Écouter la mélodie"),
      footer:
        "Purement ludique. SHA-256 est à sens unique : le hash ne permet pas de retrouver les variants.",
    },
    en: {
      title: "Your creative DNA",
      body:
        "Three signatures — sonic, visual, cultural — derived from your file's SHA-256 hash. Deterministic: same bytes = same outputs; a single bit changed = three different works. No link to phenotype, shareable without revealing your variants.",
      twins: "Historical twins",
      twinsCaveat: "Fictional — playful wink",
      melody: "Your melody",
      sigil: "Sigil",
      play: "Play",
      stop: "Stop",
      playAria: (playing: boolean) => (playing ? "Stop the melody" : "Play the melody"),
      footer:
        "Purely playful. SHA-256 is one-way: the hash cannot recover your variants.",
    },
  },
  clinvar: {
    fr: {
      rankSepTpl: (r: number, t: number) => `${r}/${t}`,
      gene: "Le gène et la maladie. ",
      genotype: "Votre génotype. ",
      precaution: "Précaution. ",
      inClear: "En clair",
      stat: { genotype: "Génotype", zygosity: "Zygotie", rsid: "rsID", position: "Position" },
    },
    en: {
      rankSepTpl: (r: number, t: number) => `${r}/${t}`,
      gene: "Gene and condition. ",
      genotype: "Your genotype. ",
      precaution: "Caveat. ",
      inClear: "In plain English",
      stat: { genotype: "Genotype", zygosity: "Zygosity", rsid: "rsID", position: "Position" },
    },
  },
} as const;

export function ActPanel({ act, lang = "fr" }: { act: Act; lang?: Lang }) {
  return (
    <div className="pointer-events-auto w-full max-w-xl rounded-sm border border-ink/12 bg-paper p-7 text-ink shadow-[0_30px_80px_-20px_rgba(21,20,16,0.55)] sm:p-9">
      <div className="mb-4">
        <Chapter act={act} lang={lang} />
      </div>
      <Body act={act} lang={lang} />
    </div>
  );
}

function Chapter({ act, lang }: { act: Act; lang: Lang }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-oxblood">
      {COPY.chapter[lang][act.kind]}
    </div>
  );
}

function Body({ act, lang }: { act: Act; lang: Lang }) {
  switch (act.kind) {
    case "intro":
      return <IntroBody act={act} lang={lang} />;
    case "ancestry":
      return <AncestryBody act={act} lang={lang} />;
    case "haplogroup-y":
      return <HaplogroupYBody act={act} lang={lang} />;
    case "haplogroup-mt":
      return <HaplogroupMtBody act={act} lang={lang} />;
    case "neanderthal":
      return <NeanderthalBody act={act} lang={lang} />;
    case "health-intro":
      return <HealthIntroBody count={act.count} lang={lang} />;
    case "clinvar":
      return <ClinVarBody act={act} lang={lang} />;
    case "actionable":
      return <ActionableBody act={act} lang={lang} />;
    case "carriers":
      return <CarriersBody act={act} lang={lang} />;
    case "pharma-intro":
      return <PharmaIntroBody count={act.drugCount} lang={lang} />;
    case "pharma":
      return <PharmaBody act={act} lang={lang} />;
    case "prs-intro":
      return <PRSIntroBody count={act.count} lang={lang} />;
    case "prs":
      return <PRSBody act={act} lang={lang} />;
    case "traits":
      return <TraitsBody act={act} lang={lang} />;
    case "roh":
      return <ROHBody act={act} lang={lang} />;
    case "fun":
      return <FunBody act={act} lang={lang} />;
    case "outro":
      return <OutroBody act={act} lang={lang} />;
  }
}

function IntroBody({ act, lang }: { act: Extract<Act, { kind: "intro" }>; lang: Lang }) {
  const c = COPY.intro[lang];
  return (
    <>
      <h2 className="font-serif text-[40px] font-medium leading-[1.05] tracking-[-0.02em] sm:text-[52px]">
        {c.titleA}
        <br />
        <span className="bg-gradient-to-r from-cobalt to-oxblood bg-clip-text text-transparent">
          {c.titleB}
        </span>
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-ink/80 sm:text-base">
        {act.primer[lang]} {c.body}
      </p>
      <div className="mt-5 flex flex-wrap gap-2 text-xs">
        <Pill>{act.sourceLabel}</Pill>
        <Pill>{act.filename}</Pill>
      </div>
      <p className="mt-5 text-xs text-ink/50">{c.scroll}</p>
    </>
  );
}

function HealthIntroBody({ count, lang }: { count: number; lang: Lang }) {
  const c = COPY.health[lang];
  return (
    <>
      <h2 className="font-serif text-[28px] font-medium tracking-[-0.01em] sm:text-[34px]">{c.title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-ink/80 sm:text-base">
        {count === 0 ? c.none : count === 1 ? c.one : c.manyTpl(count)}
      </p>
      <p className="mt-3 text-xs text-ink/55">{c.foot}</p>
    </>
  );
}

function ClinVarStoryExplainer({
  finding,
  lang,
}: {
  finding: Extract<Act, { kind: "clinvar" }>["finding"];
  lang: Lang;
}) {
  const { what, zygosity, caveat } = explainClinVarFinding(finding, lang);
  const c = COPY.clinvar[lang];
  return (
    <div className="mt-4 space-y-2.5 rounded-lg border-l-2 border-oxblood/40 bg-paperDeep/30 px-3 py-3 text-[13px] leading-relaxed text-ink/85">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-oxblood">
        {c.inClear}
      </div>
      <p>
        <span className="font-semibold text-ink">{c.gene}</span>
        {what}
      </p>
      <p>
        <span className="font-semibold text-ink">{c.genotype}</span>
        {zygosity}
      </p>
      <p className="rounded border border-amber/40 bg-amber/10 px-2.5 py-1.5 text-[11.5px] text-ink/80">
        <span aria-hidden className="mr-1.5">⚠️</span>
        <span className="font-semibold">{c.precaution}</span>
        {caveat}
      </p>
    </div>
  );
}

function ClinVarBody({ act, lang }: { act: Extract<Act, { kind: "clinvar" }>; lang: Lang }) {
  const f = act.finding;
  const c = COPY.clinvar[lang];
  const numLocale = lang === "en" ? "en-US" : "fr-FR";
  return (
    <>
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${SEV_COLOR.high}`}
        >
          {SIG_LABEL[lang][f.entry.sig] ?? f.entry.sig}
        </span>
        <span className="text-xs text-ink/50">
          {act.rank}/{act.totalRanked}
        </span>
      </div>
      <h2 className="font-mono text-3xl font-bold tracking-tight sm:text-4xl">{f.entry.gene}</h2>
      {f.entry.condition && (
        <p className="mt-2 text-sm text-ink/80 sm:text-base">
          {prettyCondition(lang === "en" ? f.entry.condition_en ?? f.entry.condition : f.entry.condition, lang)}
        </p>
      )}
      <ClinVarStoryExplainer finding={f} lang={lang} />
      <div className="mt-4 rounded-lg border border-ink/10 bg-ink/[0.03] p-3 text-xs text-ink/75">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <Stat label={c.stat.genotype} value={f.observed} />
          <Stat label={c.stat.zygosity} value={f.zygosity} />
          <Stat label={c.stat.rsid} value={f.entry.rs} />
          {act.locus && <Stat label={c.stat.position} value={`chr${act.locus.chr}:${act.locus.pos.toLocaleString(numLocale)}`} />}
        </div>
      </div>
      {f.entry.note && (
        <div className="mt-3">
          <ClinicalNote
            text={lang === "en" ? f.entry.note_en ?? f.entry.note : f.entry.note}
            bodyClassName="text-xs italic text-ink/60"
            lang={lang}
          />
        </div>
      )}
    </>
  );
}

function PharmaIntroBody({ count, lang }: { count: number; lang: Lang }) {
  const c = COPY.pharmaIntro[lang];
  return (
    <>
      <h2 className="font-serif text-[28px] font-medium tracking-[-0.01em] sm:text-[34px]">{c.title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-ink/80 sm:text-base">
        {count === 0 ? c.none : c.manyTpl(count)}
      </p>
      <p className="mt-3 text-xs text-ink/55">{c.foot}</p>
    </>
  );
}

function PharmaBody({ act, lang }: { act: Extract<Act, { kind: "pharma" }>; lang: Lang }) {
  const d = act.drug;
  const c = COPY.pharma[lang];
  return (
    <>
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${SEV_COLOR[d.severity]}`}
        >
          {SEV_LABEL[lang][d.severity]}
        </span>
        <span className="text-xs text-ink/50">{c.rankTpl(act.rank)}</span>
      </div>
      <h2 className="font-serif text-[28px] font-medium capitalize tracking-[-0.01em] sm:text-[34px]">{drugName(d.drug, lang)}</h2>
      {(lang === "en" ? d.drug_class_en ?? d.drug_class : d.drug_class) && (
        <p className="mt-1 text-xs text-ink/55 first-letter:uppercase">{lang === "en" ? d.drug_class_en ?? d.drug_class : d.drug_class}</p>
      )}
      <div className="mt-3 space-y-2.5 rounded-lg border-l-2 border-oxblood/40 bg-paperDeep/30 px-3 py-3 text-[13px] leading-relaxed text-ink/85">
        <div>
          <span className="font-semibold text-ink">{c.whatHappens} </span>
          <ClinicalNote
            text={lang === "en" ? d.effect_en ?? d.effect : d.effect}
            bodyClassName="text-[13px] text-ink/85 first-letter:uppercase"
            lang={lang}
          />
        </div>
        <p className="rounded bg-ink/[0.04] px-2.5 py-1.5 text-[11.5px] text-ink/80">
          <span className="font-semibold">{c.whyMatters} </span>
          {c.whyMattersBody}
        </p>
      </div>
      <div className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/55">
        {c.contributors}
      </div>
      <div className="mt-2 space-y-1.5">
        {d.contributors.map((g, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border border-ink/10 bg-ink/[0.03] px-3 py-2 text-xs"
          >
            <span className="font-mono text-cobalt">{g.gene}</span>
            <span className="text-ink/65">{lang === "en" ? g.phenotype_en ?? g.phenotype : g.phenotype}</span>
            <span className="rounded border border-ink/15 bg-ink/5 px-1.5 py-0.5 font-mono text-ink/75">
              {g.zygosity}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function PRSIntroBody({ count, lang }: { count: number; lang: Lang }) {
  const c = COPY.prsIntro[lang];
  return (
    <>
      <h2 className="font-serif text-[28px] font-medium tracking-[-0.01em] sm:text-[34px]">{c.title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-ink/80 sm:text-base">{c.bodyTpl(count)}</p>
    </>
  );
}

function PRSBody({ act, lang }: { act: Extract<Act, { kind: "prs" }>; lang: Lang }) {
  const p = act.finding;
  const c = COPY.prs[lang];
  const highside = p.percentile > 50;
  const distance = Math.abs(p.percentile - 50);
  const tone = distance > 30 ? "high" : distance > 15 ? "medium" : "low";
  return (
    <>
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${SEV_COLOR[tone]}`}
        >
          {c.percentileTpl(p.percentile)}
        </span>
      </div>
      <h2 className="font-serif text-[28px] font-medium tracking-[-0.01em] sm:text-[34px]">{lang === "en" ? p.rule.traitEn ?? p.rule.trait : p.rule.trait}</h2>
      <p className="mt-2 text-xs text-ink/55">{lang === "en" ? p.rule.descriptionEn ?? p.rule.description : p.rule.description}</p>
      <div className="mt-4 rounded-lg border border-ink/10 bg-ink/[0.03] p-4">
        <div className="relative h-2 w-full rounded-full bg-ink/8">
          <div
            className="absolute h-2 rounded-full"
            style={{
              width: `${Math.max(2, Math.min(100, p.percentile))}%`,
              background:
                "linear-gradient(to right, #7c9cff 0%, #c7b2ff 50%, #f76e6e 85%, #dc2626 100%)",
            }}
          />
          <div
            className="absolute -top-1 h-4 w-0.5 bg-ink"
            style={{ left: `${Math.max(0, Math.min(100, p.percentile))}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-ink/45">
          <span>0</span>
          <span>{c.median}</span>
          <span>100</span>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink/65">
        {highside ? c.aboveTpl(p.percentile - 50) : c.belowTpl(50 - p.percentile)}{" "}
        {c.coverageTpl(Math.round(p.coverage * 100), p.matched, p.total)}
      </p>

      <div className="mt-4 space-y-2 rounded-lg border-l-2 border-cobalt/40 bg-paperDeep/30 px-3 py-3 text-[13px] leading-relaxed text-ink/85">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cobalt">
          {c.meaningHeading}
        </div>
        <p>{c.meaningTpl(p.percentile)}</p>
        <p className="rounded border border-amber/40 bg-amber/10 px-2.5 py-1.5 text-[11px] text-ink/80">
          <span aria-hidden className="mr-1.5">⚠️</span>
          {c.caveat}
        </p>
      </div>
    </>
  );
}

function TraitsBody({ act, lang }: { act: Extract<Act, { kind: "traits" }>; lang: Lang }) {
  const c = COPY.traits[lang];
  return (
    <>
      <h2 className="font-serif text-[28px] font-medium tracking-[-0.01em] sm:text-[34px]">{c.title}</h2>
      <p className="mt-2 text-sm text-ink/65">{c.body}</p>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {act.traits.map((t, i) => (
          <div
            key={i}
            className="rounded-lg border border-ink/10 bg-ink/[0.03] px-3 py-2.5 text-sm"
          >
            <div className="flex items-center gap-2">
              {t.result?.emoji && <span className="text-lg">{t.result.emoji}</span>}
              <span className="font-medium text-ink">{lang === "en" ? t.rule.title_en ?? t.rule.title : t.rule.title}</span>
            </div>
            <div className="mt-1 text-xs text-ink/75">{lang === "en" ? t.result?.label_en ?? t.result?.label : t.result?.label}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function ROHBody({ act, lang }: { act: Extract<Act, { kind: "roh" }>; lang: Lang }) {
  const c = COPY.roh[lang];
  return (
    <>
      <h2 className="font-serif text-[28px] font-medium tracking-[-0.01em] sm:text-[34px]">{c.title}</h2>
      <div className="mt-4 flex items-baseline gap-3">
        <div className="font-mono text-5xl font-bold tabular-nums">
          {(act.fRoh * 100).toFixed(2)}
          <span className="text-2xl text-ink/50">%</span>
        </div>
        <div className="text-xs text-ink/55">{c.segmentsTpl(act.segments)}</div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-ink/80 sm:text-base">{act.interpretation[lang]}</p>
    </>
  );
}

function OutroBody({ act, lang }: { act: Extract<Act, { kind: "outro" }>; lang: Lang }) {
  const c = COPY.outro[lang];
  return (
    <>
      <h2 className="font-serif text-[28px] font-medium tracking-[-0.01em] sm:text-[34px]">{c.title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-ink/80 sm:text-base">
        {c.summaryTpl(act.clinvarTotal, act.pharmaTotal, act.prsTotal, act.traitsTotal)}
      </p>
      <p className="mt-3 text-xs text-ink/55">{c.foot}</p>
      <Link
        href="/report"
        className="mt-5 inline-flex items-center gap-2 rounded-sm border border-ink/25 bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink/90"
      >
        {c.cta}
      </Link>
    </>
  );
}

const REGION_COLOR: Record<string, string> = {
  AFR: "#f3a76b",
  EUR: "#7c9cff",
  EAS: "#ecc45c",
  SAS: "#c879d6",
  AMR: "#78dca0",
};

function AncestryBody({ act, lang }: { act: Extract<Act, { kind: "ancestry" }>; lang: Lang }) {
  const a = act.ancestry;
  const top = a.topRegion;
  const secondary = a.components.filter((c) => c.region !== top.region && c.percent >= 3);
  const coveragePct = (a.coverage * 100).toFixed(0);
  const c = COPY.ancestry[lang];
  return (
    <>
      <h2 className="font-serif text-[28px] font-medium tracking-[-0.01em] sm:text-[34px]">{c.title}</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-ink/70">
        {c.bodyTpl(a.total, a.matched, coveragePct, regionLabel(top.region, lang), top.percent.toFixed(1))}{" "}
        <strong className="text-ink">{regionLabel(top.region, lang)}</strong>
        {c.bodyTail(regionLabel(top.region, lang), top.percent.toFixed(1))}
      </p>

      <WorldAncestryMap ancestry={a} lang={lang} />

      {/* Contextual detail block */}
      <div className="mt-4 rounded-sm border border-ink/10 bg-ink/[0.03] p-4 text-[12.5px] leading-relaxed text-ink/75">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-oxblood">
          {c.howTitle}
        </div>
        <p>{c.howBody}</p>
        {secondary.length > 0 && (
          <p className="mt-2">
            {c.secondaryLabel}{" "}
            {secondary.map((s, i) => (
              <span key={s.region}>
                <strong className="text-ink">{regionLabel(s.region, lang)}</strong> ({s.percent.toFixed(1)}%)
                {i < secondary.length - 1 ? ", " : ""}
              </span>
            ))}
            . {c.secondaryNote}
          </p>
        )}
      </div>

      {/* Migration timeline */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] text-ink/65">
        <div className="rounded-sm border border-ink/10 bg-paper p-2.5">
          <div className="font-serif text-[18px] text-ink">{c.tl.a.y}</div>
          <div>{c.tl.a.t}</div>
        </div>
        <div className="rounded-sm border border-ink/10 bg-paper p-2.5">
          <div className="font-serif text-[18px] text-ink">{c.tl.b.y}</div>
          <div>{c.tl.b.t}</div>
        </div>
        <div className="rounded-sm border border-ink/10 bg-paper p-2.5">
          <div className="font-serif text-[18px] text-ink">{c.tl.c.y}</div>
          <div>{c.tl.c.t}</div>
        </div>
      </div>

      <p className="mt-4 text-[11px] italic text-ink/45">{c.caveat}</p>
    </>
  );
}

function HaplogroupYBody({ act, lang }: { act: Extract<Act, { kind: "haplogroup-y" }>; lang: Lang }) {
  const c = COPY.haplogroup[lang];
  return <HaplogroupBody hap={act.hap} kind="y" title={c.yTitle} subtitle={c.ySub} />;
}

function HaplogroupMtBody({ act, lang }: { act: Extract<Act, { kind: "haplogroup-mt" }>; lang: Lang }) {
  const c = COPY.haplogroup[lang];
  return <HaplogroupBody hap={act.hap} kind="mt" title={c.mtTitle} subtitle={c.mtSub} />;
}

function HaplogroupBody({
  hap,
  kind,
  title,
  subtitle,
}: {
  hap: Extract<Act, { kind: "haplogroup-y" }>["hap"];
  kind: "y" | "mt";
  title: string;
  subtitle: string;
}) {
  return (
    <>
      <h2 className="font-serif text-[28px] font-medium tracking-[-0.01em] sm:text-[34px]">{title}</h2>
      <p className="mt-1 text-xs text-ink/60">{subtitle}</p>
      <div className="mt-4 rounded-lg border border-ink/10 bg-ink/[0.03] p-4">
        <div className="font-mono text-4xl font-bold text-ink">{hap.assigned}</div>
        <p className="mt-2 text-sm text-ink/80">{hap.description}</p>
        {hap.migration && (
          <p className="mt-2 text-xs italic text-ink/60">{hap.migration}</p>
        )}
      </div>
      <AncestryTree3D hap={hap} kind={kind} />
      <HaplogroupTree hap={hap} kind={kind} />
    </>
  );
}

function NeanderthalBody({ act, lang }: { act: Extract<Act, { kind: "neanderthal" }>; lang: Lang }) {
  const n = act.neanderthal;
  const c = COPY.neanderthal[lang];
  return (
    <>
      <h2 className="font-serif text-[28px] font-medium tracking-[-0.01em] sm:text-[34px]">{c.title}</h2>
      <div className="mt-4 flex items-baseline gap-3">
        <div className="font-mono text-5xl font-bold tabular-nums text-amber">
          {n.percent.toFixed(2)}
          <span className="text-2xl text-ink/50">%</span>
        </div>
        <div className="text-xs text-ink/55">{c.copiesTpl(n.archaicDosage, n.maxDosage)}</div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink/80">{c.body}</p>
      {n.topHits.length > 0 && (
        <div className="mt-4 space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-ink/50">{c.traces}</div>
          {n.topHits.map((h) => (
            <div
              key={h.rsid}
              className="rounded-lg border border-ink/10 bg-ink/[0.03] px-3 py-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-amber">{h.gene}</span>
                <span className="text-ink/55">{h.dosage === 2 ? c.hom : c.het}</span>
              </div>
              <div className="mt-0.5">
                <ClinicalNote text={h.note[lang]} bodyClassName="text-xs text-ink/75" lang={lang} />
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="mt-3 text-[11px] italic text-ink/45">{c.caveatTpl(n.matchedSnps, n.totalSnps)}</p>
    </>
  );
}

const ACTIONABLE_RISK_COLOR: Record<string, string> = {
  high: "text-oxblood border-oxblood/40 bg-oxblood/10",
  moderate: "text-amber border-amber/40 bg-amber/10",
  low: "text-sage border-sage/40 bg-sage/10",
  neutral: "text-ink/65 border-ink/15 bg-ink/5",
};

function ActionableBody({ act, lang }: { act: Extract<Act, { kind: "actionable" }>; lang: Lang }) {
  const c = COPY.actionable[lang];
  return (
    <>
      <h2 className="font-serif text-[28px] font-medium tracking-[-0.01em] sm:text-[34px]">{c.title}</h2>
      <p className="mt-2 text-xs text-ink/65">{c.body}</p>
      <div className="mt-4 space-y-2">
        {act.findings.map((f) => (
          <div
            key={f.id}
            className="rounded-lg border border-ink/10 bg-ink/[0.03] p-3 text-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="font-medium text-ink">{lang === "en" ? f.name_en ?? f.name : f.name}</div>
                <div className="font-mono text-[10px] text-ink/45">{f.gene}</div>
              </div>
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${ACTIONABLE_RISK_COLOR[f.risk]}`}
              >
                {lang === "en" ? f.call_en ?? f.call : f.call}
              </span>
            </div>
            <div className="mt-1.5">
              <ClinicalNote
                text={lang === "en" ? f.note_en ?? f.note : f.note}
                bodyClassName="text-xs text-ink/75"
                lang={lang}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function CarriersBody({ act, lang }: { act: Extract<Act, { kind: "carriers" }>; lang: Lang }) {
  const c = COPY.carriers[lang];
  return (
    <>
      <h2 className="font-serif text-[28px] font-medium tracking-[-0.01em] sm:text-[34px]">{c.title}</h2>
      <p className="mt-2 text-xs text-ink/65">{c.body}</p>
      <div className="mt-4 space-y-2">
        {act.findings.map((f, i) => (
          <div
            key={i}
            className="flex items-start justify-between gap-3 rounded-lg border border-ink/10 bg-ink/[0.03] p-3 text-sm"
          >
            <div className="min-w-0 flex-1">
              <div className="font-medium text-ink">{lang === "en" ? f.condition_en ?? f.condition : f.condition}</div>
              <div className="font-mono text-[10px] text-ink/45">
                {f.gene} · {f.inheritance} · {f.rsid}
              </div>
              <div className="mt-1">
                <ClinicalNote
                  text={lang === "en" ? f.note_en ?? f.note : f.note}
                  bodyClassName="text-xs text-ink/75"
                  lang={lang}
                />
              </div>
            </div>
            <span
              className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                f.status === "affected"
                  ? ACTIONABLE_RISK_COLOR.high
                  : ACTIONABLE_RISK_COLOR.moderate
              }`}
            >
              {f.status === "affected" ? c.affected : c.carrier}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function FunBody({ act, lang }: { act: Extract<Act, { kind: "fun" }>; lang: Lang }) {
  const f = act.fun;
  const c = COPY.fun[lang];
  return (
    <>
      <h2 className="font-serif text-[28px] font-medium tracking-[-0.01em] sm:text-[32px]">
        {c.title}
      </h2>
      <p className="mt-2 text-[13px] leading-relaxed text-ink/70">{c.body}</p>

      {/* Compact 2-col layout: mélodie + sigil */}
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <MelodyCard music={f.music} lang={lang} />
        <SigilCard art={f.art} lang={lang} />
      </div>

      {/* Twins compact list below */}
      <div className="mt-3 rounded-lg border border-ink/10 bg-ink/[0.03] p-3">
        <div className="flex items-baseline justify-between">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            {c.twins}
          </div>
          <div className="text-[10px] italic text-ink/45">{c.twinsCaveat}</div>
        </div>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {f.twins.map((t) => (
            <div key={t.name.fr} className="rounded-md bg-ink/[0.04] px-2 py-1.5">
              <div className="flex items-center justify-between gap-1.5">
                <span className="truncate text-[12px] font-medium text-ink/90">{t.name[lang]}</span>
                <span className="font-mono text-[10px] text-ink/65 tabular-nums">
                  {t.similarity.toFixed(0)}%
                </span>
              </div>
              <div className="mt-0.5 text-[9px] text-ink/45">{t.era[lang]}</div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-2 text-[10px] italic text-ink/45">{c.footer}</p>
    </>
  );
}

function MelodyCard({ music, lang }: { music: { notes: number[]; tempo: number; key: { fr: string; en: string } }; lang: Lang }) {
  const c = COPY.fun[lang];
  const [playing, setPlaying] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  const play = () => {
    if (playing) {
      stopRef.current?.();
      return;
    }
    const AC = typeof window !== "undefined"
      ? (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
      : null;
    if (!AC) return;
    if (!ctxRef.current) ctxRef.current = new AC();
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") void ctx.resume();

    setPlaying(true);
    const beat = 60 / music.tempo; // seconds per beat
    const now = ctx.currentTime + 0.05;
    const master = ctx.createGain();
    master.gain.value = 0.18;
    master.connect(ctx.destination);

    const oscs: OscillatorNode[] = [];
    music.notes.forEach((midi, i) => {
      const t = now + i * beat;
      const freq = 440 * Math.pow(2, (midi - 69) / 12);
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.9, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + beat * 0.9);
      osc.connect(g).connect(master);
      osc.start(t);
      osc.stop(t + beat);
      oscs.push(osc);
    });

    const totalMs = music.notes.length * beat * 1000 + 200;
    const timer = setTimeout(() => {
      setPlaying(false);
      stopRef.current = null;
    }, totalMs);

    stopRef.current = () => {
      clearTimeout(timer);
      oscs.forEach((o) => {
        try { o.stop(); } catch { /* ignore */ }
      });
      master.disconnect();
      setPlaying(false);
      stopRef.current = null;
    };
  };

  return (
    <div className="rounded-lg border border-ink/10 bg-ink/[0.03] p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          {c.melody}
        </div>
        <button
          type="button"
          onClick={play}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-ink/20 bg-paper px-2.5 py-1 text-[11px] font-medium text-ink transition hover:bg-ink hover:text-paper"
          aria-label={c.playAria(playing)}
        >
          {playing ? (
            <>
              <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor"><rect x="1" y="1" width="3" height="8" /><rect x="6" y="1" width="3" height="8" /></svg>
              {c.stop}
            </>
          ) : (
            <>
              <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor"><polygon points="2,1 9,5 2,9" /></svg>
              {c.play}
            </>
          )}
        </button>
      </div>
      <div className="mt-2 flex h-14 items-end gap-[3px]">
        {music.notes.map((n, i) => {
          const height = ((n - 55) / 30) * 44 + 6;
          return (
            <div
              key={i}
              className="flex-1 rounded-sm transition-all"
              style={{
                height: `${Math.max(4, height)}px`,
                background: `hsl(${210 + (i * 8) % 150} 70% ${50 + (i % 3) * 8}%)`,
                opacity: playing ? 0.95 : 0.7,
              }}
            />
          );
        })}
      </div>
      <div className="mt-2 font-mono text-[10px] text-ink/55">
        {music.key[lang]} · {music.tempo} BPM · {music.notes.length} {lang === "fr" ? "notes" : "notes"} · {lang === "fr" ? "synthé triangle" : "triangle synth"}
      </div>
    </div>
  );
}

function SigilCard({ art, lang }: { art: { seed: string; palette: string[]; shapes: string }; lang: Lang }) {
  const c = COPY.fun[lang];
  return (
    <div className="flex flex-col items-center rounded-lg border border-ink/10 bg-ink/[0.03] p-3">
      <div className="self-start text-[10px] font-semibold uppercase tracking-[0.22em] text-ink/55">
        {c.sigil}
      </div>
      <svg viewBox="0 0 200 200" className="mt-1 h-24 w-24">
        <defs>
          <radialGradient id={`gfun-${art.seed}`}>
            <stop offset="0%" stopColor={art.palette[0]} />
            <stop offset="100%" stopColor={art.palette[3]} />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="80" fill={`url(#gfun-${art.seed})`} opacity="0.3" />
        <path d={art.shapes} fill={art.palette[1]} opacity="0.65" />
        <path d={art.shapes} fill="none" stroke={art.palette[2]} strokeWidth="1.2" />
        <circle cx="100" cy="100" r="3" fill="#fff" />
      </svg>
      <div className="mt-1.5 flex gap-1">
        {art.palette.map((c, i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 rounded-sm border border-ink/10"
            style={{ background: c }}
            title={c}
          />
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span className="text-ink/50">{label}</span>{" "}
      <span className="font-mono text-ink/85">{value}</span>
    </span>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-ink/15 bg-ink/5 px-2.5 py-1 text-ink/75">
      {children}
    </span>
  );
}
