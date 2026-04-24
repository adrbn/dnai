import type { Act } from "./acts";

const SIG_FR: Record<string, string> = {
  P: "pathogène",
  LP: "probablement pathogène",
  "P/LP": "pathogène ou probablement pathogène",
};

const SEV_FR: Record<"high" | "medium" | "low", string> = {
  high: "pertinence haute",
  medium: "pertinence modérée",
  low: "pertinence faible",
};

function plural(n: number, sing: string, plur: string): string {
  return n > 1 ? plur : sing;
}

/** Return a plain-text French narration of an act, suitable for SpeechSynthesis. */
export function narrationFor(act: Act): string {
  switch (act.kind) {
    case "intro":
      return `Votre génome, lu comme une histoire. ${act.primer} Nous allons vous emmener sur les variants qui comptent, chromosome par chromosome.`;
    case "ancestry": {
      const a = act.ancestry;
      const top = a.topRegion;
      const sec = a.components
        .filter((c) => c.region !== top.region && c.percent >= 3)
        .map((c) => `${c.label} à ${c.percent.toFixed(0)} pour cent`)
        .join(", ");
      return `Vos origines. La composante dominante de votre ADN est ${top.label} à ${top.percent.toFixed(0)} pour cent. ${sec ? `Composantes secondaires : ${sec}.` : ""}`;
    }
    case "haplogroup-y":
      return `Lignée paternelle. Votre haplogroupe Y est ${act.hap.assigned}. ${act.hap.description} ${act.hap.migration ?? ""}`;
    case "haplogroup-mt":
      return `Lignée maternelle. Votre haplogroupe mitochondrial est ${act.hap.assigned}. ${act.hap.description} ${act.hap.migration ?? ""}`;
    case "neanderthal":
      return `Héritage néandertalien. Environ ${act.neanderthal.percent.toFixed(2)} pour cent de votre génome porte des traces archaïques. Il y a cinquante mille ans, vos ancêtres ont croisé des Néandertaliens.`;
    case "health-intro":
      return act.count === 0
        ? "Santé. Aucune variante pathogène n'a été détectée dans les bases cliniques."
        : `Santé. ${act.count} ${plural(act.count, "variante pathogène a été trouvée", "variantes pathogènes ont été trouvées")} dans les bases cliniques.`;
    case "clinvar": {
      const f = act.finding;
      return `Variant clinique sur le gène ${f.entry.gene}, classé ${SIG_FR[f.entry.sig] ?? f.entry.sig}. ${f.entry.condition ?? ""} Génotype observé : ${f.observed}, en ${f.zygosity}. ${f.entry.note ?? ""}`;
    }
    case "actionable":
      return `Variants documentés. ${act.findings.length} ${plural(act.findings.length, "variant simple associé", "variants simples associés")} à une signification clinique.`;
    case "carriers":
      return `Dépistage de porteurs. ${act.findings.length} ${plural(act.findings.length, "variant récessif détecté", "variants récessifs détectés")} — sans symptôme chez vous mais transmissibles.`;
    case "pharma-intro":
      return act.drugCount === 0
        ? "Pharmacogénomique. Aucune règle CPIC ou DPWG n'est déclenchée par votre génotype."
        : `Pharmacogénomique. ${act.drugCount} ${plural(act.drugCount, "médicament est potentiellement affecté", "médicaments sont potentiellement affectés")} par vos variants.`;
    case "pharma": {
      const d = act.drug;
      return `Médicament ${d.drug}, ${SEV_FR[d.severity]}. ${d.effect}`;
    }
    case "prs-intro":
      return `Scores polygéniques. ${act.count} traits évalués en additionnant des milliers de petites variations.`;
    case "prs": {
      const p = act.finding;
      return `${p.rule.trait}. Vous êtes au percentile ${p.percentile.toFixed(0)}. ${p.rule.description}`;
    }
    case "traits":
      return `Vos traits. Voici quelques signatures observables portées par votre génome : ${act.traits
        .map((t) => `${t.rule.title}${t.result?.label ? `, ${t.result.label}` : ""}`)
        .join(" ; ")}.`;
    case "roh":
      return `Homozygotie. ${(act.fRoh * 100).toFixed(2)} pour cent de votre génome se trouve dans des segments homozygotes, répartis sur ${act.segments} ${plural(act.segments, "segment", "segments")}. ${act.interpretation}`;
    case "fun":
      return `ADN créatif. Trois signatures uniques ont été générées depuis l'empreinte de votre fichier : une mélodie, un sigil, et vos jumeaux historiques. Purement ludique.`;
    case "outro":
      return `C'est votre génome. ${act.clinvarTotal} ${plural(act.clinvarTotal, "alerte santé", "alertes santé")}, ${act.pharmaTotal} ${plural(act.pharmaTotal, "médicament", "médicaments")}, ${act.prsTotal} ${plural(act.prsTotal, "score", "scores")}, et ${act.traitsTotal} ${plural(act.traitsTotal, "trait", "traits")}.`;
  }
}
