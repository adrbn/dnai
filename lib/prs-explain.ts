import type { PRSFinding } from "./types";

export interface PRSExplain {
  what: string;
  meaning: string;
  note?: string;
}

/**
 * Plain-language explanation for each PRS rule, tailored by percentile bucket.
 * Returns a 2-3 sentence interpretation aimed at a non-expert reader.
 */
export function explainPRS(f: PRSFinding): PRSExplain {
  const p = f.percentile;
  const bucket: "low" | "mid" | "above" | "high" =
    p >= 90 ? "high" : p >= 75 ? "above" : p >= 25 ? "mid" : "low";

  const peopleBelow = Math.round(p);
  const peopleAbove = 100 - peopleBelow;

  switch (f.rule.id) {
    case "prs-cad":
      return {
        what:
          "La maladie coronarienne bouche progressivement les artères du cœur et peut mener à l'infarctus. C'est la première cause de mortalité dans le monde.",
        meaning: riskMeaning(bucket, peopleBelow, "un infarctus ou une coronaropathie"),
        note:
          "Les facteurs modifiables (tabac, alimentation, activité, cholestérol LDL, tension) pèsent beaucoup plus que la génétique. Un score élevé = raison de plus d'en parler à son médecin et de surveiller lipides + tension dès 35-40 ans.",
      };
    case "prs-ad":
      return {
        what:
          "La maladie d'Alzheimer est la forme la plus fréquente de démence chez les seniors. Certains variants du gène APOE modulent fortement le risque : ε2 protège, ε4 augmente le risque.",
        meaning: riskMeaning(bucket, peopleBelow, "la maladie d'Alzheimer tardive"),
        note:
          "Votre chip MyHeritage ne contient pas rs429358 (APOE ε4), donc le plus gros facteur génétique n'est pas mesuré ici. Sport régulier, sommeil, sociabilité et contrôle glycémique / tensionnel réduisent le risque indépendamment des gènes.",
      };
    case "prs-bmi":
      return {
        what:
          "L'IMC (indice de masse corporelle) reflète le rapport poids/taille². Le gène FTO est le locus génétique avec le plus fort effet sur la prise de poids chez l'adulte.",
        meaning: bmiMeaning(bucket, peopleBelow),
        note:
          "Un score élevé signifie que votre corps tend naturellement vers un IMC plus haut — ça demande un peu plus d'effort pour rester mince, mais l'environnement alimentaire reste décisif.",
      };
    case "prs-height":
      return {
        what:
          "La taille adulte est très héritable (~80%) mais polygénique : elle dépend de milliers de variants à petit effet. On en capture ici 3.",
        meaning: heightMeaning(bucket, peopleBelow),
        note:
          "Avec seulement 3 SNPs sur des milliers, la prédiction est très approximative — l'écart avec votre taille réelle peut être grand.",
      };
    case "prs-bc":
      return {
        what:
          "Ce score agrège quelques variants communs associés au cancer du sein hors BRCA. Il ne remplace pas un test BRCA1/BRCA2 : les mutations rares à fort effet ne sont pas captées ici.",
        meaning: riskMeaning(bucket, peopleBelow, "un cancer du sein"),
        note:
          "Pertinent surtout pour les femmes. Les variants BRCA pathogènes (dépistage clinique spécifique) dominent totalement ce score si présents — ce score ne les reflète pas.",
      };
    case "prs-afib":
      return {
        what:
          "La fibrillation atriale est un trouble du rythme cardiaque qui augmente fortement le risque d'AVC. Le locus 4q25 (gène PITX2) est le facteur génétique le plus fort connu.",
        meaning: riskMeaning(bucket, peopleBelow, "la fibrillation atriale"),
        note:
          p >= 90
            ? "Score très élevé : un seul variant homozygote à fort effet explique ce classement. En pratique, la majorité des porteurs ne développeront jamais de fibrillation, mais un ECG de temps en temps après 50 ans est raisonnable."
            : "La majorité des cas apparaît après 60 ans. L'alcool, l'hypertension, l'obésité et l'apnée du sommeil sont les vrais leviers de prévention.",
      };
    case "prs-longevity":
      return {
        what:
          "Score illustratif basé sur des variants associés aux super-centenaires (FOXO3, APOE ε2). La longévité dépend à 70-80% du mode de vie, donc ce score est très limité.",
        meaning:
          bucket === "high" || bucket === "above"
            ? `Vous portez des allèles favorables à la longévité exceptionnelle (${peopleBelow}ᵉ percentile). À relativiser : l'alimentation, l'activité, le sommeil et le lien social ont un effet bien plus grand.`
            : bucket === "mid"
              ? `Score moyen — rien de notable dans un sens ou l'autre.`
              : `Allèles associés à la longévité exceptionnelle plutôt peu représentés — impact négligeable au regard du mode de vie.`,
      };
  }
  return {
    what: f.rule.description,
    meaning: `Votre percentile est à ${peopleBelow}%.`,
  };
}

function riskMeaning(
  bucket: "low" | "mid" | "above" | "high",
  peopleBelow: number,
  condition: string,
): string {
  const peopleAbove = 100 - peopleBelow;
  if (bucket === "high")
    return `Score nettement élevé : ${peopleBelow} personnes sur 100 ont une prédisposition génétique plus faible que vous pour ${condition}. Ça ne veut pas dire que vous développerez la maladie, mais c'est un signal à prendre au sérieux.`;
  if (bucket === "above")
    return `Score au-dessus de la moyenne : environ ${peopleBelow}% des gens ont un risque génétique inférieur au vôtre pour ${condition}. Effet modéré — à garder en tête, sans s'inquiéter.`;
  if (bucket === "mid")
    return `Score dans la moyenne : ni particulièrement bas, ni particulièrement haut pour ${condition}. Rien à noter.`;
  return `Score bas : environ ${peopleAbove}% des gens ont une prédisposition génétique plus élevée que vous pour ${condition}. Facteur génétique plutôt favorable — reste à cultiver les bons comportements.`;
}

function bmiMeaning(bucket: "low" | "mid" | "above" | "high", peopleBelow: number): string {
  if (bucket === "high")
    return `Portez-vous des variants fortement associés à un IMC plus élevé ? Oui : vous êtes au ${peopleBelow}ᵉ percentile. Prise de poids potentiellement plus facile qu'en moyenne.`;
  if (bucket === "above")
    return `Variants associés à un IMC légèrement au-dessus de la moyenne (${peopleBelow}ᵉ percentile).`;
  if (bucket === "mid") return `Profil génétique moyen pour l'IMC.`;
  return `Variants plutôt associés à un IMC plus bas que la moyenne — métabolisme génétiquement favorable.`;
}

function heightMeaning(bucket: "low" | "mid" | "above" | "high", peopleBelow: number): string {
  if (bucket === "high") return `Variants associés à une taille au-dessus de la moyenne (${peopleBelow}ᵉ percentile).`;
  if (bucket === "above") return `Légère tendance à une taille au-dessus de la moyenne.`;
  if (bucket === "mid") return `Aucune tendance marquée sur les variants mesurés.`;
  return `Variants associés à une taille plutôt en dessous de la moyenne.`;
}
