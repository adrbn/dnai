import type { DnaSource } from "./types";

type SourceDescriptor = {
  label: string;
  kind: "chip" | "wgs" | "unknown";
  typicalSnps: string;
};

const SOURCE_INFO: Record<DnaSource, SourceDescriptor> = {
  myheritage: { label: "MyHeritage", kind: "chip", typicalSnps: "~700 000" },
  "23andme": { label: "23andMe", kind: "chip", typicalSnps: "~600 000" },
  ancestrydna: { label: "AncestryDNA", kind: "chip", typicalSnps: "~700 000" },
  livingdna: { label: "Living DNA", kind: "chip", typicalSnps: "~650 000" },
  ftdna: { label: "FamilyTreeDNA", kind: "chip", typicalSnps: "~700 000" },
  wgs: { label: "Séquençage génome complet (WGS)", kind: "wgs", typicalSnps: "3–5 millions" },
  unknown: { label: "Source inconnue", kind: "unknown", typicalSnps: "—" },
};

export function sourceLabel(source: DnaSource): string {
  return SOURCE_INFO[source].label;
}

export function sourceKind(source: DnaSource): "chip" | "wgs" | "unknown" {
  return SOURCE_INFO[source].kind;
}

function formatK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 5_000_000 ? 0 : 1)} M`;
  if (n >= 1_000) return `${Math.round(n / 1000)} 000`;
  return `${n}`;
}

/**
 * Primer paragraph adapting to the detected source and SNP count.
 * Shown on the cover page and in the overview.
 */
export function sourcePrimer(source: DnaSource, totalSNPs: number): string {
  const count = formatK(totalSNPs);
  const kind = SOURCE_INFO[source].kind;
  const label = SOURCE_INFO[source].label;

  if (kind === "wgs") {
    return `Votre fichier provient d'un séquençage de génome complet (${count} variants lus). Contrairement aux puces ADN grand public qui ciblent quelques centaines de milliers de positions, un WGS lit chaque base de votre ADN. DNAI exploite ici une fraction très riche de ces variants pour l'analyse clinique, pharmacogénomique et les scores de risque.`;
  }

  if (kind === "chip") {
    return `Une puce ADN type ${label} lit environ ${SOURCE_INFO[source].typicalSnps} positions précises sur votre génome — pas la totalité, mais les endroits les plus informatifs pour la santé, la pharmacologie et les traits. Votre fichier contient ${count} positions exploitables. C'est largement suffisant pour les analyses ci-dessous, avec une couverture très variable selon les gènes : certaines maladies rares ou variants très spécifiques peuvent ne pas être couverts.`;
  }

  return `Votre fichier contient ${count} positions génétiques. La source n'a pas été identifiée automatiquement ; l'analyse reste possible mais la couverture précise de chaque gène ne peut pas être garantie.`;
}

/**
 * One-line chip shown in header / summary.
 */
export function sourceBadge(source: DnaSource, totalSNPs: number): string {
  const label = SOURCE_INFO[source].label;
  if (source === "unknown") return `${formatK(totalSNPs)} positions`;
  return `${label} · ${formatK(totalSNPs)} positions`;
}

/**
 * Adaptive note about what's covered. Used in section intros.
 */
export function coverageNote(source: DnaSource): string {
  const kind = SOURCE_INFO[source].kind;
  if (kind === "wgs") {
    return "Votre séquençage complet couvre quasiment toutes les variations annotées dans nos bases.";
  }
  if (kind === "chip") {
    return `Une puce ${SOURCE_INFO[source].label} ne couvre qu'une sélection de positions : certaines variantes cliniques ne sont pas lues et n'apparaissent donc ni comme présentes ni comme absentes.`;
  }
  return "La couverture de votre fichier n'a pas pu être caractérisée précisément.";
}
