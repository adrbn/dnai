"use client";

import { useEffect } from "react";
import { useAnalysis } from "@/lib/store/analysis";
import { useLang, type Lang } from "@/lib/i18n/lang";

const COPY: Record<Lang, {
  phase: Record<string, string>;
  errorTitle: string;
  errorBody: string;
  defaultMessage: string;
  formatHint: string;
  retry: string;
  pickAnother: string;
}> = {
  fr: {
    phase: {
      fetch: "Chargement des bases",
      parse: "Lecture de votre ADN",
      annotate: "Annotation clinique & PGx",
    },
    errorTitle: "Échec de l'analyse",
    errorBody: "Le fichier n'a pas pu être lu.",
    defaultMessage: "Traitement en cours…",
    formatHint:
      "Formats pris en charge : MyHeritage (.csv), 23andMe / AncestryDNA / FTDNA (.txt/.zip), VCF single-sample (.vcf / .vcf.gz). Les VCF bgzipés très volumineux (WGS) peuvent dépasser la capacité mémoire de votre navigateur.",
    retry: "↻ Réessayer",
    pickAnother: "Choisir un autre fichier",
  },
  en: {
    phase: {
      fetch: "Loading databases",
      parse: "Reading your DNA",
      annotate: "Clinical & PGx annotation",
    },
    errorTitle: "Analysis failed",
    errorBody: "The file could not be read.",
    defaultMessage: "Processing…",
    formatHint:
      "Supported formats: MyHeritage (.csv), 23andMe / AncestryDNA / FTDNA (.txt/.zip), single-sample VCF (.vcf / .vcf.gz). Very large bgzipped VCFs (WGS) may exceed your browser's memory.",
    retry: "↻ Retry",
    pickAnother: "Choose another file",
  },
};

interface ProgressOverlayProps {
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ProgressOverlay({ onRetry, onDismiss }: ProgressOverlayProps) {
  const { status, progress, error, reset } = useAnalysis();
  const [lang] = useLang();
  const isVisible = status !== "idle" && status !== "done";

  useEffect(() => {
    if (!isVisible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const c = COPY[lang];
  const pct = Math.round((progress?.percent ?? 0) * 100);
  const phase = progress?.phase ?? "parse";
  const isError = status === "error";

  const handleDismiss = () => {
    (onDismiss ?? reset)();
  };

  return (
    <div className="fixed inset-0 z-[70] flex min-h-screen min-h-[100dvh] w-screen items-center justify-center bg-bg/85 backdrop-blur-lg">
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
          {isError ? c.errorTitle : c.phase[phase] ?? c.phase.parse}
        </div>
        <div className="mb-4 text-lg font-semibold">
          {/* Worker emits FR-hardcoded `message`; we ignore it for EN to avoid
              a mid-overlay language flip. The phase label above already
              describes the stage. */}
          {isError
            ? c.errorBody
            : lang === "fr"
              ? progress?.message ?? c.defaultMessage
              : c.defaultMessage}
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
              <div className="mt-2 text-xs text-fg-muted">{c.formatHint}</div>
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center gap-1.5 rounded-md border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition hover:bg-accent/20"
                >
                  {c.retry}
                </button>
              )}
              <button
                type="button"
                onClick={handleDismiss}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-4 py-2 text-sm font-medium text-fg transition hover:bg-surface-3"
              >
                {c.pickAnother}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
