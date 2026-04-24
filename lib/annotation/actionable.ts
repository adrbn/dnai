import type { ActionableFinding, Base, GenotypeMap } from "../types";
import { genotypeToString, matchAllele } from "../genotype";
import { isNoCall } from "../types";

/**
 * SaMD compliance: reformulate imperative medical advice
 * ("conseil médical recommandé", "surveiller", "recommandé") into
 * descriptive literature references. The app must never appear to
 * prescribe or recommend — only quote published genotype-phenotype
 * associations.
 */
function softenNote(raw: string): string {
  if (!raw) return raw;
  let s = raw;
  s = s.replace(/\bconseil médical recommandé\b/gi, "un suivi médical est décrit dans la littérature");
  s = s.replace(/\bsuivi médical\b/gi, "un suivi médical est mentionné");
  s = s.replace(/\b[Dd]osage de la ferritine recommandé\b/gi, "un dosage de la ferritine est mentionné dans la littérature");
  s = s.replace(/\b[Ss]urveiller la ferritine\b/gi, "un suivi de la ferritine est mentionné");
  s = s.replace(/\b[Ff]olate recommandé\b/gi, "une supplémentation en folate est décrite");
  s = s.replace(/\b[Hh]ygiène de vie protectrice\b/gi, "la littérature associe hygiène de vie et profil protecteur");
  s = s.replace(/\b[Mm]ode de vie, sommeil et suivi conseillés\b/gi, "mode de vie, sommeil et suivi sont cités dans la littérature");
  s = s.replace(/\s{2,}/g, " ").trim();
  if (!s.endsWith(".")) s += ".";
  return `${s} — Source : littérature ClinVar/publications. Pour information, ne constitue pas une recommandation médicale.`;
}

type SingleVariantRule = {
  id: string;
  gene: string;
  name: string;
  rsid: string;
  ref: Base;
  alt: Base;
  // Interpretation for each zygosity
  refRef: { call: string; risk: ActionableFinding["risk"]; note: string };
  refAlt: { call: string; risk: ActionableFinding["risk"]; note: string };
  altAlt: { call: string; risk: ActionableFinding["risk"]; note: string };
};

const SINGLE: SingleVariantRule[] = [
  {
    id: "factor-v-leiden",
    gene: "F5",
    name: "Facteur V Leiden (thrombophilie)",
    rsid: "rs6025",
    ref: "C",
    alt: "T",
    refRef: { call: "Normal", risk: "neutral", note: "Pas de Facteur V Leiden détecté." },
    refAlt: { call: "Hétérozygote", risk: "moderate", note: "Risque de thrombose veineuse ×4–8 vs population générale." },
    altAlt: { call: "Homozygote", risk: "high", note: "Risque de thrombose veineuse ×20–80 — conseil médical recommandé." },
  },
  {
    id: "prothrombin-g20210a",
    gene: "F2",
    name: "Prothrombine G20210A",
    rsid: "rs1799963",
    ref: "G",
    alt: "A",
    refRef: { call: "Normal", risk: "neutral", note: "Pas de variant G20210A." },
    refAlt: { call: "Hétérozygote", risk: "moderate", note: "Risque thrombotique ×2–3." },
    altAlt: { call: "Homozygote", risk: "high", note: "Risque thrombotique fortement élevé — suivi médical." },
  },
  {
    id: "hfe-c282y",
    gene: "HFE",
    name: "Hémochromatose (C282Y)",
    rsid: "rs1800562",
    ref: "G",
    alt: "A",
    refRef: { call: "Normal", risk: "neutral", note: "Pas de variant C282Y." },
    refAlt: { call: "Porteur", risk: "low", note: "Porteur sain — surcharge en fer peu probable." },
    altAlt: { call: "Homozygote", risk: "high", note: "Risque d'hémochromatose héréditaire — dosage de la ferritine recommandé." },
  },
  {
    id: "hfe-h63d",
    gene: "HFE",
    name: "Hémochromatose (H63D)",
    rsid: "rs1799945",
    ref: "C",
    alt: "G",
    refRef: { call: "Normal", risk: "neutral", note: "Pas de variant H63D." },
    refAlt: { call: "Porteur", risk: "low", note: "Variant modéré — pénétrance faible seul." },
    altAlt: { call: "Homozygote", risk: "moderate", note: "Pénétrance variable — surveiller la ferritine." },
  },
  {
    id: "mthfr-c677t",
    gene: "MTHFR",
    name: "MTHFR C677T",
    rsid: "rs1801133",
    ref: "C",
    alt: "T",
    refRef: { call: "CC", risk: "neutral", note: "Activité enzymatique normale." },
    refAlt: { call: "CT", risk: "low", note: "~65% d'activité — généralement sans conséquence." },
    altAlt: { call: "TT", risk: "moderate", note: "~30% d'activité — folate recommandé en cas de grossesse." },
  },
  {
    id: "ldlr-common",
    gene: "LDLR",
    name: "Cholestérol LDL élevé",
    rsid: "rs6511720",
    ref: "G",
    alt: "T",
    refRef: { call: "GG", risk: "neutral", note: "LDL-C médian." },
    refAlt: { call: "GT", risk: "low", note: "LDL-C légèrement abaissé." },
    altAlt: { call: "TT", risk: "low", note: "LDL-C plus bas — effet protecteur cardiovasculaire." },
  },
];

// APOE is determined by combinations of rs429358 and rs7412.
function apoeFromGenotypes(genotypes: GenotypeMap): ActionableFinding | null {
  const a = genotypes.get("rs429358");
  const b = genotypes.get("rs7412");
  if (!a || !b || isNoCall(a) || isNoCall(b)) return null;
  // Haplotype rules:
  // ε2: rs429358=T, rs7412=T
  // ε3: rs429358=T, rs7412=C
  // ε4: rs429358=C, rs7412=C
  function allelesFor(g: { a1: Base; a2: Base }): Base[] {
    return [g.a1, g.a2];
  }
  const aAlleles = allelesFor(a);
  const bAlleles = allelesFor(b);
  // For each of the two chromosomes, pair rs429358 allele with rs7412 allele.
  // We can't phase from genotype alone, but for APOE the common resolutions are unambiguous
  // when only one site is heterozygous.
  function classify(aBase: Base, bBase: Base): "ε2" | "ε3" | "ε4" | "?" {
    if (aBase === "T" && bBase === "T") return "ε2";
    if (aBase === "T" && bBase === "C") return "ε3";
    if (aBase === "C" && bBase === "C") return "ε4";
    return "?";
  }
  // Best-guess phasing: assume the most common haplotypes
  const combos: { c1: [Base, Base]; c2: [Base, Base] }[] = [
    { c1: [aAlleles[0], bAlleles[0]], c2: [aAlleles[1], bAlleles[1]] },
    { c1: [aAlleles[0], bAlleles[1]], c2: [aAlleles[1], bAlleles[0]] },
  ];
  // Pick the combination that produces valid ε alleles
  for (const combo of combos) {
    const e1 = classify(combo.c1[0], combo.c1[1]);
    const e2 = classify(combo.c2[0], combo.c2[1]);
    if (e1 !== "?" && e2 !== "?") {
      const sorted = [e1, e2].sort();
      const geno = `${sorted[0]}/${sorted[1]}`;
      const hasE4 = sorted.includes("ε4");
      const hasE2 = sorted.includes("ε2");
      const bothE4 = sorted[0] === "ε4" && sorted[1] === "ε4";
      const risk: ActionableFinding["risk"] = bothE4
        ? "high"
        : hasE4
          ? "moderate"
          : hasE2
            ? "low"
            : "neutral";
      const note = bothE4
        ? "ε4/ε4 — risque d'Alzheimer à 65+ fortement élevé (~10–15× vs ε3/ε3). Mode de vie, sommeil et suivi conseillés."
        : hasE4
          ? "Une copie ε4 — risque modérément augmenté. Hygiène de vie protectrice."
          : hasE2
            ? "ε2 présent — associé à un risque réduit d'Alzheimer (mais risque dyslipidémique type III si ε2/ε2)."
            : "ε3/ε3 — profil majoritaire, risque de référence.";
      return {
        id: "apoe",
        gene: "APOE",
        name: "APOE (Alzheimer tardif)",
        call: geno,
        risk,
        note: softenNote(note),
        rsids: ["rs429358", "rs7412"],
        genotypes: { rs429358: genotypeToString(a), rs7412: genotypeToString(b) },
      };
    }
  }
  return null;
}

export function computeActionable(genotypes: GenotypeMap): ActionableFinding[] {
  const findings: ActionableFinding[] = [];
  for (const rule of SINGLE) {
    const g = genotypes.get(rule.rsid);
    if (!g || isNoCall(g)) continue;
    const z = matchAllele(g, rule.ref, rule.alt, { tryReverseStrand: true });
    if (z === "nocall" || z === "ambiguous") continue;
    const outcome =
      z === "ref/ref" ? rule.refRef : z === "ref/alt" ? rule.refAlt : rule.altAlt;
    findings.push({
      id: rule.id,
      gene: rule.gene,
      name: rule.name,
      call: outcome.call,
      risk: outcome.risk,
      note: softenNote(outcome.note),
      rsids: [rule.rsid],
      genotypes: { [rule.rsid]: genotypeToString(g) },
    });
  }
  const apoe = apoeFromGenotypes(genotypes);
  if (apoe) findings.push(apoe);
  return findings;
}
