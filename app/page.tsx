"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { FileDropper } from "@/components/ui/FileDropper";
import { ProgressOverlay } from "@/components/ui/ProgressOverlay";
import { DNAHelix } from "@/components/viz/DNAHelix";
import { runAnalysis } from "@/lib/analyzer-client";
import { useAnalysis } from "@/lib/store/analysis";
import { DnaMark } from "@/components/ui/DnaMark";

export default function Home() {
  const router = useRouter();
  const { setStatus, setProgress, setData, setError, reset } = useAnalysis();

  const onFile = useCallback(
    async (file: File) => {
      reset();
      setStatus("running");
      try {
        const data = await runAnalysis(file, { onProgress: setProgress });
        setData(data);
        router.push("/story");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Erreur inconnue";
        setError(msg);
      }
    },
    [reset, setStatus, setProgress, setData, setError, router],
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-grid">
      <ProgressOverlay />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-accent-2/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-stretch px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-10">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <DnaMark size={36} background={false} />
            <span className="text-lg font-semibold tracking-tight sm:text-xl">DNAI</span>
          </div>
          <a
            href="https://github.com/adrbn/dnai"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded-full border border-border bg-surface/60 px-3 py-1 text-[11px] text-fg-muted transition hover:border-accent/60 hover:text-fg sm:inline-flex"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.38 7.86 10.9.57.1.78-.25.78-.55v-1.93c-3.2.7-3.87-1.54-3.87-1.54-.53-1.33-1.3-1.69-1.3-1.69-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.78 2.73 1.27 3.4.97.1-.75.4-1.27.74-1.56-2.55-.3-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.18 1.18.92-.26 1.9-.39 2.88-.39s1.96.13 2.88.39c2.21-1.49 3.18-1.18 3.18-1.18.62 1.58.23 2.75.11 3.04.74.8 1.18 1.83 1.18 3.08 0 4.41-2.69 5.38-5.25 5.66.41.36.77 1.06.77 2.13v3.16c0 .3.21.66.79.55C20.21 21.38 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5Z" />
            </svg>
            <span>GitHub</span>
          </a>
        </header>

        <div className="mt-10 grid flex-1 items-center gap-8 sm:mt-14 sm:gap-10 md:grid-cols-2">
          <div className="animate-fade-in">
            <h1 className="text-[2.25rem] font-bold leading-[1.05] tracking-tight sm:text-5xl">
              Votre ADN,
              <br />
              <span className="bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">
                lu par vous seul.
              </span>
            </h1>
            <p className="mt-4 text-base text-fg-muted sm:mt-5 sm:text-lg">
              Déposez un fichier <span className="font-semibold text-fg">MyHeritage, 23andMe, Ancestry</span> ou un <span className="font-semibold text-fg">VCF</span>. L'analyse tourne localement — rien ne sort de votre machine.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-2.5 text-sm sm:gap-3">
              <Pill emoji="🧬" label="Puces ADN & WGS" />
              <Pill emoji="💊" label="CPIC / DPWG" />
              <Pill emoji="⚕️" label="ClinVar P/LP" />
              <Pill emoji="📊" label="Scores polygéniques" />
            </div>

            <div className="mt-8">
              <FileDropper onFile={onFile} />
            </div>

            <p className="mt-4 text-xs text-fg-muted/80">
              Outil éducatif — discutez toute découverte avec un professionnel de santé.
            </p>
          </div>

          <div className="relative hidden h-[720px] md:block">
            <DNAHelix className="absolute inset-0" />
          </div>
        </div>

        <footer className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-fg-muted sm:mt-16 md:flex-row">
          <div className="text-center md:text-left">DNAI · GRCh37/38 · ClinVar · CPIC · DPWG · PGS Catalog</div>
          <div className="flex items-center gap-1.5">
            <span>par</span>
            <a
              href="https://github.com/adrbn"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fg hover:text-accent hover:underline"
            >
              Adrien Robino
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}

function Pill({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface/60 px-3 py-2">
      <span className="text-lg">{emoji}</span>
      <span className="text-fg-muted">{label}</span>
    </div>
  );
}
