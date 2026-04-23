"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAnalysis } from "@/lib/store/analysis";
import { buildStory, type Act } from "@/lib/story/acts";
import { frameForAct, type StoryFrame } from "@/lib/story/poses";
import { GenomeStage } from "@/components/story/GenomeStage";
import { ActPanel } from "@/components/story/ActPanel";
import { DnaMark } from "@/components/ui/DnaMark";
import type { HighlightPoint } from "@/components/story/Genome3D";

export default function StoryPage() {
  const { result, positions } = useAnalysis();
  const router = useRouter();

  useEffect(() => {
    if (!result) router.replace("/");
  }, [result, router]);

  const acts: Act[] = useMemo(() => (result ? buildStory(result, positions) : []), [result, positions]);
  const frames: StoryFrame[] = useMemo(() => acts.map(frameForAct), [acts]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (acts.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          const idx = Number((visible[0].target as HTMLElement).dataset.actIndex);
          if (!Number.isNaN(idx)) setActive(idx);
        }
      },
      { threshold: [0.35, 0.6, 0.85], rootMargin: "-10% 0px -35% 0px" },
    );
    const sections = containerRef.current?.querySelectorAll<HTMLElement>("[data-act-index]");
    sections?.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [acts.length]);

  const frame = useInterpolatedFrame(frames, active);

  if (!result) return null;

  return (
    <main className="relative min-h-screen bg-[#05060c] text-white">
      <div className="fixed inset-0 z-0">
        <GenomeStage {...frame} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
      </div>

      <header className="fixed top-0 left-0 right-0 z-30 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <DnaMark size={28} background={false} color="#ffffff" />
            <span className="text-sm font-semibold">DNAI</span>
            <span className="ml-2 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/60">
              Récit
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/report"
              className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-white/75 transition hover:border-white/40 hover:text-white sm:px-3"
            >
              Rapport détaillé
            </Link>
          </div>
        </div>
      </header>

      <Progress total={acts.length} active={active} />

      <div ref={containerRef} className="relative z-10">
        {acts.map((act, i) => (
          <section
            key={act.id}
            data-act-index={i}
            className="flex min-h-screen items-center px-4 py-24 sm:px-8"
          >
            <div className="mx-auto w-full max-w-6xl">
              <div className="flex justify-start sm:justify-end">
                <ActPanel act={act} />
              </div>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

function Progress({ total, active }: { total: number; active: number }) {
  const pct = total > 1 ? (active / (total - 1)) * 100 : 0;
  return (
    <div className="fixed top-[52px] left-0 right-0 z-20 h-0.5 bg-white/5">
      <div
        className="h-0.5 bg-gradient-to-r from-[#7c9cff] to-[#c7b2ff] transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function useInterpolatedFrame(frames: StoryFrame[], active: number): StoryFrame {
  const current = frames[active];
  const [state, setState] = useState<StoryFrame>(
    current ?? {
      pose: { position: [0, 0, 24], target: [0, 0, 0], fov: 42 },
      highlights: [],
      mode: "helix",
    },
  );

  useEffect(() => {
    if (!current) return;
    setState(current);
  }, [active, current]);

  const mergedHighlights = useMemo<HighlightPoint[]>(() => {
    const map = new Map<string, HighlightPoint>();
    for (const h of state.highlights) map.set(h.id, h);
    return Array.from(map.values());
  }, [state.highlights]);

  return {
    pose: state.pose,
    highlights: mergedHighlights,
    focusChromosome: state.focusChromosome,
    mode: state.mode,
  };
}

