"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAnalysis } from "@/lib/store/analysis";
import { buildStory, type Act } from "@/lib/story/acts";
import { frameForAct, type StoryFrame } from "@/lib/story/poses";
import { GenomeStage } from "@/components/story/GenomeStage";
import { ActPanel } from "@/components/story/ActPanel";
import { TimelineRibbon } from "@/components/story/TimelineRibbon";
import { DnaMark } from "@/components/ui/DnaMark";
import type { HighlightPoint } from "@/components/story/Genome3D";
import { Paywall, useUnlockGate } from "@/components/Paywall";
import { MedicalDisclaimerBanner } from "@/components/MedicalDisclaimerBanner";

export default function StoryPage() {
  const { result, positions } = useAnalysis();
  const router = useRouter();
  const { unlocked, hydrated } = useUnlockGate();

  useEffect(() => {
    if (!result) router.replace("/");
  }, [result, router]);

  const acts: Act[] = useMemo(() => (result ? buildStory(result, positions) : []), [result, positions]);
  const frames: StoryFrame[] = useMemo(() => acts.map(frameForAct), [acts]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Gate the scroll listener on hydrated+unlocked: until those flip, the
  // <main> isn't mounted so containerRef.current is null. Without these deps
  // the effect runs once (container null), bails, and is never re-run —
  // active stays stuck at 0, timeline frozen, camera pose frozen.
  const storyMounted = hydrated && unlocked && acts.length > 0;
  useEffect(() => {
    if (!storyMounted) return;
    const root = containerRef.current;
    if (!root) return;

    // Pick whichever section's center is closest to viewport center. This
    // works even when sections are taller than the viewport (where no
    // IntersectionObserver threshold would ever fire cleanly).
    let raf = 0;
    const update = () => {
      raf = 0;
      const sections = root.querySelectorAll<HTMLElement>("[data-act-index]");
      const mid = window.innerHeight / 2;
      let bestIdx = 0;
      let bestDist = Infinity;
      sections.forEach((s) => {
        const r = s.getBoundingClientRect();
        const center = r.top + r.height / 2;
        const d = Math.abs(center - mid);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = Number(s.dataset.actIndex) || 0;
        }
      });
      setActive(bestIdx);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [storyMounted]);

  const frame = useInterpolatedFrame(frames, active);

  const jumpTo = (idx: number) => {
    const root = containerRef.current;
    if (!root) return;
    const section = root.querySelector<HTMLElement>(`[data-act-index="${idx}"]`);
    if (section) section.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  useEffect(() => {
    if (!storyMounted) return;
    const onKey = (e: KeyboardEvent) => {
      // Ignore when the user is typing in a field.
      const t = e.target as HTMLElement | null;
      if (t && /input|textarea|select/i.test(t.tagName)) return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        jumpTo(Math.min(acts.length - 1, active + 1));
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        jumpTo(Math.max(0, active - 1));
      } else if (e.key === "Home") {
        e.preventDefault();
        jumpTo(0);
      } else if (e.key === "End") {
        e.preventDefault();
        jumpTo(acts.length - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [storyMounted, acts.length, active]);

  if (!result) return null;
  if (hydrated && !unlocked) return <Paywall eyebrow="Récit" />;
  // While waiting for hydration, avoid flashing gated content
  if (!hydrated) return null;

  return (
    <main className="relative min-h-screen bg-[#1a1613] text-paper">
      <MedicalDisclaimerBanner tone="ink" />
      <div className="fixed inset-0 z-0">
        <GenomeStage {...frame} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#1a1613]/55 via-transparent to-[#1a1613]/75" />
      </div>

      <header className="fixed top-0 left-0 right-0 z-30 border-b border-paper/10 bg-[#1a1613]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="group flex items-baseline gap-2 rounded-sm px-2 py-1 hover:bg-paper/5">
            <span className="font-serif text-[20px] font-medium tracking-[-0.02em] text-paper">
              dnai<span className="text-oxblood">.</span>
            </span>
            <span className="ml-1 text-[10px] uppercase tracking-[0.22em] text-paper/55">
              Récit
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/report"
              className="inline-block rounded-sm border border-paper/20 bg-paper/5 px-3 py-2 text-xs font-medium tracking-[0.04em] text-paper/85 transition hover:border-paper/40 hover:bg-paper/10 hover:text-paper"
            >
              Rapport détaillé →
            </Link>
          </div>
        </div>
      </header>

      <Progress total={acts.length} active={active} />
      <TimelineRibbon acts={acts} active={active} onJump={jumpTo} />

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

