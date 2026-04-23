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
import { exportJson } from "@/lib/export";
import { DnaMark } from "@/components/ui/DnaMark";

type Tab = "overview" | "health" | "pharma" | "traits" | "risk" | "lookup" | "compare";

const TABS: { key: Tab; label: string; short: string }[] = [
  { key: "overview", label: "Vue", short: "Vue" },
  { key: "health", label: "Santé", short: "Santé" },
  { key: "pharma", label: "Pharmaco", short: "Rx" },
  { key: "risk", label: "Risque", short: "PRS" },
  { key: "traits", label: "Traits", short: "Traits" },
  { key: "lookup", label: "Recherche", short: "Rech." },
  { key: "compare", label: "Comparer", short: "Diff" },
];

export default function ReportPage() {
  const { result, positions, genotypes, reset } = useAnalysis();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfInfo, setPdfInfo] = useState<PdfUserInfo | null>(null);

  useEffect(() => {
    if (!result) router.replace("/");
  }, [result, router]);

  useEffect(() => {
    setPdfInfo(loadSavedPdfInfo());
  }, []);

  const handlePdfConfirm = (info: PdfUserInfo) => {
    setPdfInfo(info);
    setPdfModalOpen(false);
    setTimeout(() => window.print(), 80);
  };

  if (!result) return null;

  return (
    <main className="min-h-screen overflow-x-hidden bg-grid">
      <nav className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur-md no-print">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex shrink-0 items-center gap-2">
              <DnaMark size={32} className="rounded-lg" />
              <span className="text-sm font-semibold">DNAI</span>
            </Link>

            <div className="hidden lg:flex flex-1 justify-center">
              <TabList tabs={TABS} active={tab} onSelect={setTab} />
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => exportJson(result)}
                className="whitespace-nowrap rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-fg-muted hover:border-accent hover:text-accent sm:px-2.5"
              >
                JSON
              </button>
              <button
                type="button"
                onClick={() => setPdfModalOpen(true)}
                className="whitespace-nowrap rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-fg-muted hover:border-accent hover:text-accent sm:px-2.5"
              >
                PDF
              </button>
              <button
                type="button"
                onClick={() => {
                  reset();
                  router.push("/");
                }}
                className="whitespace-nowrap rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-fg-muted hover:border-danger hover:text-danger sm:px-2.5"
              >
                Effacer
              </button>
            </div>
          </div>

          <div className="mt-3 -mx-4 overflow-x-auto px-4 sm:px-6 lg:hidden">
            <TabList tabs={TABS} active={tab} onSelect={setTab} />
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-6 no-print sm:px-6 sm:py-8">
        <SummaryHeader result={result} active={tab} />
        <div className="animate-fade-in">
          {tab === "overview" && <OverviewSection result={result} positions={positions} />}
          {tab === "health" && <HealthSection findings={result.clinvar} />}
          {tab === "pharma" && <PharmaSection byDrug={result.pharma.byDrug} />}
          {tab === "risk" && <PRSSection findings={result.prs} />}
          {tab === "traits" && <TraitsSection findings={result.traits} />}
          {tab === "lookup" && <LookupSection genotypes={genotypes} positions={positions} />}
          {tab === "compare" && <CompareSection result={result} genotypes={genotypes} />}
        </div>
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
    <div className="inline-flex gap-0.5 rounded-xl border border-border bg-surface p-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onSelect(t.key)}
          type="button"
          className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium transition md:px-3 md:text-sm ${
            active === t.key
              ? "bg-accent/15 text-accent shadow-[inset_0_0_0_1px_rgb(var(--accent)/0.3)]"
              : "text-fg-muted hover:bg-surface-2 hover:text-fg"
          }`}
        >
          <span className="hidden md:inline">{t.label}</span>
          <span className="md:hidden">{t.short}</span>
        </button>
      ))}
    </div>
  );
}
