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
        router.push("/report");
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
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <DnaMark size={40} className="rounded-xl" />
            <div>
              <div className="text-lg font-semibold leading-none tracking-tight">DNAI</div>
              <div className="text-xs text-fg-muted">Analyse ADN dans votre navigateur</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-fg-muted">
            <span className="inline-block h-2 w-2 rounded-full bg-ok" />
            100% client-side · open-source
          </div>
        </header>

        <div className="mt-8 grid flex-1 items-center gap-8 sm:mt-12 sm:gap-10 md:grid-cols-2">
          <div className="animate-fade-in">
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
              Votre ADN,
              <br />
              <span className="bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">
                lu par vous seul.
              </span>
            </h1>
            <p className="mt-4 text-base text-fg-muted sm:mt-5 sm:text-lg">
              Déposez votre fichier <span className="font-semibold text-fg">MyHeritage Raw DNA</span>.
              Le rapport s'assemble entièrement dans votre navigateur — pas d'envoi serveur, pas de compte,
              pas de pistage.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <Pill emoji="🧬" label="700 000 SNPs analysés" />
              <Pill emoji="💊" label="Pharmacogénomique CPIC" />
              <Pill emoji="⚕️" label="Variants ClinVar (P/LP)" />
              <Pill emoji="🔒" label="Aucune donnée transmise" />
            </div>

            <div className="mt-8">
              <FileDropper onFile={onFile} />
            </div>

            <p className="mt-4 text-xs text-fg-muted/80">
              Information non médicale. Discutez toute découverte avec un professionnel de santé.
            </p>
          </div>

          <div className="relative hidden h-[720px] md:block">
            <DNAHelix className="absolute inset-0" />
          </div>
        </div>

        <footer className="mt-16 flex flex-col items-center justify-between gap-2 border-t border-border pt-6 text-xs text-fg-muted md:flex-row">
          <div>DNAI · build GRCh37 · inspired by CPIC, ClinVar, SNPedia</div>
          <div className="flex items-center gap-1.5">
            <span>Fait avec</span>
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-3.5 w-3.5 text-fg"
              aria-label="amour"
            >
              <path d="M12 21s-7.5-4.58-10-10.08A5.5 5.5 0 0 1 12 5a5.5 5.5 0 0 1 10 5.92C19.5 16.42 12 21 12 21z" />
            </svg>
            <span>pour les curieux de leur génome · par</span>
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
