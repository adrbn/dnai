"use client";

import { useEffect, useState } from "react";
import { Genome3D, type CameraPose, type HighlightPoint } from "./Genome3D";
import { Genome2D } from "./Genome2D";

interface GenomeStageProps {
  pose: CameraPose;
  highlights: HighlightPoint[];
  focusChromosome?: string;
  mode: "helix" | "genome";
}

export function GenomeStage(props: GenomeStageProps) {
  const [use3D, setUse3D] = useState<boolean | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReducedMotion(rm);

    const hasWebGL = (() => {
      try {
        const c = document.createElement("canvas");
        return !!(c.getContext("webgl2") || c.getContext("webgl"));
      } catch {
        return false;
      }
    })();
    setUse3D(hasWebGL);
  }, []);

  if (use3D === null) {
    return <div className="h-full w-full" />;
  }
  if (use3D) {
    return <Genome3D {...props} reducedMotion={reducedMotion} />;
  }
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#05060c]">
      <Genome2D
        highlights={props.highlights}
        focusChromosome={props.focusChromosome}
        mode={props.mode}
      />
    </div>
  );
}
