import type { Lang } from "@/lib/i18n/lang";

export type PrimerKind = "prs" | "traits" | "lookup" | "compare" | "pharma" | "health";

interface Copy {
  heading: string;
  body: string;
}

const PRIMER: Record<Lang, Record<PrimerKind, Copy>> = {
  fr: {
    health: {
      heading: "À quoi sert cette section",
      body: "Variants documentés dans ClinVar comme pathogènes ou probablement pathogènes. Pour chaque ligne : ce que fait le gène, ce que votre zygotie implique, et le caveat puce SNP. Si aucun symptôme ni antécédent familial, le faux positif technique reste l'hypothèse à privilégier.",
    },
    pharma: {
      heading: "À quoi sert cette section",
      body: "Pharmacogénomique : vos variants peuvent modifier la façon dont vous métabolisez certains médicaments (efficacité, toxicité, dose). Sources : guidelines CPIC (États-Unis) et DPWG (Pays-Bas), références cliniques internationales. À discuter avec votre médecin avant un nouveau traitement, jamais utiliser pour ajuster soi-même.",
    },
    prs: {
      heading: "À quoi sert cette section",
      body: "Un score polygénique somme les effets de centaines à millions de variants communs pour situer votre profil sur une courbe de population. Ce n'est ni un diagnostic ni un destin — un percentile élevé signale un déplacement statistique, pas une maladie certaine. Précision réduite hors ascendance européenne (biais des cohortes d'origine).",
    },
    traits: {
      heading: "À quoi sert cette section",
      body: "Traits non-cliniques bien étudiés : couleur des yeux, perception du goût (coriandre, asperges, brocoli), tolérance au lactose, métabolisme caféine, chronotype. Chacun repose sur quelques variants à effet fort, faciles à recouper avec ce que vous savez de vous-même. Pas de valeur médicale.",
    },
    lookup: {
      heading: "À quoi sert cette section",
      body: "Recherche libre : tapez n'importe quel rsID pour voir votre génotype et accéder aux ressources externes (SNPedia, dbSNP). Filtrez par chromosome ou consultez la couverture pour comprendre quelles régions de votre génome sont représentées. Tout reste dans votre navigateur.",
    },
    compare: {
      heading: "À quoi sert cette section",
      body: "Charger un second fichier (membre de la famille, ami) pour visualiser où vos génotypes coïncident, divergent, ou ne sont pas couverts. Ne déduit aucune relation de parenté : seul un test ADN dédié peut le faire. Les fichiers restent locaux à votre navigateur des deux côtés.",
    },
  },
  en: {
    health: {
      heading: "What this section is for",
      body: "Variants curated by ClinVar as pathogenic or likely pathogenic. For each entry: what the gene does, what your zygosity means, and the SNP-chip caveat. Without symptoms or family history, technical false-positive remains the most likely hypothesis.",
    },
    pharma: {
      heading: "What this section is for",
      body: "Pharmacogenomics: your variants can change how you metabolise certain drugs (efficacy, toxicity, dose). Sources: CPIC (US) and DPWG (Netherlands) clinical guidelines, international references. Discuss with your physician before a new treatment, never self-adjust.",
    },
    prs: {
      heading: "What this section is for",
      body: "A polygenic score sums the effects of hundreds to millions of common variants to place your profile on a population curve. It is neither a diagnosis nor a destiny — a high percentile means a statistical shift, not a certain disease. Reduced accuracy outside European ancestry (biased source cohorts).",
    },
    traits: {
      heading: "What this section is for",
      body: "Well-studied non-clinical traits: eye colour, taste perception (cilantro, asparagus, broccoli), lactose tolerance, caffeine metabolism, chronotype. Each rests on a few strong-effect variants, easy to cross-check against what you already know about yourself. No medical value.",
    },
    lookup: {
      heading: "What this section is for",
      body: "Free search: type any rsID to see your genotype and reach external resources (SNPedia, dbSNP). Filter by chromosome or check coverage to understand which regions of your genome are represented. Everything stays in your browser.",
    },
    compare: {
      heading: "What this section is for",
      body: "Load a second file (family member, friend) to visualise where your genotypes match, diverge or aren't covered. No kinship is inferred — only a dedicated DNA test can do that. Both files stay local to your browser.",
    },
  },
};

export function SectionPrimer({ kind, lang = "fr" }: { kind: PrimerKind; lang?: Lang }) {
  const c = PRIMER[lang][kind];
  return (
    <aside
      role="note"
      className="mb-4 rounded-lg border-l-4 border-accent/60 bg-surface-2/40 px-4 py-3"
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider text-accent">
        {c.heading}
      </div>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-fg-muted">{c.body}</p>
    </aside>
  );
}
