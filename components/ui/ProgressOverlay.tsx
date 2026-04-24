"use client";

import { useAnalysis } from "@/lib/store/analysis";

const PHASE_LABEL: Record<string, string> = {
  fetch: "Chargement des bases",
  parse: "Lecture de votre ADN",
  annotate: "Annotation clinique & PGx",
};

interface ProgressOverlayProps {
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ProgressOverlay({ onRetry, onDismiss }: ProgressOverlayProps) {
  const { status, progress, error, reset } = useAnalysis();
  if (status === "idle" || status === "done") return null;

  const pct = Math.round((progress?.percent ?? 0) * 100);
  const phase = progress?.phase ?? "parse";
  const isError = status === "error";

  const handleDismiss = () => {
    (onDismiss ?? reset)();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/85 backdrop-blur-lg">
      <div className="glass w-[min(90vw,460px)] rounded-2xl p-8 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center">
          <span className="relative flex h-3 w-3">
            <span
              className={`absolute inset-0 rounded-full ${isError ? "bg-danger" : "animate-ping bg-accent opacity-70"}`}
            />
            <span
              className={`relative inline-flex h-3 w-3 rounded-full ${isError ? "bg-danger" : "bg-accent"}`}
            />
          </span>
        </div>
        <div
          className={`mb-1 text-sm font-medium uppercase tracking-widest ${isError ? "text-danger" : "text-accent"}`}
        >
          {isError ? "Échec de l’analyse" : PHASE_LABEL[phase]}
        </div>
        <div className="mb-4 text-lg font-semibold">
          {isError ? "Le fichier n’a pas pu être lu." : progress?.message ?? "Traitement en cours…"}
        </div>

        {!isError && (
          <>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2 transition-[width] duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-2 text-right text-xs tabular-nums text-fg-muted">{pct}%</div>
          </>
        )}

        {isError && (
          <>
            <div className="mt-1 rounded-md border border-danger/40 bg-danger/10 p-3 text-left text-sm text-danger">
              <div className="font-mono text-xs opacity-80">{error}</div>
              <div className="mt-2 text-xs text-fg-muted">
                Formats pris en charge : MyHeritage (.csv), 23andMe / AncestryDNA / FTDNA (.txt/.zip),
                VCF single-sample (.vcf / .vcf.gz). Les VCF bgzipés très volumineux (WGS)
                peuvent dépasser la capacité mémoire de votre navigateur.
              </div>
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center gap-1.5 rounded-md border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition hover:bg-accent/20"
                >
                  ↻ Réessayer
                </button>
              )}
              <button
                type="button"
                onClick={handleDismiss}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-4 py-2 text-sm font-medium text-fg transition hover:bg-surface-3"
              >
                Choisir un autre fichier
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
