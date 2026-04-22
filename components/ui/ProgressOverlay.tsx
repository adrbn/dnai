"use client";

import { useAnalysis } from "@/lib/store/analysis";

const PHASE_LABEL: Record<string, string> = {
  fetch: "Chargement des bases",
  parse: "Lecture de votre ADN",
  annotate: "Annotation clinique & PGx",
};

export function ProgressOverlay() {
  const { status, progress, error } = useAnalysis();
  if (status === "idle" || status === "done") return null;

  const pct = Math.round((progress?.percent ?? 0) * 100);
  const phase = progress?.phase ?? "parse";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/85 backdrop-blur-lg">
      <div className="glass w-[min(90vw,440px)] rounded-2xl p-8 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center">
          <span className="relative flex h-3 w-3">
            <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-70" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-accent" />
          </span>
        </div>
        <div className="mb-1 text-sm font-medium uppercase tracking-widest text-accent">
          {PHASE_LABEL[phase]}
        </div>
        <div className="mb-4 text-lg font-semibold">{progress?.message ?? "Traitement en cours…"}</div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2 transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-2 text-right text-xs tabular-nums text-fg-muted">{pct}%</div>

        {status === "error" && (
          <div className="mt-4 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
            Erreur : {error}
          </div>
        )}
      </div>
    </div>
  );
}
