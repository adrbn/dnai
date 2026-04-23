import type { Act } from "./acts";
import type { CameraPose, HighlightPoint } from "@/components/story/Genome3D";
import { locusToWorld } from "./chromosomes";

const FAR: CameraPose = { position: [0, 0, 24], target: [0, 0, 0], fov: 42 };
const GENOME_WIDE: CameraPose = { position: [0, 6, 22], target: [0, 0, 0], fov: 46 };
const GENOME_TILT: CameraPose = { position: [14, 4, 14], target: [0, 0, 0], fov: 44 };
const GENOME_OVERVIEW: CameraPose = { position: [18, 10, 18], target: [0, 0, 0], fov: 40 };

export function poseForAct(act: Act): CameraPose {
  switch (act.kind) {
    case "intro":
      return FAR;
    case "health-intro":
      return GENOME_WIDE;
    case "clinvar": {
      if (!act.locus) return GENOME_TILT;
      const w = locusToWorld(act.locus.chr, act.locus.pos);
      if (!w) return GENOME_TILT;
      return {
        position: [w[0] * 1.35 + 3, w[1] + 2, w[2] * 1.35 + 3],
        target: [w[0], w[1], w[2]],
        fov: 34,
      };
    }
    case "pharma-intro":
      return GENOME_OVERVIEW;
    case "pharma": {
      if (act.loci.length === 0) return GENOME_TILT;
      const worlds = act.loci
        .map((l) => locusToWorld(l.chr, l.pos))
        .filter((w): w is [number, number, number] => w !== null);
      if (worlds.length === 0) return GENOME_TILT;
      const cx = worlds.reduce((s, w) => s + w[0], 0) / worlds.length;
      const cy = worlds.reduce((s, w) => s + w[1], 0) / worlds.length;
      const cz = worlds.reduce((s, w) => s + w[2], 0) / worlds.length;
      return {
        position: [cx * 1.4 + 4, cy + 4, cz * 1.4 + 4],
        target: [cx, cy, cz],
        fov: 40,
      };
    }
    case "prs-intro":
    case "prs":
      return GENOME_OVERVIEW;
    case "traits":
      return { position: [-14, 6, 16], target: [0, 0, 0], fov: 46 };
    case "roh":
      return { position: [12, -4, 18], target: [0, -2, 0], fov: 48 };
    case "outro":
      return { position: [0, 0, 28], target: [0, 0, 0], fov: 40 };
  }
}

export function focusChromosomeForAct(act: Act): string | undefined {
  if (act.kind === "clinvar" && act.locus) return act.locus.chr;
  if (act.kind === "pharma" && act.loci[0]) return act.loci[0].chr;
  return undefined;
}

const SEV_COLOR: Record<"high" | "medium" | "low", string> = {
  high: "#f76e6e",
  medium: "#ecc45c",
  low: "#78dca0",
};

export function highlightsForAct(act: Act): HighlightPoint[] {
  switch (act.kind) {
    case "clinvar": {
      if (!act.locus) return [];
      const severity = act.finding.entry.sig === "P" ? "high" : "medium";
      return [
        {
          id: act.id,
          chr: act.locus.chr,
          pos: act.locus.pos,
          color: SEV_COLOR[severity],
          intensity: 1.4,
        },
      ];
    }
    case "pharma": {
      return act.loci.map((l, i) => ({
        id: `${act.id}-${i}`,
        chr: l.chr,
        pos: l.pos,
        color: SEV_COLOR[act.drug.severity],
        intensity: 1.1,
      }));
    }
    default:
      return [];
  }
}

export type StoryFrame = {
  pose: CameraPose;
  highlights: HighlightPoint[];
  focusChromosome?: string;
  mode: "helix" | "genome";
};

export function frameForAct(act: Act): StoryFrame {
  return {
    pose: poseForAct(act),
    highlights: highlightsForAct(act),
    focusChromosome: focusChromosomeForAct(act),
    mode: act.kind === "intro" ? "helix" : "genome",
  };
}
