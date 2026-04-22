import { Base, Genotype, NOCALL, NoCall, Zygosity, isNoCall } from "./types";

const BASES = new Set(["A", "C", "G", "T"]);

export function isBase(x: string): x is Base {
  return BASES.has(x);
}

export function complement(base: Base): Base {
  switch (base) {
    case "A":
      return "T";
    case "T":
      return "A";
    case "C":
      return "G";
    case "G":
      return "C";
  }
}

export function normalize(raw: string): Genotype | NoCall {
  if (!raw) return NOCALL;
  const cleaned = raw.replace(/["\s]/g, "").toUpperCase();
  if (cleaned === "--" || cleaned === "") return NOCALL;
  if (cleaned.length !== 2) return NOCALL;
  const a = cleaned[0];
  const b = cleaned[1];
  if (!isBase(a) || !isBase(b)) return NOCALL;
  return { a1: a, a2: b };
}

export function genotypeToString(g: Genotype | NoCall): string {
  if (isNoCall(g)) return "--";
  const [x, y] = [g.a1, g.a2].sort();
  return `${x}${y}`;
}

type MatchOptions = {
  tryReverseStrand?: boolean;
};

function pairMatches(
  g: Genotype,
  ref: Base,
  alt: Base,
): Exclude<Zygosity, "nocall"> {
  const alleles = [g.a1, g.a2];
  const asRef = alleles.filter((a) => a === ref).length;
  const asAlt = alleles.filter((a) => a === alt).length;
  if (asRef + asAlt !== 2) return "ambiguous";
  if (asRef === 2) return "ref/ref";
  if (asAlt === 2) return "alt/alt";
  return "ref/alt";
}

export function matchAllele(
  g: Genotype | NoCall,
  ref: Base,
  alt: Base,
  opts: MatchOptions = {},
): Zygosity {
  if (isNoCall(g)) return "nocall";
  const forward = pairMatches(g, ref, alt);
  if (forward !== "ambiguous") return forward;
  if (opts.tryReverseStrand) {
    const reverse = pairMatches(g, complement(ref), complement(alt));
    if (reverse !== "ambiguous") return reverse;
  }
  return "ambiguous";
}
