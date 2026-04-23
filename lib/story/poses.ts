import type { Act } from "./acts";
import type { CameraPose, HighlightPoint } from "@/components/story/Genome3D";
import { locusToWorld } from "./chromosomes";

// All acts stay on the beautiful double helix. Camera angles differ per
// chapter to keep visual rhythm (close / wide / tilt / orbit).
const HELIX_FAR: CameraPose = { position: [0, 0, 24], target: [0, 0, 0], fov: 42 };
const HELIX_CLOSE: CameraPose = { position: [6, 0, 10], target: [0, 0, 0], fov: 38 };
const HELIX_TOP: CameraPose = { position: [4, 5, 14], target: [0, 0, 0], fov: 40 };
const HELIX_BOTTOM: CameraPose = { position: [-4, -5, 14], target: [0, -1, 0], fov: 40 };
const HELIX_SIDE: CameraPose = { position: [14, 1, 8], target: [0, 0, 0], fov: 36 };
const HELIX_ORBIT_L: CameraPose = { position: [-12, 3, 12], target: [0, 0, 0], fov: 40 };
const HELIX_OUTRO: CameraPose = { position: [0, 0, 30], target: [0, 0, 0], fov: 38 };

export function poseForAct(act: Act): CameraPose {
  switch (act.kind) {
    case "intro":
      return HELIX_FAR;
    case "ancestry":
      return HELIX_TOP;
    case "haplogroup-y":
      return HELIX_SIDE;
    case "haplogroup-mt":
      return HELIX_ORBIT_L;
    case "neanderthal":
      return HELIX_CLOSE;
    case "health-intro":
      return HELIX_CLOSE;
    case "clinvar":
      return HELIX_SIDE;
    case "actionable":
      return HELIX_CLOSE;
    case "carriers":
      return HELIX_TOP;
    case "pharma-intro":
      return HELIX_TOP;
    case "pharma":
      return HELIX_ORBIT_L;
    case "prs-intro":
    case "prs":
      return HELIX_BOTTOM;
    case "traits":
      return HELIX_CLOSE;
    case "roh":
      return HELIX_SIDE;
    case "fun":
      return HELIX_FAR;
    case "outro":
      return HELIX_OUTRO;
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
    mode: "helix",
  };
}
