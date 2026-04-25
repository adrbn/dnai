import type { PRSFinding } from "./types";
import type { Lang } from "./i18n/lang";

export interface PRSExplain {
  what: string;
  meaning: string;
  note?: string;
}

type Bucket = "low" | "mid" | "above" | "high";

/**
 * Plain-language explanation for each PRS rule, tailored by percentile bucket.
 * Returns a 2-3 sentence interpretation aimed at a non-expert reader.
 */
export function explainPRS(f: PRSFinding, lang: Lang = "fr"): PRSExplain {
  const p = f.percentile;
  const bucket: Bucket =
    p >= 90 ? "high" : p >= 75 ? "above" : p >= 25 ? "mid" : "low";

  const peopleBelow = Math.round(p);

  switch (f.rule.id) {
    case "prs-cad":
      return {
        what:
          lang === "en"
            ? "Coronary artery disease progressively narrows the heart's arteries and can lead to a heart attack. It is the leading cause of death worldwide."
            : "La maladie coronarienne bouche progressivement les artères du cœur et peut mener à l'infarctus. C'est la première cause de mortalité dans le monde.",
        meaning: riskMeaning(
          bucket,
          peopleBelow,
          lang === "en" ? "a heart attack or coronary disease" : "un infarctus ou une coronaropathie",
          lang,
        ),
        note:
          lang === "en"
            ? "Modifiable factors (smoking, diet, activity, LDL cholesterol, blood pressure) weigh far more than genetics. A high score = extra reason to discuss with your doctor and monitor lipids + blood pressure from age 35-40."
            : "Les facteurs modifiables (tabac, alimentation, activité, cholestérol LDL, tension) pèsent beaucoup plus que la génétique. Un score élevé = raison de plus d'en parler à son médecin et de surveiller lipides + tension dès 35-40 ans.",
      };
    case "prs-ad":
      return {
        what:
          lang === "en"
            ? "Alzheimer's disease is the most common form of dementia in older adults. Variants of the APOE gene strongly modulate risk: ε2 protects, ε4 increases risk."
            : "La maladie d'Alzheimer est la forme la plus fréquente de démence chez les seniors. Certains variants du gène APOE modulent fortement le risque : ε2 protège, ε4 augmente le risque.",
        meaning: riskMeaning(
          bucket,
          peopleBelow,
          lang === "en" ? "late-onset Alzheimer's disease" : "la maladie d'Alzheimer tardive",
          lang,
        ),
        note:
          lang === "en"
            ? "Your MyHeritage chip does not contain rs429358 (APOE ε4), so the strongest genetic factor is not measured here. Regular exercise, sleep, social engagement, and glycemic/blood-pressure control lower risk independently of genes."
            : "Votre chip MyHeritage ne contient pas rs429358 (APOE ε4), donc le plus gros facteur génétique n'est pas mesuré ici. Sport régulier, sommeil, sociabilité et contrôle glycémique / tensionnel réduisent le risque indépendamment des gènes.",
      };
    case "prs-bmi":
      return {
        what:
          lang === "en"
            ? "BMI (body mass index) reflects the weight-to-height² ratio. The FTO gene is the genetic locus with the strongest effect on adult weight gain."
            : "L'IMC (indice de masse corporelle) reflète le rapport poids/taille². Le gène FTO est le locus génétique avec le plus fort effet sur la prise de poids chez l'adulte.",
        meaning: bmiMeaning(bucket, peopleBelow, lang),
        note:
          lang === "en"
            ? "A high score means your body naturally tends toward a higher BMI — it takes a bit more effort to stay lean, but the food environment remains decisive."
            : "Un score élevé signifie que votre corps tend naturellement vers un IMC plus haut — ça demande un peu plus d'effort pour rester mince, mais l'environnement alimentaire reste décisif.",
      };
    case "prs-height":
      return {
        what:
          lang === "en"
            ? "Adult height is highly heritable (~80%) but polygenic: it depends on thousands of small-effect variants. We capture 3 of them here."
            : "La taille adulte est très héritable (~80%) mais polygénique : elle dépend de milliers de variants à petit effet. On en capture ici 3.",
        meaning: heightMeaning(bucket, peopleBelow, lang),
        note:
          lang === "en"
            ? "With only 3 SNPs out of thousands, the prediction is very approximate — the gap with your actual height can be large."
            : "Avec seulement 3 SNPs sur des milliers, la prédiction est très approximative — l'écart avec votre taille réelle peut être grand.",
      };
    case "prs-bc":
      return {
        what:
          lang === "en"
            ? "This score aggregates a handful of common variants associated with breast cancer outside of BRCA. It does not replace a BRCA1/BRCA2 test: rare high-effect mutations are not captured here."
            : "Ce score agrège quelques variants communs associés au cancer du sein hors BRCA. Il ne remplace pas un test BRCA1/BRCA2 : les mutations rares à fort effet ne sont pas captées ici.",
        meaning: riskMeaning(
          bucket,
          peopleBelow,
          lang === "en" ? "breast cancer" : "un cancer du sein",
          lang,
        ),
        note:
          lang === "en"
            ? "Relevant mainly for women. Pathogenic BRCA variants (via dedicated clinical screening) dominate this score entirely if present — this score does not reflect them."
            : "Pertinent surtout pour les femmes. Les variants BRCA pathogènes (dépistage clinique spécifique) dominent totalement ce score si présents — ce score ne les reflète pas.",
      };
    case "prs-afib":
      return {
        what:
          lang === "en"
            ? "Atrial fibrillation is a heart-rhythm disorder that strongly increases stroke risk. The 4q25 locus (PITX2 gene) is the strongest known genetic factor."
            : "La fibrillation atriale est un trouble du rythme cardiaque qui augmente fortement le risque d'AVC. Le locus 4q25 (gène PITX2) est le facteur génétique le plus fort connu.",
        meaning: riskMeaning(
          bucket,
          peopleBelow,
          lang === "en" ? "atrial fibrillation" : "la fibrillation atriale",
          lang,
        ),
        note:
          p >= 90
            ? lang === "en"
              ? "Very high score: a single homozygous high-effect variant explains this ranking. In practice, most carriers will never develop atrial fibrillation, but an occasional ECG after 50 is reasonable."
              : "Score très élevé : un seul variant homozygote à fort effet explique ce classement. En pratique, la majorité des porteurs ne développeront jamais de fibrillation, mais un ECG de temps en temps après 50 ans est raisonnable."
            : lang === "en"
              ? "Most cases appear after age 60. Alcohol, hypertension, obesity, and sleep apnea are the real prevention levers."
              : "La majorité des cas apparaît après 60 ans. L'alcool, l'hypertension, l'obésité et l'apnée du sommeil sont les vrais leviers de prévention.",
      };
    case "prs-longevity":
      return {
        what:
          lang === "en"
            ? "Illustrative score based on variants associated with super-centenarians (FOXO3, APOE ε2). Longevity depends 70-80% on lifestyle, so this score is very limited."
            : "Score illustratif basé sur des variants associés aux super-centenaires (FOXO3, APOE ε2). La longévité dépend à 70-80% du mode de vie, donc ce score est très limité.",
        meaning: longevityMeaning(bucket, peopleBelow, lang),
      };
  }
  return {
    what: f.rule.description,
    meaning:
      lang === "en"
        ? `Your percentile is at ${peopleBelow}%.`
        : `Votre percentile est à ${peopleBelow}%.`,
  };
}

function riskMeaning(bucket: Bucket, peopleBelow: number, condition: string, lang: Lang): string {
  const peopleAbove = 100 - peopleBelow;
  if (lang === "en") {
    if (bucket === "high")
      return `Clearly elevated score: ${peopleBelow} people out of 100 have a lower genetic predisposition than you for ${condition}. It does not mean you will develop the disease, but it is a signal to take seriously.`;
    if (bucket === "above")
      return `Above-average score: roughly ${peopleBelow}% of people have a lower genetic risk than yours for ${condition}. Moderate effect — worth keeping in mind, no need to worry.`;
    if (bucket === "mid")
      return `Average score: neither particularly low nor particularly high for ${condition}. Nothing notable.`;
    return `Low score: about ${peopleAbove}% of people have a higher genetic predisposition than you for ${condition}. A fairly favourable genetic factor — still worth maintaining healthy habits.`;
  }
  if (bucket === "high")
    return `Score nettement élevé : ${peopleBelow} personnes sur 100 ont une prédisposition génétique plus faible que vous pour ${condition}. Ça ne veut pas dire que vous développerez la maladie, mais c'est un signal à prendre au sérieux.`;
  if (bucket === "above")
    return `Score au-dessus de la moyenne : environ ${peopleBelow}% des gens ont un risque génétique inférieur au vôtre pour ${condition}. Effet modéré — à garder en tête, sans s'inquiéter.`;
  if (bucket === "mid")
    return `Score dans la moyenne : ni particulièrement bas, ni particulièrement haut pour ${condition}. Rien à noter.`;
  return `Score bas : environ ${peopleAbove}% des gens ont une prédisposition génétique plus élevée que vous pour ${condition}. Facteur génétique plutôt favorable — reste à cultiver les bons comportements.`;
}

function bmiMeaning(bucket: Bucket, peopleBelow: number, lang: Lang): string {
  if (lang === "en") {
    if (bucket === "high")
      return `Do you carry variants strongly linked to a higher BMI? Yes: you are at the ${peopleBelow}th percentile. Weight gain potentially easier than on average.`;
    if (bucket === "above")
      return `Variants associated with a slightly above-average BMI (${peopleBelow}th percentile).`;
    if (bucket === "mid") return `Average genetic profile for BMI.`;
    return `Variants rather associated with a below-average BMI — genetically favourable metabolism.`;
  }
  if (bucket === "high")
    return `Portez-vous des variants fortement associés à un IMC plus élevé ? Oui : vous êtes au ${peopleBelow}ᵉ percentile. Prise de poids potentiellement plus facile qu'en moyenne.`;
  if (bucket === "above")
    return `Variants associés à un IMC légèrement au-dessus de la moyenne (${peopleBelow}ᵉ percentile).`;
  if (bucket === "mid") return `Profil génétique moyen pour l'IMC.`;
  return `Variants plutôt associés à un IMC plus bas que la moyenne — métabolisme génétiquement favorable.`;
}

function heightMeaning(bucket: Bucket, peopleBelow: number, lang: Lang): string {
  if (lang === "en") {
    if (bucket === "high") return `Variants associated with above-average height (${peopleBelow}th percentile).`;
    if (bucket === "above") return `Slight tendency toward above-average height.`;
    if (bucket === "mid") return `No marked tendency from the variants measured.`;
    return `Variants associated with rather below-average height.`;
  }
  if (bucket === "high") return `Variants associés à une taille au-dessus de la moyenne (${peopleBelow}ᵉ percentile).`;
  if (bucket === "above") return `Légère tendance à une taille au-dessus de la moyenne.`;
  if (bucket === "mid") return `Aucune tendance marquée sur les variants mesurés.`;
  return `Variants associés à une taille plutôt en dessous de la moyenne.`;
}

function longevityMeaning(bucket: Bucket, peopleBelow: number, lang: Lang): string {
  if (lang === "en") {
    if (bucket === "high" || bucket === "above")
      return `You carry alleles favourable to exceptional longevity (${peopleBelow}th percentile). Keep it in perspective: diet, activity, sleep, and social ties have a much larger effect.`;
    if (bucket === "mid") return `Average score — nothing notable either way.`;
    return `Alleles associated with exceptional longevity are rather under-represented — negligible impact relative to lifestyle.`;
  }
  if (bucket === "high" || bucket === "above")
    return `Vous portez des allèles favorables à la longévité exceptionnelle (${peopleBelow}ᵉ percentile). À relativiser : l'alimentation, l'activité, le sommeil et le lien social ont un effet bien plus grand.`;
  if (bucket === "mid") return `Score moyen — rien de notable dans un sens ou l'autre.`;
  return `Allèles associés à la longévité exceptionnelle plutôt peu représentés — impact négligeable au regard du mode de vie.`;
}
