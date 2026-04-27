"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OverviewSection } from "@/components/sections/OverviewSection";
import { HealthSection } from "@/components/sections/HealthSection";
import { PharmaSection } from "@/components/sections/PharmaSection";
import { TraitsSection } from "@/components/sections/TraitsSection";
import { LookupSection } from "@/components/sections/LookupSection";
import { CompareSection } from "@/components/sections/CompareSection";
import { PRSSection } from "@/components/sections/PRSSection";
import { PrintReport } from "@/components/sections/PrintReport";
import { SummaryHeader } from "@/components/sections/SummaryHeader";
import {
  PdfOptionsModal,
  loadSavedPdfInfo,
  type PdfUserInfo,
} from "@/components/ui/PdfOptionsModal";
import { useAnalysis } from "@/lib/store/analysis";
import { fullReset } from "@/lib/store/full-reset";
import { exportJson } from "@/lib/export";
import { DnaMark } from "@/components/ui/DnaMark";
import { Paywall, useUnlockGate } from "@/components/Paywall";
import { MedicalDisclaimerBanner } from "@/components/MedicalDisclaimerBanner";
import { DataSourcesStrip } from "@/components/DataSourcesStrip";
import { useLang, type Lang } from "@/lib/i18n/lang";

type Tab = "overview" | "health" | "pharma" | "traits" | "risk" | "lookup" | "compare";

const TAB_LABELS: Record<Lang, Record<Tab, { label: string; short: string }>> = {
  fr: {
    overview: { label: "Vue", short: "Vue" },
    health: { label: "Santé", short: "Santé" },
    pharma: { label: "Pharmaco", short: "Rx" },
    risk: { label: "Risque", short: "PRS" },
    traits: { label: "Traits", short: "Traits" },
    lookup: { label: "Recherche", short: "Rech." },
    compare: { label: "Comparer", short: "Diff" },
  },
  en: {
    overview: { label: "Overview", short: "View" },
    health: { label: "Health", short: "Health" },
    pharma: { label: "Pharma", short: "Rx" },
    risk: { label: "Risk", short: "PRS" },
    traits: { label: "Traits", short: "Traits" },
    lookup: { label: "Lookup", short: "Find" },
    compare: { label: "Compare", short: "Diff" },
  },
};

const TAB_ORDER: Tab[] = ["overview", "health", "pharma", "risk", "traits", "lookup", "compare"];

const CHROME: Record<Lang, {
  eyebrow: string;
  story: string;
  reset: string;
  disclaimer: string;
}> = {
  fr: { eyebrow: "Rapport", story: "Récit →", reset: "Effacer", disclaimer: "Information seulement — pas un diagnostic." },
  en: { eyebrow: "Report", story: "Story →", reset: "Reset", disclaimer: "For information only — not a diagnosis." },
};

const RESET_CONFIRM: Record<Lang, string> = {
  fr: "Cela supprime le rapport sauvegardé localement sur cet appareil. Vous devrez ré-importer votre fichier ADN pour le reconstituer. Continuer ?",
  en: "This deletes the report saved locally on this device. You'll need to re-import your DNA file to rebuild it. Continue?",
};

export default function ReportPage() {
  const { result, positions, genotypes, hydrated: analysisHydrated, hydrate: hydrateAnalysis } = useAnalysis();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfInfo, setPdfInfo] = useState<PdfUserInfo | null>(null);
  const { unlocked, hydrated } = useUnlockGate();
  const [lang, setLang, langHydrated] = useLang();
  const tabs = TAB_ORDER.map((key) => ({ key, ...TAB_LABELS[lang][key] }));
  const chrome = CHROME[lang];

  useEffect(() => {
    void hydrateAnalysis();
  }, [hydrateAnalysis]);

  useEffect(() => {
    if (analysisHydrated && !result) router.replace("/");
  }, [analysisHydrated, result, router]);

  useEffect(() => {
    setPdfInfo(loadSavedPdfInfo());
  }, []);

  const handlePdfConfirm = (info: PdfUserInfo) => {
    setPdfInfo(info);
    setPdfModalOpen(false);
    setTimeout(() => window.print(), 80);
  };

  if (!analysisHydrated) return null;
  if (!result) return null;
  if (hydrated && !unlocked) return <Paywall eyebrow="Rapport" />;
  // Block first paint until both the unlock gate AND the lang preference
  // have read localStorage. Otherwise users land on FR for a beat even when
  // they picked EN on the homepage.
  if (!hydrated || !langHydrated) return null;

  return (
    <main className="min-h-screen overflow-x-hidden bg-grid">
      <div className="no-print">
        <MedicalDisclaimerBanner lang={lang} />
      </div>
      <nav className="sticky top-[34px] z-30 border-b border-border bg-paper/90 backdrop-blur-md no-print">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex shrink-0 items-baseline gap-2 rounded-sm px-2 py-1 hover:bg-ink/5">
              <span className="font-serif text-[20px] font-medium tracking-[-0.02em] text-ink">
                dnai<span className="text-oxblood">.</span>
              </span>
              <span className="text-[10px] uppercase tracking-[0.22em] text-ink/55">{chrome.eyebrow}</span>
            </Link>

            <div className="hidden lg:flex flex-1 justify-center">
              <TabList tabs={tabs} active={tab} onSelect={setTab} />
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <LangToggle lang={lang} onChange={setLang} />
              <Link
                href="/story"
                className="inline-flex items-center whitespace-nowrap rounded-sm border border-ink bg-ink px-3.5 py-2.5 text-xs font-medium text-paper transition hover:bg-ink/90 sm:px-4"
              >
                {chrome.story}
              </Link>
              <button
                type="button"
                onClick={() => exportJson(result)}
                className="inline-flex items-center whitespace-nowrap rounded-sm border border-border bg-surface px-3.5 py-2.5 text-xs text-ink/70 transition hover:border-ink hover:text-ink sm:px-4"
              >
                JSON
              </button>
              <button
                type="button"
                onClick={() => setPdfModalOpen(true)}
                className="inline-flex items-center whitespace-nowrap rounded-sm border border-border bg-surface px-3.5 py-2.5 text-xs text-ink/70 transition hover:border-ink hover:text-ink sm:px-4"
              >
                PDF
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!window.confirm(RESET_CONFIRM[lang])) return;
                  fullReset();
                  router.push("/");
                }}
                className="inline-flex items-center whitespace-nowrap rounded-sm border border-border bg-surface px-3.5 py-2.5 text-xs text-ink/70 transition hover:border-oxblood hover:text-oxblood sm:px-4"
              >
                {chrome.reset}
              </button>
            </div>
          </div>

          <div className="mt-3 -mx-4 overflow-x-auto px-4 sm:px-6 lg:hidden">
            <TabList tabs={tabs} active={tab} onSelect={setTab} />
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-6 no-print sm:px-6 sm:py-8">
        <SummaryHeader result={result} active={tab} lang={lang} />
        <div className="animate-fade-in">
          {tab === "overview" && <OverviewSection result={result} positions={positions} lang={lang} />}
          {tab === "health" && <HealthSection findings={result.clinvar} lang={lang} />}
          {tab === "pharma" && <PharmaSection byDrug={result.pharma.byDrug} lang={lang} />}
          {tab === "risk" && <PRSSection findings={result.prs} lang={lang} />}
          {tab === "traits" && <TraitsSection findings={result.traits} lang={lang} />}
          {tab === "lookup" && <LookupSection genotypes={genotypes} positions={positions} lang={lang} />}
          {tab === "compare" && <CompareSection result={result} genotypes={genotypes} lang={lang} />}
        </div>
        <DataSourcesStrip lang={lang} />
      </div>
      <div className="print-only">
        <PrintReport result={result} info={pdfInfo} />
      </div>

      {pdfInfo && (
        <PdfOptionsModal
          open={pdfModalOpen}
          initial={pdfInfo}
          onCancel={() => setPdfModalOpen(false)}
          onConfirm={handlePdfConfirm}
        />
      )}
    </main>
  );
}

function LangToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="inline-flex items-center rounded-sm border border-border bg-surface text-[10px] font-semibold uppercase tracking-[0.22em]">
      {(["fr", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          aria-pressed={lang === l}
          className={`px-2.5 py-2 transition ${
            lang === l ? "bg-ink text-paper" : "text-ink/55 hover:text-ink"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function TabList({
  tabs,
  active,
  onSelect,
}: {
  tabs: { key: Tab; label: string; short: string }[];
  active: Tab;
  onSelect: (t: Tab) => void;
}) {
  return (
    <div className="inline-flex gap-0 rounded-sm border border-border bg-surface">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onSelect(t.key)}
          type="button"
          className={`whitespace-nowrap border-r border-border px-3 py-2 text-xs font-medium uppercase tracking-[0.08em] transition last:border-r-0 md:px-4 ${
            active === t.key
              ? "bg-ink text-paper"
              : "text-ink/60 hover:bg-ink/5 hover:text-ink"
          }`}
        >
          <span className="hidden md:inline">{t.label}</span>
          <span className="md:hidden">{t.short}</span>
        </button>
      ))}
    </div>
  );
}
